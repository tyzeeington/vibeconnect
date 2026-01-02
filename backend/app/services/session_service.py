import redis
import json
from app.config import settings
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Initialize Redis client
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()  # Test connection
    logger.info(f"✅ Connected to Redis at {settings.REDIS_URL}")
except Exception as e:
    logger.warning(f"⚠️ Redis connection failed: {e}. Falling back to in-memory storage.")
    redis_client = None

class SessionService:
    """
    Service for managing chat sessions with Redis backend.
    Falls back to in-memory storage if Redis is unavailable.
    """

    # Fallback in-memory storage
    _memory_store: Dict[str, Dict] = {}

    @staticmethod
    def store_chat_session(session_id: str, data: dict, ttl: int = 3600):
        """
        Store chat session with TTL (default 1 hour)

        Args:
            session_id: Unique session identifier
            data: Session data dictionary
            ttl: Time to live in seconds (default 3600 = 1 hour)
        """
        try:
            if redis_client:
                redis_client.setex(
                    f"chat_session:{session_id}",
                    ttl,
                    json.dumps(data, default=str)
                )
            else:
                # Fallback to in-memory
                SessionService._memory_store[session_id] = data
                logger.debug(f"Stored session {session_id} in memory (Redis unavailable)")
        except Exception as e:
            logger.error(f"Failed to store session {session_id}: {e}")
            # Fallback to in-memory
            SessionService._memory_store[session_id] = data

    @staticmethod
    def get_chat_session(session_id: str) -> Optional[dict]:
        """
        Get chat session from Redis or memory

        Args:
            session_id: Unique session identifier

        Returns:
            Session data dictionary or None if not found
        """
        try:
            if redis_client:
                data = redis_client.get(f"chat_session:{session_id}")
                return json.loads(data) if data else None
            else:
                # Fallback to in-memory
                return SessionService._memory_store.get(session_id)
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            # Try fallback
            return SessionService._memory_store.get(session_id)

    @staticmethod
    def delete_chat_session(session_id: str):
        """
        Delete chat session

        Args:
            session_id: Unique session identifier
        """
        try:
            if redis_client:
                redis_client.delete(f"chat_session:{session_id}")
            else:
                # Fallback to in-memory
                SessionService._memory_store.pop(session_id, None)
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            # Try fallback
            SessionService._memory_store.pop(session_id, None)

    @staticmethod
    def extend_session_ttl(session_id: str, ttl: int = 3600):
        """
        Extend session expiration time

        Args:
            session_id: Unique session identifier
            ttl: Time to live in seconds (default 3600 = 1 hour)
        """
        try:
            if redis_client:
                redis_client.expire(f"chat_session:{session_id}", ttl)
        except Exception as e:
            logger.error(f"Failed to extend session TTL for {session_id}: {e}")

    @staticmethod
    def session_exists(session_id: str) -> bool:
        """
        Check if session exists

        Args:
            session_id: Unique session identifier

        Returns:
            True if session exists, False otherwise
        """
        try:
            if redis_client:
                return redis_client.exists(f"chat_session:{session_id}") > 0
            else:
                return session_id in SessionService._memory_store
        except Exception as e:
            logger.error(f"Failed to check session existence for {session_id}: {e}")
            return session_id in SessionService._memory_store
