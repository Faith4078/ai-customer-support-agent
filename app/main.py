from fastapi import FastAPI

app = FastAPI(title="AI customer support")


@app.get("/")
def root() -> dict:
    return {"service": "ai-customer-support", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
