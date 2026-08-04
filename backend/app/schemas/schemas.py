from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class UserResponse(BaseModel):
    id: int
    name: str
    role: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    userId: int

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Ticket title (minimum 3 characters)")
    description: str = Field(..., min_length=1, description="Ticket description")
    assignedAgentId: Optional[int] = Field(None, description="Optional ID of assigned agent")

class TicketStatusUpdate(BaseModel):
    status: str
    changedBy: int

class TicketAssignUpdate(BaseModel):
    agentId: Optional[int]

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    assignedAgentId: Optional[int]
    assignedAgent: Optional[str]  # Agent name (matches API spec)
    createdBy: int
    createdByName: Optional[str]   # Creator name
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class TicketHistoryResponse(BaseModel):
    id: int
    ticketId: int
    changedBy: str  # Changed by User name
    changedById: int
    oldStatus: Optional[str]
    newStatus: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AISummaryResponse(BaseModel):
    summary: str
    suggested_tags: List[str]
    sentiment: str
    suggested_reply: str
