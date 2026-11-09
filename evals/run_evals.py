from dataclasses import dataclass

from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from app.ai.decide import decide_async
from app.ai.schemas import Decision
from evals.golden_emails import GOLDEN_EMAILS

# The Gemini free tier allows a handful of requests per minute per model and one email costs
# about five of them, so the cases queue behind `settings.model_requests_per_minute` anyway.
# Keeping concurrency low means fewer requests are in flight when a quota window closes.
MAX_CONCURRENCY = 3


@dataclass
class SectionMatches(Evaluator):
    def evaluate(self, ctx: EvaluatorContext) -> bool:
        return ctx.output.section == ctx.expected_output["section"]


@dataclass
class ActionMatches(Evaluator):
    def evaluate(self, ctx: EvaluatorContext) -> bool:
        return ctx.output.action == ctx.expected_output["action"]


async def run_pipeline(email: str) -> Decision:
    """Async on purpose: a sync task would be run on a worker thread per case, and the agents
    would then share one Gemini HTTP client across several event loops."""
    return await decide_async(email)


dataset = Dataset(
    name="golden-emails",
    cases=[
        Case(
            name=case["name"],
            inputs=case["email"],
            expected_output={"section": case["section"], "action": case["action"]},
        )
        for case in GOLDEN_EMAILS
    ],
    evaluators=[SectionMatches(), ActionMatches()],
)

if __name__ == "__main__":
    report = dataset.evaluate_sync(run_pipeline, max_concurrency=MAX_CONCURRENCY)
    report.print(include_input=False, include_output=True, include_durations=False)
