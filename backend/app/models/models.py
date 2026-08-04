from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'Agent' or 'Manager'

    # Relationships
    assigned_tickets = relationship("Ticket", back_populates="assigned_agent", foreign_keys="Ticket.assignedAgentId")
    created_tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.createdBy")
    history_logs = relationship("TicketHistory", back_populates="user", foreign_keys="TicketHistory.changedBy")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="New", nullable=False)  # 'New', 'In Progress', 'Resolved'
    assignedAgentId = Column(Integer, ForeignKey("users.id"), nullable=True)
    createdBy = Column(Integer, ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updatedAt = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assigned_agent = relationship("User", back_populates="assigned_tickets", foreign_keys=[assignedAgentId])
    creator = relationship("User", back_populates="created_tickets", foreign_keys=[createdBy])
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")


class TicketHistory(Base):
    __tablename__ = "ticket_histories"

    id = Column(Integer, primary_key=True, index=True)
    ticketId = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    changedBy = Column(Integer, ForeignKey("users.id"), nullable=False)
    oldStatus = Column(String, nullable=True)
    newStatus = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="history")
    user = relationship("User", back_populates="history_logs")
