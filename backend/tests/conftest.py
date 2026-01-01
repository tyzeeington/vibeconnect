"""
Pytest configuration and fixtures for VibeConnect tests
"""
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.database import get_db, Base
from main import app
from app.models import User, UserProfile, Event, EventCheckIn, Match, Connection, MatchStatus


# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with database dependency override
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db: Session) -> User:
    """
    Create a test user
    """
    user = User(
        wallet_address="0x1234567890abcdef1234567890abcdef12345678"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user_with_profile(db: Session, test_user: User) -> User:
    """
    Create a test user with a complete profile
    """
    profile = UserProfile(
        user_id=test_user.id,
        goals=75.0,
        intuition=60.0,
        philosophy=85.0,
        expectations=50.0,
        leisure_time=90.0,
        intentions=["build_together", "deep_conversation"],
        bio="Test user bio",
        interests=["tech", "music", "art"],
        social_profiles={
            "instagram": "@testuser",
            "twitter": "@testuser",
            "linkedin": "testuser"
        },
        social_visibility="connection_only",
        total_connections=0,
        profile_confidence=0.5
    )
    db.add(profile)
    db.commit()
    db.refresh(test_user)
    return test_user


@pytest.fixture
def second_user(db: Session) -> User:
    """
    Create a second test user
    """
    user = User(
        wallet_address="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def second_user_with_profile(db: Session, second_user: User) -> User:
    """
    Create a second test user with profile
    """
    profile = UserProfile(
        user_id=second_user.id,
        goals=65.0,
        intuition=80.0,
        philosophy=70.0,
        expectations=60.0,
        leisure_time=75.0,
        intentions=["networking", "build_together"],
        bio="Second test user",
        interests=["tech", "sports"],
        social_profiles={
            "instagram": "@seconduser",
            "twitter": "@seconduser"
        },
        social_visibility="public",
        total_connections=0,
        profile_confidence=0.6
    )
    db.add(profile)
    db.commit()
    db.refresh(second_user)
    return second_user


@pytest.fixture
def test_event(db: Session) -> Event:
    """
    Create a test event
    """
    event = Event(
        event_id="venue_123_2024_01_01_20_00",
        venue_name="Test Venue",
        latitude=37.7749,
        longitude=-122.4194,
        event_type="concert"
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@pytest.fixture
def test_check_ins(db: Session, test_user_with_profile: User, second_user_with_profile: User, test_event: Event):
    """
    Create check-ins for both users at the same event
    """
    check_in_1 = EventCheckIn(
        user_id=test_user_with_profile.id,
        event_id=test_event.id,
        latitude=37.7749,
        longitude=-122.4194
    )
    check_in_2 = EventCheckIn(
        user_id=second_user_with_profile.id,
        event_id=test_event.id,
        latitude=37.7750,
        longitude=-122.4195
    )
    db.add_all([check_in_1, check_in_2])
    db.commit()
    return [check_in_1, check_in_2]


@pytest.fixture
def test_match(db: Session, test_user_with_profile: User, second_user_with_profile: User, test_event: Event) -> Match:
    """
    Create a test match between two users
    """
    match = Match(
        event_id=test_event.id,
        user_a_id=test_user_with_profile.id,
        user_b_id=second_user_with_profile.id,
        compatibility_score=85.0,
        proximity_overlap_minutes=30,
        dimension_alignment={
            "goals": 90,
            "intuition": 70,
            "philosophy": 85,
            "expectations": 80,
            "leisure_time": 88
        },
        status=MatchStatus.PENDING
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@pytest.fixture
def accepted_match(db: Session, test_match: Match) -> Match:
    """
    Create an accepted match
    """
    test_match.user_a_accepted = True
    test_match.user_b_accepted = True
    test_match.status = MatchStatus.ACCEPTED
    db.commit()
    db.refresh(test_match)
    return test_match


@pytest.fixture
def test_connection(db: Session, accepted_match: Match, test_event: Event) -> Connection:
    """
    Create a test connection from an accepted match
    """
    connection = Connection(
        match_id=accepted_match.id,
        user_a_id=accepted_match.user_a_id,
        user_b_id=accepted_match.user_b_id,
        event_id=test_event.id,
        pesobytes_earned=10
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection


@pytest.fixture
def mock_openai_response():
    """
    Mock OpenAI API response for testing
    """
    return {
        "dimensions": {
            "goals": 75,
            "intuition": 60,
            "philosophy": 85,
            "expectations": 50,
            "leisure_time": 90
        },
        "intentions": ["build_together", "deep_conversation"],
        "insights": "Test user with entrepreneurial goals and thoughtful personality"
    }
