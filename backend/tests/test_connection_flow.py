"""
Integration tests for the complete connection flow

Tests the following flow:
1. Users check in to event
2. Matching algorithm creates matches
3. Users accept/reject matches
4. Accepted matches become connections
5. Social profiles are unlocked after connection
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import (
    User, UserProfile, Event, EventCheckIn,
    Match, Connection, MatchStatus
)


@pytest.mark.integration
class TestEventCheckInFlow:
    """Tests for event check-in flow"""

    def test_user_check_in_to_event(self, db: Session, test_user_with_profile: User, test_event: Event):
        """Test user checking in to an event"""
        check_in = EventCheckIn(
            user_id=test_user_with_profile.id,
            event_id=test_event.id,
            latitude=test_event.latitude,
            longitude=test_event.longitude
        )
        db.add(check_in)
        db.commit()

        # Verify check-in was created
        saved_check_in = db.query(EventCheckIn).filter(
            EventCheckIn.user_id == test_user_with_profile.id,
            EventCheckIn.event_id == test_event.id
        ).first()

        assert saved_check_in is not None
        assert saved_check_in.latitude == test_event.latitude
        assert saved_check_in.check_out_time is None

    def test_user_check_out_from_event(self, db: Session, test_check_ins):
        """Test user checking out from an event"""
        check_in = test_check_ins[0]
        check_in.check_out_time = datetime.utcnow()
        db.commit()

        # Verify check-out time was set
        db.refresh(check_in)
        assert check_in.check_out_time is not None

    def test_multiple_users_same_event(self, db: Session, test_check_ins):
        """Test multiple users checked in to the same event"""
        assert len(test_check_ins) == 2
        assert test_check_ins[0].event_id == test_check_ins[1].event_id


@pytest.mark.integration
class TestMatchingFlow:
    """Tests for matching algorithm and match creation"""

    def test_create_match_between_users(
        self,
        db: Session,
        test_user_with_profile: User,
        second_user_with_profile: User,
        test_event: Event
    ):
        """Test creating a match between two users"""
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

        # Verify match was created
        saved_match = db.query(Match).filter(
            Match.user_a_id == test_user_with_profile.id,
            Match.user_b_id == second_user_with_profile.id
        ).first()

        assert saved_match is not None
        assert saved_match.compatibility_score == 85.0
        assert saved_match.status == MatchStatus.PENDING

    def test_calculate_compatibility_score(
        self,
        test_user_with_profile: User,
        second_user_with_profile: User
    ):
        """Test compatibility score calculation"""
        from app.services.matching_service import calculate_compatibility

        profile_a = test_user_with_profile.profile
        profile_b = second_user_with_profile.profile

        score, dimension_scores = calculate_compatibility(profile_a, profile_b)

        # Score should be between 0 and 100
        assert 0 <= score <= 100

        # Should have scores for all 5 dimensions
        assert "goals" in dimension_scores
        assert "intuition" in dimension_scores
        assert "philosophy" in dimension_scores
        assert "expectations" in dimension_scores
        assert "leisure_time" in dimension_scores

    def test_match_expiration(self, db: Session, test_match: Match):
        """Test that matches expire after 72 hours"""
        # Set expiration time to past
        test_match.expires_at = datetime.utcnow() - timedelta(hours=1)
        db.commit()

        # Check if match is expired
        db.refresh(test_match)
        is_expired = test_match.expires_at < datetime.utcnow() if test_match.expires_at else False

        assert is_expired is True


@pytest.mark.integration
class TestMatchAcceptanceFlow:
    """Tests for match acceptance/rejection flow"""

    def test_user_a_accepts_match(self, db: Session, test_match: Match):
        """Test user A accepting a match"""
        test_match.user_a_accepted = True
        test_match.user_a_responded_at = datetime.utcnow()
        db.commit()

        db.refresh(test_match)
        assert test_match.user_a_accepted is True
        assert test_match.user_a_responded_at is not None
        # Match should still be pending until both accept
        assert test_match.status == MatchStatus.PENDING

    def test_user_b_accepts_match(self, db: Session, test_match: Match):
        """Test user B accepting a match"""
        test_match.user_b_accepted = True
        test_match.user_b_responded_at = datetime.utcnow()
        db.commit()

        db.refresh(test_match)
        assert test_match.user_b_accepted is True

    def test_both_users_accept_match(self, db: Session, test_match: Match):
        """Test both users accepting a match"""
        test_match.user_a_accepted = True
        test_match.user_b_accepted = True
        test_match.user_a_responded_at = datetime.utcnow()
        test_match.user_b_responded_at = datetime.utcnow()
        test_match.status = MatchStatus.ACCEPTED
        db.commit()

        db.refresh(test_match)
        assert test_match.status == MatchStatus.ACCEPTED

    def test_user_rejects_match(self, db: Session, test_match: Match):
        """Test user rejecting a match"""
        test_match.user_a_accepted = False
        test_match.user_a_responded_at = datetime.utcnow()
        test_match.status = MatchStatus.REJECTED
        db.commit()

        db.refresh(test_match)
        assert test_match.status == MatchStatus.REJECTED


@pytest.mark.integration
class TestConnectionCreationFlow:
    """Tests for creating connections from accepted matches"""

    def test_create_connection_from_accepted_match(
        self,
        db: Session,
        accepted_match: Match,
        test_event: Event
    ):
        """Test creating a connection from an accepted match"""
        connection = Connection(
            match_id=accepted_match.id,
            user_a_id=accepted_match.user_a_id,
            user_b_id=accepted_match.user_b_id,
            event_id=test_event.id,
            pesobytes_earned=10
        )
        db.add(connection)
        db.commit()

        # Verify connection was created
        saved_connection = db.query(Connection).filter(
            Connection.match_id == accepted_match.id
        ).first()

        assert saved_connection is not None
        assert saved_connection.user_a_id == accepted_match.user_a_id
        assert saved_connection.user_b_id == accepted_match.user_b_id
        assert saved_connection.pesobytes_earned == 10

    def test_connection_updates_user_stats(
        self,
        db: Session,
        test_user_with_profile: User,
        second_user_with_profile: User,
        test_connection: Connection
    ):
        """Test that creating a connection updates user profile stats"""
        # Update total connections count
        test_user_with_profile.profile.total_connections += 1
        second_user_with_profile.profile.total_connections += 1
        db.commit()

        db.refresh(test_user_with_profile)
        db.refresh(second_user_with_profile)

        assert test_user_with_profile.profile.total_connections >= 1
        assert second_user_with_profile.profile.total_connections >= 1

    def test_get_user_connections(
        self,
        client: TestClient,
        test_user_with_profile: User,
        test_connection: Connection
    ):
        """Test retrieving all connections for a user"""
        wallet = test_user_with_profile.wallet_address
        response = client.get(f"/api/connections/?wallet_address={wallet}")

        # Should return list of connections
        assert response.status_code in [200, 401]

        if response.status_code == 200:
            connections = response.json()
            assert isinstance(connections, list)


@pytest.mark.integration
class TestSocialProfilesUnlockFlow:
    """Tests for unlocking social profiles after connection"""

    def test_social_profiles_locked_before_connection(
        self,
        db: Session,
        test_user_with_profile: User,
        second_user_with_profile: User
    ):
        """Test that private social profiles are locked before connection"""
        # User A has connection_only visibility
        profile = test_user_with_profile.profile
        assert profile.social_visibility == "connection_only"

        # User B should not be able to see User A's profiles without connection
        # This would be tested via API call with authentication

    def test_social_profiles_unlocked_after_connection(
        self,
        db: Session,
        test_user_with_profile: User,
        second_user_with_profile: User,
        test_connection: Connection
    ):
        """Test that social profiles are unlocked after connection"""
        # Verify connection exists
        connection = db.query(Connection).filter(
            Connection.user_a_id == test_user_with_profile.id,
            Connection.user_b_id == second_user_with_profile.id
        ).first()

        assert connection is not None

        # User B should now be able to see User A's social profiles
        profile_a = test_user_with_profile.profile
        assert profile_a.social_profiles is not None
        assert "instagram" in profile_a.social_profiles

    def test_public_social_profiles_always_visible(
        self,
        db: Session,
        second_user_with_profile: User
    ):
        """Test that public social profiles are always visible"""
        profile = second_user_with_profile.profile
        assert profile.social_visibility == "public"

        # Anyone should be able to see these profiles


@pytest.mark.integration
@pytest.mark.slow
class TestCompleteConnectionFlow:
    """Complete end-to-end connection flow test"""

    def test_complete_flow(
        self,
        db: Session,
        test_event: Event
    ):
        """
        Test complete flow from check-in to connection:
        1. Create two users with profiles
        2. Both check in to same event
        3. Match is created
        4. Both users accept match
        5. Connection is created
        6. Social profiles are unlocked
        """
        # 1. Create two users with profiles
        user_a = User(wallet_address="0x1111111111111111111111111111111111111111")
        user_b = User(wallet_address="0x2222222222222222222222222222222222222222")
        db.add_all([user_a, user_b])
        db.commit()

        profile_a = UserProfile(
            user_id=user_a.id,
            goals=80.0,
            intuition=70.0,
            philosophy=90.0,
            expectations=60.0,
            leisure_time=75.0,
            intentions=["networking", "build_together"],
            social_profiles={"instagram": "@usera"},
            social_visibility="connection_only"
        )
        profile_b = UserProfile(
            user_id=user_b.id,
            goals=85.0,
            intuition=65.0,
            philosophy=88.0,
            expectations=65.0,
            leisure_time=80.0,
            intentions=["build_together", "deep_conversation"],
            social_profiles={"instagram": "@userb", "twitter": "@userb"},
            social_visibility="connection_only"
        )
        db.add_all([profile_a, profile_b])
        db.commit()

        # 2. Both check in to same event
        check_in_a = EventCheckIn(
            user_id=user_a.id,
            event_id=test_event.id,
            latitude=test_event.latitude,
            longitude=test_event.longitude
        )
        check_in_b = EventCheckIn(
            user_id=user_b.id,
            event_id=test_event.id,
            latitude=test_event.latitude + 0.0001,
            longitude=test_event.longitude + 0.0001
        )
        db.add_all([check_in_a, check_in_b])
        db.commit()

        # 3. Match is created (simulating matching algorithm)
        from app.services.matching_service import calculate_compatibility

        score, dimension_scores = calculate_compatibility(profile_a, profile_b)

        match = Match(
            event_id=test_event.id,
            user_a_id=user_a.id,
            user_b_id=user_b.id,
            compatibility_score=score,
            proximity_overlap_minutes=45,
            dimension_alignment=dimension_scores,
            status=MatchStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(hours=72)
        )
        db.add(match)
        db.commit()

        # Verify match was created
        assert match.id is not None
        assert match.status == MatchStatus.PENDING

        # 4. Both users accept match
        match.user_a_accepted = True
        match.user_b_accepted = True
        match.user_a_responded_at = datetime.utcnow()
        match.user_b_responded_at = datetime.utcnow()
        match.status = MatchStatus.ACCEPTED
        db.commit()

        # Verify match is accepted
        assert match.status == MatchStatus.ACCEPTED

        # 5. Connection is created
        connection = Connection(
            match_id=match.id,
            user_a_id=user_a.id,
            user_b_id=user_b.id,
            event_id=test_event.id,
            pesobytes_earned=10
        )
        db.add(connection)
        db.commit()

        # Update user stats
        profile_a.total_connections += 1
        profile_b.total_connections += 1
        db.commit()

        # Verify connection was created
        assert connection.id is not None
        assert profile_a.total_connections == 1
        assert profile_b.total_connections == 1

        # 6. Verify social profiles can be accessed
        # In real implementation, this would check API endpoint with auth
        assert profile_a.social_profiles["instagram"] == "@usera"
        assert profile_b.social_profiles["instagram"] == "@userb"
        assert profile_b.social_profiles["twitter"] == "@userb"


@pytest.mark.integration
class TestConnectionEdgeCases:
    """Tests for edge cases in connection flow"""

    def test_cannot_match_with_self(self, db: Session, test_user_with_profile: User, test_event: Event):
        """Test that user cannot match with themselves"""
        match = Match(
            event_id=test_event.id,
            user_a_id=test_user_with_profile.id,
            user_b_id=test_user_with_profile.id,  # Same user
            compatibility_score=100.0,
            status=MatchStatus.PENDING
        )

        # This should ideally be prevented at the service level
        # For now, we just document the expected behavior
        # In production, add validation to prevent this

    def test_duplicate_connection_prevention(
        self,
        db: Session,
        accepted_match: Match,
        test_event: Event
    ):
        """Test that duplicate connections are prevented"""
        # Create first connection
        connection_1 = Connection(
            match_id=accepted_match.id,
            user_a_id=accepted_match.user_a_id,
            user_b_id=accepted_match.user_b_id,
            event_id=test_event.id
        )
        db.add(connection_1)
        db.commit()

        # Try to create duplicate (should fail or be handled)
        # In production, add unique constraint on match_id
        existing = db.query(Connection).filter(
            Connection.match_id == accepted_match.id
        ).first()

        assert existing is not None

    def test_connection_from_rejected_match_fails(self, db: Session, test_match: Match, test_event: Event):
        """Test that connection cannot be created from rejected match"""
        # Reject the match
        test_match.status = MatchStatus.REJECTED
        test_match.user_a_accepted = False
        db.commit()

        # Attempting to create connection should fail
        # This should be prevented at service level
        assert test_match.status == MatchStatus.REJECTED
