from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import Base, engine, SessionLocal
from app.models.models import User, Ticket, TicketHistory
from app.routers import auth_router, ticket_router
from sqlalchemy.future import select

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically generate SQLite tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. Seed mock users and initial tickets/histories if DB is empty
    async with SessionLocal() as db:
        result = await db.execute(select(User))
        existing_users = result.scalars().all()
        if not existing_users:
            # Seed users matching the prompt specifications
            john = User(id=1, name="John", role="Agent")
            sarah = User(id=2, name="Sarah", role="Agent")
            david = User(id=3, name="David", role="Manager")
            db.add_all([john, sarah, david])
            await db.commit()
            
            # Seed initial tickets to make dashboard functional out of the box
            ticket1 = Ticket(
                id=1,
                title="Database migration script failing in staging",
                description="Migration script 0023_add_user_roles.sql failed due to unique constraint violations on email fields.",
                status="New",
                assignedAgentId=john.id,
                createdBy=david.id
            )
            ticket2 = Ticket(
                id=2,
                title="Billing issue - double charge on subscription",
                description="The client was charged twice for the monthly enterprise plan on 2026-08-01. Please issue a refund for the second transaction.",
                status="In Progress",
                assignedAgentId=sarah.id,
                createdBy=david.id
            )
            ticket3 = Ticket(
                id=3,
                title="Application crashes on startup",
                description="The production application crash logs indicate an out-of-memory error when loading configuration files.",
                status="Resolved",
                assignedAgentId=john.id,
                createdBy=david.id
            )
            db.add_all([ticket1, ticket2, ticket3])
            await db.commit()
            
            # Seed history logs for pre-loaded tickets
            h1 = TicketHistory(ticketId=1, changedBy=david.id, oldStatus=None, newStatus="New")
            h2_1 = TicketHistory(ticketId=2, changedBy=david.id, oldStatus=None, newStatus="New")
            h2_2 = TicketHistory(ticketId=2, changedBy=sarah.id, oldStatus="New", newStatus="In Progress")
            h3_1 = TicketHistory(ticketId=3, changedBy=david.id, oldStatus=None, newStatus="New")
            h3_2 = TicketHistory(ticketId=3, changedBy=john.id, oldStatus="New", newStatus="In Progress")
            h3_3 = TicketHistory(ticketId=3, changedBy=john.id, oldStatus="In Progress", newStatus="Resolved")
            db.add_all([h1, h2_1, h2_2, h3_1, h3_2, h3_3])
            await db.commit()
            
    yield

app = FastAPI(
    title="AI Support Ticket Tracker API",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Enable CORS for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to return validation errors cleanly
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Include API Routers
app.include_router(auth_router.router)
app.include_router(ticket_router.router)

@app.get("/")
async def root():
    return {"status": "ok", "app": "AI Support Ticket Tracker API"}
