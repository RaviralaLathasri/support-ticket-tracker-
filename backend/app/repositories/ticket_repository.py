from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.models import Ticket, TicketHistory

class TicketRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, ticket_id: int) -> Ticket:
        result = await self.db.execute(
            select(Ticket)
            .where(Ticket.id == ticket_id)
            .options(selectinload(Ticket.assigned_agent), selectinload(Ticket.creator))
        )
        return result.scalars().first()

    async def get_tickets(
        self,
        role: str,
        user_id: int,
        status: str = None,
        search: str = None
    ) -> list[Ticket]:
        query = select(Ticket).options(selectinload(Ticket.assigned_agent), selectinload(Ticket.creator))

        # Role-based visibility: Agents can only view their assigned tickets
        if role == "Agent":
            query = query.where(Ticket.assignedAgentId == user_id)

        # Filters
        if status:
            query = query.where(Ticket.status == status)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Ticket.title.ilike(search_pattern)) | 
                (Ticket.description.ilike(search_pattern))
            )

        # Order by newest first
        query = query.order_by(Ticket.createdAt.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_ticket(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        await self.db.flush()
        # Refresh to populate relationships
        result = await self.db.execute(
            select(Ticket)
            .where(Ticket.id == ticket.id)
            .options(selectinload(Ticket.assigned_agent), selectinload(Ticket.creator))
        )
        return result.scalars().first()

    async def add_history(self, history: TicketHistory) -> TicketHistory:
        self.db.add(history)
        await self.db.flush()
        return history

    async def get_history_by_ticket_id(self, ticket_id: int) -> list[TicketHistory]:
        result = await self.db.execute(
            select(TicketHistory)
            .where(TicketHistory.ticketId == ticket_id)
            .options(selectinload(TicketHistory.user))
            .order_by(TicketHistory.timestamp.asc())
        )
        return list(result.scalars().all())
