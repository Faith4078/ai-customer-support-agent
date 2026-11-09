# ai-customer-support

## Setup

```powershell
uv sync
```

## Running

Poller (watch mode, restarts on edits to `app/` or `.env`):

```powershell
uv run watchfiles ".venv\Scripts\python.exe -m app.poller" app .env
```

Poller (one-off, no watching):

```powershell
uv run python -m app.poller
```

API:

```powershell
uv run fastapi dev app/main.py
```

### Why `.venv\Scripts\python.exe` and not just `python`

watchfiles starts your command as a raw subprocess. On Windows a bare `python`
is resolved by the OS, which ignores the PATH that `uv run` set up and finds the
global interpreter instead — so the project's packages are missing and you get
`ModuleNotFoundError: No module named 'googleapiclient'`. Spelling out the venv
interpreter removes the guesswork.
