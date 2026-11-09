from app.ai.agent import write_reply, write_reply_async
from app.ai.classifier import classify, classify_async
from app.ai.rules import CUSTOMER_STEPS, resolve_issue
from app.ai.schemas import AgentReply, Classification, Decision


def decide(thread: str, has_attachments: bool = False) -> Decision:
    """Run the AI steps for one email thread. The models propose, this function decides."""
    classification = classify(thread)
    if (early := _before_reply(classification, has_attachments)) is not None:
        return early
    answer = write_reply(thread, classification.section)
    return _from_reply(classification, answer)


async def decide_async(thread: str, has_attachments: bool = False) -> Decision:
    """`decide` for callers that already have an event loop, such as the eval runner.

    Several threads each driving their own loop would share one Gemini HTTP client between
    them, which Pydantic AI may replace out from under a request in flight. Concurrent
    callers belong on one loop.
    """
    classification = await classify_async(thread)
    if (early := _before_reply(classification, has_attachments)) is not None:
        return early
    answer = await write_reply_async(thread, classification.section)
    return _from_reply(classification, answer)


def _escalate(
    classification: Classification, reason: str, proposed_action: str | None = None
) -> Decision:
    return Decision(
        action="escalate",
        section=classification.section,
        reply=classification.acknowledgement,
        reason=reason,
        proposed_action=proposed_action,
    )


def _before_reply(classification: Classification, has_attachments: bool) -> Decision | None:
    """The checks that settle the email before the support agent writes anything."""
    if has_attachments:
        return _escalate(classification, "The email has attachments")
    if classification.needs_human:
        return _escalate(classification, classification.reason)
    return None


def _from_reply(classification: Classification, answer: AgentReply) -> Decision:
    """Turn the agent's proposal into the decision. The model proposes, Python decides."""
    if answer.action == "escalate":
        return _escalate(classification, answer.reasoning)
    if not answer.enough_information:
        return _escalate(classification, "The knowledge base does not answer this")
    if answer.issue:
        step = resolve_issue(answer.issue)
        if step not in CUSTOMER_STEPS:
            return _escalate(classification, f"Next step: {step}", proposed_action=step)
    if answer.promises_an_action:
        return _escalate(classification, "The reply promises an action")

    return Decision(
        action="reply",
        section=classification.section,
        reply=answer.reply,
        reason=answer.reasoning,
    )
