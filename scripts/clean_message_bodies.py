"""One-time backfill: strip quoted reply chains and normalize line endings on
messages saved before app.pipeline.clean_body existed. Safe to re-run (idempotent)."""

from app import db
from app.pipeline import clean_body


def run() -> None:
    with db.connect() as conn:
        rows = conn.execute(
            "select id, body from messages where direction = 'in'"
        ).fetchall()
        updated = 0
        for row in rows:
            cleaned = clean_body(row["body"])
            if cleaned != row["body"]:
                conn.execute(
                    "update messages set body = %s where id = %s", (cleaned, row["id"])
                )
                updated += 1
        print(f"Cleaned {updated} of {len(rows)} inbound messages.")


if __name__ == "__main__":
    run()
