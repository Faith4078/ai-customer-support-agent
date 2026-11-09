"""How the agents talk to Gemini: retries on transient errors, and pacing under the quota.

Two things bite when several emails are in flight at once, for example during an eval run:

1. google-genai does not retry at all unless you hand it `HttpRetryOptions`. Its default
   retry strategy is `stop_after_attempt(1)`, so a single HTTP 429 or 503 ends the run with
   a `ModelRateLimitError` that looks like a connection problem.
2. The Gemini free tier allows a small number of requests per minute *per model*. One email
   costs about five requests (one classifier call, then one agent call per tool round trip),
   so a handful of concurrent emails blows the quota in seconds and no amount of retrying
   gets the work done any faster.

Retries handle the occasional blip; the throttle keeps us from causing the blips.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict

from google.genai.types import HttpRetryOptions
from pydantic_ai.exceptions import ModelRateLimitError
from pydantic_ai.messages import ModelMessage, ModelResponse
from pydantic_ai.models import Model, ModelRequestParameters
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.wrapper import WrapperModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.settings import ModelSettings

from app.config import settings

logger = logging.getLogger(__name__)

GOOGLE_PREFIXES = ("google:", "google-gla:", "google-vertex:")

# Google answers a per-minute 429 with a `RetryInfo` asking for up to a minute, so the backoff
# has to be able to wait that long and try often enough to outlast one quota window.
RETRY_OPTIONS = HttpRetryOptions(attempts=6, initial_delay=2.0, max_delay=60.0, exp_base=2.0)

# A free-tier key also has a *per day* cap, which for some models is as low as 20 requests. A 429
# that names it is not transient: retrying burns minutes per request and still fails.
DAILY_QUOTA_ID = "PerDay"


class RateLimiter:
    """A token bucket over a sliding one-minute window, shared by everything on one key."""

    def __init__(self, requests_per_minute: int) -> None:
        self.requests_per_minute = requests_per_minute
        self._times: list[float] = []
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        if self.requests_per_minute <= 0:
            return
        async with self._lock:
            while True:
                now = time.monotonic()
                self._times = [t for t in self._times if now - t < 60.0]
                if len(self._times) < self.requests_per_minute:
                    self._times.append(now)
                    return
                wait = 60.0 - (now - self._times[0])
                logger.info("Rate limit reached, waiting %.1fs before the next request", wait)
                await asyncio.sleep(wait)


class DailyQuotaExhausted(RuntimeError):
    """The key's requests-per-day quota for a model is gone. Waiting will not help today."""


class ThrottledModel(WrapperModel):
    """Waits for a slot in the per-minute quota, and stops dead on the per-day one.

    The per-day cap is latched: once Google has told us the day is over for this model, every
    later request fails at once instead of spending six retries and several minutes each to be
    told the same thing. That is the difference between an eval run that reports a clear reason
    in seconds and one that appears to hang.
    """

    def __init__(self, wrapped: Model, limiter: RateLimiter) -> None:
        super().__init__(wrapped)
        self.limiter = limiter
        self._daily_quota_gone = False

    def _check_daily_quota(self) -> None:
        if self._daily_quota_gone:
            raise DailyQuotaExhausted(
                f"The requests-per-day quota for {self.model_name} is used up. Point "
                f"AGENT_MODEL/CLASSIFIER_MODEL at another model or enable billing for the key."
            )

    async def request(
        self,
        messages: list[ModelMessage],
        model_settings: ModelSettings | None,
        model_request_parameters: ModelRequestParameters,
    ) -> ModelResponse:
        self._check_daily_quota()
        await self.limiter.acquire()
        try:
            return await super().request(messages, model_settings, model_request_parameters)
        except ModelRateLimitError as error:
            if DAILY_QUOTA_ID in str(error.body):
                self._daily_quota_gone = True
                logger.error("Daily quota for %s is used up", self.model_name)
                self._check_daily_quota()
            raise


# One bucket per model name: the quota is per model, so the classifier and the agent
# each get their own allowance.
_limiters: defaultdict[str, RateLimiter] = defaultdict(
    lambda: RateLimiter(settings.model_requests_per_minute)
)

# One provider, so both agents share a client and its connection pool.
_provider: GoogleProvider | None = None


def _google_provider() -> GoogleProvider:
    global _provider
    if _provider is None:
        _provider = GoogleProvider(retry_options=RETRY_OPTIONS)
    return _provider


def build_model(name: str) -> Model | str:
    """Build the model for a `MODEL` setting, wrapped so it retries and stays under the quota.

    A non-Google model name is handed back untouched for Pydantic AI to infer, so switching
    provider in `.env` keeps working; it just does not get the Gemini-specific retry options.
    """
    if not name.startswith(GOOGLE_PREFIXES):
        return name
    model_name = name.split(":", 1)[1]
    model: Model = GoogleModel(model_name, provider=_google_provider())
    return ThrottledModel(model, _limiters[model_name])
