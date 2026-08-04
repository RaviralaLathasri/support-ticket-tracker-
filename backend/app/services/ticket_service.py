from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.ticket_repository import TicketRepository
from app.repositories.user_repository import UserRepository
from app.models.models import Ticket, TicketHistory
from app.schemas.schemas import TicketCreate, TicketStatusUpdate

class TicketService:
    def __init__(self, db: AsyncSession):
        self.ticket_repo = TicketRepository(db)
        self.user_repo = UserRepository(db)

    async def get_tickets(self, user_id: int, status_filter: str = None, search: str = None) -> list[Ticket]:
        # Authenticate user to check role
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User with ID {user_id} does not exist."
            )
        return await self.ticket_repo.get_tickets(user.role, user.id, status_filter, search)

    async def get_ticket_by_id(self, ticket_id: int, user_id: int) -> Ticket:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user.")

        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

        # Agents can only view tickets assigned to them
        if user.role == "Agent" and ticket.assignedAgentId != user.id:
            raise HTTPException(
                status_code=status.HTTP_430_FORBIDDEN if hasattr(status, "HTTP_430_FORBIDDEN") else status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned to this ticket."
            )

        return ticket

    async def create_ticket(self, ticket_in: TicketCreate, creator_id: int) -> Ticket:
        creator = await self.user_repo.get_by_id(creator_id)
        if not creator:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid creator user.")

        # Validate that creator is a Manager (as only Managers can create & assign tickets)
        if creator.role != "Manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only Managers can create tickets."
            )

        # Validate assigned agent
        if not ticket_in.assignedAgentId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned agent is required when creating a ticket."
            )

        agent = await self.user_repo.get_by_id(ticket_in.assignedAgentId)
        if not agent or agent.role != "Agent":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned agent must be a valid user with the 'Agent' role."
            )

        db_ticket = Ticket(
            title=ticket_in.title,
            description=ticket_in.description,
            assignedAgentId=ticket_in.assignedAgentId,
            createdBy=creator_id,
            status="New"
        )
        created_ticket = await self.ticket_repo.create_ticket(db_ticket)

        # Log initial history entry
        history = TicketHistory(
            ticketId=created_ticket.id,
            changedBy=creator_id,
            oldStatus=None,
            newStatus="New"
        )
        await self.ticket_repo.add_history(history)
        await self.ticket_repo.db.commit()

        return created_ticket

    async def update_ticket_status(self, ticket_id: int, status_update: TicketStatusUpdate) -> Ticket:
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

        user = await self.user_repo.get_by_id(status_update.changedBy)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User performing the action not found.")

        # Agent restrictions
        if user.role == "Agent":
            if ticket.assignedAgentId != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Agents can only update status of tickets assigned to them."
                )

            # Validate Agent allowed transitions: New -> In Progress, In Progress -> Resolved
            if ticket.status == "New" and status_update.status == "In Progress":
                pass
            elif ticket.status == "In Progress" and status_update.status == "Resolved":
                pass
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transition: Agents cannot transition tickets from '{ticket.status}' to '{status_update.status}'."
                )

        # Manager restrictions
        elif user.role == "Manager":
            # Managers can transition New -> In Progress, In Progress -> Resolved, and Resolved -> In Progress (Reopen)
            if ticket.status == "New" and status_update.status == "In Progress":
                pass
            elif ticket.status == "In Progress" and status_update.status == "Resolved":
                pass
            elif ticket.status == "Resolved" and status_update.status == "In Progress":
                pass  # Reopen ticket
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transition: Managers cannot transition tickets from '{ticket.status}' to '{status_update.status}'."
                )
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role not authorized to change status.")

        # Log history
        history = TicketHistory(
            ticketId=ticket.id,
            changedBy=user.id,
            oldStatus=ticket.status,
            newStatus=status_update.status
        )
        await self.ticket_repo.add_history(history)

        # Update status
        ticket.status = status_update.status
        await self.ticket_repo.db.commit()
        return ticket

    async def assign_ticket(self, ticket_id: int, agent_id: int, manager_id: int) -> Ticket:
        manager = await self.user_repo.get_by_id(manager_id)
        if not manager or manager.role != "Manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only Managers can assign or reassign tickets."
            )

        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

        agent = await self.user_repo.get_by_id(agent_id)
        if not agent or agent.role != "Agent":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tickets can only be assigned to active users with the 'Agent' role."
            )

        ticket.assignedAgentId = agent_id
        await self.ticket_repo.db.commit()
        return ticket

    async def get_ticket_history(self, ticket_id: int, user_id: int) -> list[TicketHistory]:
        # Validate user
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user.")

        # Validate ticket access (Agents can only view history of their assigned tickets)
        ticket = await self.ticket_repo.get_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found.")

        if user.role == "Agent" and ticket.assignedAgentId != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned to this ticket."
            )

        return await self.ticket_repo.get_history_by_ticket_id(ticket_id)
