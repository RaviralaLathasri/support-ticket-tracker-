import os
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

PORT = int(os.getenv("PORT", 8000))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./support_tickets.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
