import logging
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from psycopg.errors import UniqueViolation
from pydantic import BaseModel

from app import db
from app.config import settings
from app.gmail import Gmail
from app.poller import poll_once

logger = logging.getLogger("dashboard")

app = FastAPI(title="AI customer support")
security = HTTPBasic(auto_error=False)


def require_login(credentials: HTTPBasicCredentials | None = Depends(security)) -> None:
    valid = (
        credentials is not None
        and settings.dashboard_password != ""
        and secrets.compare_digest(credentials.username.encode(), settings.dashboard_username.encode())
        and secrets.compare_digest(credentials.password.encode(), settings.dashboard_password.encode())
    )
    if not valid:
        raise HTTPException(status_code=401, detail="Wrong username or password")


class EntryUpdate(BaseModel):
    title: str
    content: str


class EntryCreate(BaseModel):
    section: str
    title: str
    content: str


class MessageCreate(BaseModel):
    body: str


class StatusUpdate(BaseModel):
    status: str


TICKET_STATUSES = {"open", "answered", "escalated", "closed"}

api = APIRouter(prefix="/api", dependencies=[Depends(require_login)])


@api.get("/login")
def login() -> dict:
    return {"ok": True}


@api.get("/events")
def events() -> list[dict]:
    return db.list_events()


@api.get("/tickets")
def tickets() -> list[dict]:
    return db.list_tickets()


@api.get("/tickets/{ticket_id}/messages")
def ticket_messages(ticket_id: int) -> list[dict]:
    return db.list_messages(ticket_id)


@api.get("/knowledge-base")
def knowledge_base() -> list[dict]:
    return db.list_knowledge_base()


@api.put("/knowledge-base/{entry_id}")
def update_entry(entry_id: int, update: EntryUpdate) -> dict:
    entry = db.update_knowledge_base_entry(entry_id, update.title, update.content)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@api.post("/knowledge-base")
def create_entry(entry: EntryCreate) -> dict:
    try:
        return db.create_knowledge_base_entry(entry.section, entry.title, entry.content)
    except UniqueViolation:
        raise HTTPException(
            status_code=409, detail="An entry with this title already exists in this section"
        )


@api.delete("/knowledge-base/{entry_id}")
def delete_entry(entry_id: int) -> dict:
    db.delete_knowledge_base_entry(entry_id)
    return {"ok": True}


@api.post("/poll")
def poll() -> dict:
    return {"messages": poll_once()}


@api.patch("/tickets/{ticket_id}/status")
def set_ticket_status(ticket_id: int, update: StatusUpdate) -> dict:
    if update.status not in TICKET_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    ticket = db.set_ticket_status(ticket_id, update.status)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@api.post("/tickets/{ticket_id}/messages")
def reply_to_ticket(ticket_id: int, payload: MessageCreate) -> dict:
    ticket = db.get_ticket(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    inbound = db.last_inbound_message(ticket_id)
    sent_id = f"manual-{secrets.token_hex(8)}"
    from_address = "support@timberandtide.com"
    delivered = False
    if inbound is not None:
        try:
            gmail = Gmail()
            message = gmail.get_message(inbound["gmail_message_id"])
            sent = gmail.send_reply(message, payload.body)
            sent_id = sent["id"]
            from_address = gmail.address
            delivered = True
        except Exception:
            logger.exception("Couldn't send reply through Gmail for ticket %s", ticket_id)

    saved = db.save_reply(ticket_id, sent_id, from_address, payload.body)
    db.set_ticket_status(ticket_id, "answered")
    return {"message": saved, "delivered": delivered}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(api)

# The built dashboard. Mounted last, so the API routes above take precedence.
dashboard = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if dashboard.exists():
    app.mount("/", StaticFiles(directory=dashboard, html=True), name="dashboard")