"""Security utilities."""

from typing import Optional
import uuid


def generate_user_id() -> str:
    """Generate a unique user ID."""
    return str(uuid.uuid4())


def generate_conversation_id() -> str:
    """Generate a unique conversation ID."""
    return str(uuid.uuid4())


def generate_message_id() -> str:
    """Generate a unique message ID."""
    return str(uuid.uuid4())


# Placeholder for future authentication
def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user ID."""
    # TODO: Implement JWT verification
    return None


def create_token(user_id: str) -> str:
    """Create JWT token for user."""
    # TODO: Implement JWT creation
    return f"token_{user_id}"
