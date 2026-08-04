from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    TicketAssignUpdate,
    TicketHistoryResponse,
    AISummaryResponse
)
from app.services.ticket_service import TicketService
from app.services.ai_service import AIService

router = APIRouter(prefix="/tickets", tags=["tickets"])

# Dependency to retrieve X-User-Id header
def get_current_user_id(x_user_id: Optional[int] = Header(None, alias="X-User-Id")) -> int:
    if x_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication header 'X-User-Id'"
        )
    return x_user_id

@router.get("", response_model=List[TicketResponse])
async def list_tickets(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    tickets = await ticket_service.get_tickets(user_id, status_filter, search)
    
    # Map to response format including names
    return [
        TicketResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            status=t.status,
            assignedAgentId=t.assignedAgentId,
            assignedAgent=t.assigned_agent.name if t.assigned_agent else None,
            createdBy=t.createdBy,
            createdByName=t.creator.name if t.creator else None,
            createdAt=t.createdAt,
            updatedAt=t.updatedAt
        )
        for t in tickets
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    new_ticket = await ticket_service.create_ticket(payload, user_id)
    return {
        "message": "Ticket Created",
        "ticketId": new_ticket.id
    }

@router.get("/{id}", response_model=TicketResponse)
async def get_ticket(
    id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    t = await ticket_service.get_ticket_by_id(id, user_id)
    return TicketResponse(
        id=t.id,
        title=t.title,
        description=t.description,
        status=t.status,
        assignedAgentId=t.assignedAgentId,
        assignedAgent=t.assigned_agent.name if t.assigned_agent else None,
        createdBy=t.createdBy,
        createdByName=t.creator.name if t.creator else None,
        createdAt=t.createdAt,
        updatedAt=t.updatedAt
    )

@router.put("/{id}/status")
async def update_status(
    id: int,
    payload: TicketStatusUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Verify that the user performing the update matches the header user to prevent header spoofing
    if payload.changedBy != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The payload changedBy must match the authenticated X-User-Id header."
        )
    ticket_service = TicketService(db)
    await ticket_service.update_ticket_status(id, payload)
    return {"message": "Status Updated"}

@router.put("/{id}/assign")
async def assign_ticket(
    id: int,
    payload: TicketAssignUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    await ticket_service.assign_ticket(id, payload.agentId, user_id)
    return {"message": "Assigned Successfully"}

@router.get("/{id}/history", response_model=List[TicketHistoryResponse])
async def get_history(
    id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    history = await ticket_service.get_ticket_history(id, user_id)
    return [
        TicketHistoryResponse(
            id=h.id,
            ticketId=h.ticketId,
            changedBy=h.user.name if h.user else f"User {h.changedBy}",
            changedById=h.changedBy,
            oldStatus=h.oldStatus,
            newStatus=h.newStatus,
            timestamp=h.timestamp
        )
        for h in history
    ]

@router.get("/{id}/ai-analysis", response_model=AISummaryResponse)
async def get_ai_analysis(
    id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    ticket_service = TicketService(db)
    t = await ticket_service.get_ticket_by_id(id, user_id)
    analysis = await AIService.analyze_ticket(t.title, t.description)
    return AISummaryResponse(
        summary=analysis.get("summary", ""),
        suggested_tags=analysis.get("suggested_tags", []),
        sentiment=analysis.get("sentiment", "Unknown"),
        suggested_reply=analysis.get("suggested_reply", "")
    )
