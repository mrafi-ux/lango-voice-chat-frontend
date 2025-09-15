"""Database base configuration."""

from .models import Base, User, Conversation, Message

# This will be used by Alembic for auto-generation
__all__ = ["Base", "User", "Conversation", "Message"]
