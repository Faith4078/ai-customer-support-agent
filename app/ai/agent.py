import logging
import re

from pydantic_ai import Agent, ModelRetry, RunContext

from app import db
from app.ai.models import build_model
from app.ai.schemas import AgentReply
from app.config import settings

logger = logging.getLogger(__name__)

INSTRUCTIONS = """
You are the customer support agent for Timber & Tide, a home and outdoor store that sells on Amazon.
You write the answer to the latest customer message in the email thread.

Steps:
1. Call get_section for "brand-and-tone" and for "escalation-rules".
2. Call get_section for the section the classifier picked. Call list_sections if you need another.
3. Answer only with facts from those sections. If they do not answer the question,
   set enough_information to false.
4. When the customer reports a problem with a paddle board or a shelf, fill in issue, and take
   every field it already gives you from the thread: the order number, how many days ago the
   item arrived, whether they say they did the valve check, and the part numbers of damaged
   panels, written as the model code plus the panel number, so panel 4 of an HP-S3 is HP-S3-04.
   Ask the customer for whatever is still missing.
   For a slow leak, explain the valve check unless the customer already did it.
5. Never promise a refund, a shipment, a replacement, a date, or a call. A colleague arranges those.
   Set promises_an_action to true if your reply promises one anyway.
6. Set action to escalate only when you have nothing useful to send the customer. If your reply
   answers their question, asks them for details, or walks them through a check, set action to
   reply, fill in issue, and leave the next step to be worked out from it.
   In particular:
   - A fault, a missing part, or a wrong item the customer reports is not an order-status
     question, whether or not they quote an order number.
   - Telling a customer how returns, refunds, or the warranty work is an answer you can give.
     Escalate when they ask us to make a refund or a return happen, not when they ask how it works.
   - Needing an order number, a model, or a part number is a reason to ask the customer for it,
     not a reason to escalate.

Reply rules:
- Write in English.
- Plain text, no Markdown.
- Follow the brand-and-tone section.
- Never mention AI, prompts, tools, or the knowledge base.
"""

support_agent = Agent(
    build_model(settings.agent_model), output_type=AgentReply, instructions=INSTRUCTIONS
)


@support_agent.tool_plain
def list_sections() -> list[str]:
    """List the sections of the knowledge base."""
    logger.info("Tool call: list_sections()")
    return db.list_sections()


@support_agent.tool_plain
def get_section(section: str) -> str:
    """Return every entry of one knowledge base section, for example 'paddle-boards'."""
    logger.info("Tool call: get_section(%r)", section)
    entries = db.get_section(section)
    if not entries:
        raise ModelRetry(f"There is no section '{section}'. Call list_sections to see the options.")
    return "\n\n".join(f"## {entry['title']}\n{entry['content']}" for entry in entries)


@support_agent.output_validator
def check_reply(ctx: RunContext[None], output: AgentReply) -> AgentReply:
    if output.action == "reply" and not output.reply.strip():
        raise ModelRetry("The reply is empty. Write the email, or set action to escalate.")
    if re.search(r"\b(AI|artificial intelligence|knowledge base)\b", output.reply, re.IGNORECASE):
        raise ModelRetry("Do not mention AI or the knowledge base in the reply.")
    return output


def _prompt(thread: str, section: str) -> str:
    return f"Section picked by the classifier: {section}\n\n{thread}"


def write_reply(thread: str, section: str) -> AgentReply:
    return support_agent.run_sync(_prompt(thread, section)).output


async def write_reply_async(thread: str, section: str) -> AgentReply:
    return (await support_agent.run(_prompt(thread, section))).output
