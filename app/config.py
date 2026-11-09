from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env into the environment, so Pydantic AI also finds GOOGLE_API_KEY.
load_dotenv()


class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_refresh_token: str
    database_url: str
    classifier_model: str = "google:gemini-3.5-flash-lite"
    agent_model: str = "google:gemini-3.8-flash"
    # Requests per minute per model. The Gemini free tier allows 15; stay under it so
    # concurrent work queues instead of failing with 429s. Set to 0 to turn it off.
    model_requests_per_minute: int = 12
    poll_interval_seconds: int = 60
    dashboard_username: str = "admin"
    dashboard_password: str = ""


settings = Settings()