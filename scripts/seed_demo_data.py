"""Seed realistic tickets, messages, and events for a demo.

Safe to re-run: clears demo rows (gmail ids prefixed with "demo-") and re-inserts them,
so it never touches real Gmail-sourced data.
"""

from datetime import datetime, timedelta

from app import db

NOW = datetime.now()


def ago(**kwargs) -> datetime:
    return NOW - timedelta(**kwargs)


TICKETS = [
    {
        "thread": "demo-thread-1",
        "email": "jmorales@example.com",
        "subject": "Paddle board losing air overnight",
        "category": "paddle-boards",
        "status": "escalated",
        "proposed_action": (
            "Valve check didn't fix it and the board is 42 days past delivery — "
            "send a patch kit for order #AMZ-7731-204 (11' All-round)."
        ),
        "updated": ago(minutes=12),
        "messages": [
            ("in", "jmorales@example.com", ago(hours=5, minutes=0),
             "Hi, my 11' board keeps losing pressure overnight, down about 4 PSI by morning. "
             "I've had it almost 6 weeks now."),
            ("out", "support@timberandtide.com", ago(hours=4, minutes=50),
             "Thanks for reaching out! Most slow leaks come from a loose valve core rather than "
             "the board itself. Could you try this:\n\n1. Inflate to 15 PSI.\n2. Spray soapy water "
             "on the valve — bubbles mean air is escaping there.\n3. Turn the valve core a quarter "
             "turn clockwise with the included wrench.\n4. Re-check the pressure after 24 hours.\n\n"
             "Let us know how it goes!"),
            ("in", "jmorales@example.com", ago(minutes=20),
             "Did the valve check, bubbles were there, tightened it, waited 24h — still losing "
             "about 3 PSI. Order number is AMZ-7731-204."),
        ],
    },
    {
        "thread": "demo-thread-2",
        "email": "k.nakamura@example.com",
        "subject": "Bookcase arrived with a cracked side panel",
        "category": "shelving",
        "status": "escalated",
        "proposed_action": (
            "Two side panels (HP-S5-01, HP-S5-02) arrived cracked on order #AMZ-5519-887 — "
            "ship replacement panels by part number."
        ),
        "updated": ago(hours=1, minutes=5),
        "messages": [
            ("in", "k.nakamura@example.com", ago(hours=3),
             "Opened the box for the HP-S5 bookcase today and both side panels have cracks near "
             "the cam lock holes. Everything else looks fine. Order #AMZ-5519-887."),
            ("out", "support@timberandtide.com", ago(hours=2, minutes=40),
             "Sorry about that! Could you send a quick photo of both panels so we can confirm the "
             "part numbers before arranging a replacement?"),
            ("in", "k.nakamura@example.com", ago(hours=1, minutes=5),
             "Attached. Part number stickers say HP-S5-01 and HP-S5-02."),
        ],
    },
    {
        "thread": "demo-thread-3",
        "email": "priya.s@example.com",
        "subject": "Missing hardware kit in cube shelf order",
        "category": "shelving",
        "status": "answered",
        "proposed_action": None,
        "updated": ago(hours=6),
        "messages": [
            ("in", "priya.s@example.com", ago(hours=7),
             "My HP-C4 cube shelf box didn't include the hardware kit, just the panels. Order "
             "#AMZ-2204-119."),
            ("out", "support@timberandtide.com", ago(hours=6),
             "Thanks for flagging this — we're shipping the HK-C hardware kit for your HP-C4 "
             "free of charge. It leaves our warehouse within 2 business days and you'll get a "
             "tracking link by email once it's on its way."),
        ],
    },
    {
        "thread": "demo-thread-4",
        "email": "d.okafor@example.com",
        "subject": "What size board for two riders?",
        "category": "paddle-boards",
        "status": "answered",
        "proposed_action": None,
        "updated": ago(hours=9),
        "messages": [
            ("in", "d.okafor@example.com", ago(hours=10),
             "My partner and I want to paddle together sometimes, combined weight maybe 150kg. "
             "Which board should we get?"),
            ("out", "support@timberandtide.com", ago(hours=9),
             "For two riders together we'd recommend the 11' All-round — it's rated up to 110kg "
             "and is our most stable board, good for two lighter riders. If you're often near "
             "150kg combined or want more speed for longer trips, the 12'6\" Touring (up to 130kg) "
             "is the better fit."),
        ],
    },
    {
        "thread": "demo-thread-5",
        "email": "l.bergstrom@example.com",
        "subject": "Wrong finish delivered — ordered walnut, got white",
        "category": "shelving",
        "status": "escalated",
        "proposed_action": "Exchange the HP-S3 for the correct walnut finish, order #AMZ-9042-331.",
        "updated": ago(hours=14),
        "messages": [
            ("in", "l.bergstrom@example.com", ago(hours=15),
             "Ordered the HP-S3 in walnut, received white instead. Order #AMZ-9042-331."),
            ("out", "support@timberandtide.com", ago(hours=14, minutes=30),
             "Sorry about the mix-up! Could you confirm the order number so we can get the "
             "correct walnut finish sent out?"),
            ("in", "l.bergstrom@example.com", ago(hours=14),
             "Confirmed, it's AMZ-9042-331."),
        ],
    },
    {
        "thread": "demo-thread-6",
        "email": "m.fontaine@example.com",
        "subject": "How long does a refund take through Amazon?",
        "category": "returns-and-warranty",
        "status": "answered",
        "proposed_action": None,
        "updated": ago(days=1, hours=2),
        "messages": [
            ("in", "m.fontaine@example.com", ago(days=1, hours=3),
             "Started a return on Amazon for my paddle board, how long until I see the refund?"),
            ("out", "support@timberandtide.com", ago(days=1, hours=2),
             "Once a return is started in Your Orders on Amazon, Amazon handles the return label "
             "and the refund timing directly — we don't have visibility into that from our side, "
             "but Amazon's return page should show the expected refund date."),
        ],
    },
    {
        "thread": "demo-thread-7",
        "email": "r.haddad@example.com",
        "subject": "Tracking number for replacement parts",
        "category": "shipping",
        "status": "open",
        "proposed_action": None,
        "updated": ago(minutes=35),
        "messages": [
            ("in", "r.haddad@example.com", ago(minutes=35),
             "You mentioned you'd ship a replacement fin for my board, any tracking yet? Order "
             "#AMZ-6610-042."),
        ],
    },
    {
        "thread": "demo-thread-8",
        "email": "s.verhoeven@example.com",
        "subject": "Split seam on paddle board",
        "category": "paddle-boards",
        "status": "escalated",
        "proposed_action": (
            "Seam split along the rail on a 12'6\" Touring board, order #AMZ-3387-556 — "
            "always goes to a person, needs manual review."
        ),
        "updated": ago(minutes=50),
        "messages": [
            ("in", "s.verhoeven@example.com", ago(hours=1),
             "There's a split along the seam on the rail of my touring board, maybe 10cm long. "
             "Only had it 3 weeks. Order #AMZ-3387-556."),
        ],
    },
]

EVENT_ONLY = [
    ("demo-event-1", "processed", 1, None, ago(minutes=12)),
    ("demo-event-2", "processed", 1, None, ago(hours=1, minutes=5)),
    ("demo-event-3", "processed", 1, None, ago(hours=6)),
    ("demo-event-4", "processed", 1, None, ago(hours=9)),
    ("demo-event-5", "processed", 1, None, ago(hours=14)),
    ("demo-event-6", "processed", 1, None, ago(days=1, hours=2)),
    ("demo-event-7", "processed", 1, None, ago(minutes=35)),
    ("demo-event-8", "processed", 1, None, ago(minutes=50)),
    ("demo-event-9", "skipped", 1, None, ago(hours=3)),
    ("demo-event-10", "failed", 2, "Gemini API timed out after 30s", ago(hours=20)),
]


def seed() -> None:
    with db.connect() as conn:
        conn.execute("delete from messages where gmail_message_id like 'demo-%'")
        conn.execute("delete from tickets where gmail_thread_id like 'demo-%'")
        conn.execute("delete from events where gmail_message_id like 'demo-%'")

        for ticket in TICKETS:
            row = conn.execute(
                """
                insert into tickets
                  (gmail_thread_id, customer_email, subject, category, status,
                   proposed_action, updated_at)
                values (%s, %s, %s, %s, %s, %s, %s)
                returning id
                """,
                (
                    ticket["thread"],
                    ticket["email"],
                    ticket["subject"],
                    ticket["category"],
                    ticket["status"],
                    ticket["proposed_action"],
                    ticket["updated"],
                ),
            ).fetchone()
            ticket_id = row["id"]

            for i, (direction, sender, when, body) in enumerate(ticket["messages"]):
                conn.execute(
                    """
                    insert into messages
                      (ticket_id, gmail_message_id, direction, from_address, body, created_at)
                    values (%s, %s, %s, %s, %s, %s)
                    """,
                    (ticket_id, f"{ticket['thread']}-msg-{i}", direction, sender, body, when),
                )

            conn.execute(
                """
                insert into events (gmail_message_id, status, attempts, error, created_at, processed_at)
                values (%s, 'processed', 1, null, %s, %s)
                """,
                (f"{ticket['thread']}-msg-0", ticket["messages"][0][2], ticket["updated"]),
            )

        for message_id, status, attempts, error, when in EVENT_ONLY:
            conn.execute(
                """
                insert into events (gmail_message_id, status, attempts, error, created_at, processed_at)
                values (%s, %s, %s, %s, %s, %s)
                """,
                (message_id, status, attempts, error, when, when if status != "failed" else None),
            )

    print(f"Seeded {len(TICKETS)} tickets and {len(TICKETS) + len(EVENT_ONLY)} events.")


if __name__ == "__main__":
    seed()
