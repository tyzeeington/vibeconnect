from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class MatchStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    profile_nft_id = Column(Integer, nullable=True)
    username = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    check_ins = relationship("EventCheckIn", back_populates="user")
    sent_matches = relationship("Match", foreign_keys="Match.user_a_id", back_populates="user_a")
    received_matches = relationship("Match", foreign_keys="Match.user_b_id", back_populates="user_b")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # The 5 Core Dimensions (0-100 scale)
    goals = Column(Float, default=50.0)  # What you're building toward
    intuition = Column(Float, default=50.0)  # How you make decisions
    philosophy = Column(Float, default=50.0)  # Your worldview
    expectations = Column(Float, default=50.0)  # What you want from connections
    leisure_time = Column(Float, default=50.0)  # How you recharge
    
    # Multi-faceted intentions (stored as JSON array)
    intentions = Column(JSON, default=list)  # ["build_together", "deep_conversation", etc.]
    
    # AI learning data
    total_connections = Column(Integer, default=0)
    acceptance_rate = Column(Float, default=0.0)
    profile_confidence = Column(Float, default=0.0)  # How refined the AI profile is (0-1)
    
    # Metadata
    bio = Column(String, nullable=True)
    interests = Column(JSON, default=list)

    # Social Profiles (connection-only visibility)
    social_profiles = Column(JSON, default=dict)  # {"instagram": "@handle", "twitter": "@handle", etc.}
    social_visibility = Column(String, default="connection_only")  # "public" or "connection_only"

    # Profile Picture (stored on IPFS)
    profile_picture_cid = Column(String, nullable=True)  # IPFS CID for profile picture

    # Push Notifications
    device_token = Column(String, nullable=True)  # FCM device token for push notifications

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="profile")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)  # venue_id + timestamp
    venue_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    event_type = Column(String, nullable=True)  # concert, bar, restaurant, etc.
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    check_ins = relationship("EventCheckIn", back_populates="event")
    matches = relationship("Match", back_populates="event")

class EventCheckIn(Base):
    __tablename__ = "event_check_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    
    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    
    # Location data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="check_ins")
    event = relationship("Event", back_populates="check_ins")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    
    user_a_id = Column(Integer, ForeignKey("users.id"))
    user_b_id = Column(Integer, ForeignKey("users.id"))
    
    # Matching scores
    compatibility_score = Column(Float, nullable=False)  # 0-100
    proximity_overlap_minutes = Column(Integer, default=0)  # How long they were near each other
    
    # Dimension alignment (stored as JSON)
    dimension_alignment = Column(JSON, default=dict)  # {"goals": 90, "intuition": 70, ...}
    
    # Status
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING)
    user_a_accepted = Column(Boolean, nullable=True)  # None = not responded, True = accepted, False = rejected
    user_b_accepted = Column(Boolean, nullable=True)  # None = not responded, True = accepted, False = rejected

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # 72 hours after event checkout
    user_a_responded_at = Column(DateTime, nullable=True)
    user_b_responded_at = Column(DateTime, nullable=True)

    # Relationships
    event = relationship("Event", back_populates="matches")
    user_a = relationship("User", foreign_keys=[user_a_id], back_populates="sent_matches")
    user_b = relationship("User", foreign_keys=[user_b_id], back_populates="received_matches")

class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), unique=True)
    
    user_a_id = Column(Integer, ForeignKey("users.id"))
    user_b_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    
    # Blockchain data
    connection_nft_id = Column(Integer, nullable=True)
    transaction_hash = Column(String, nullable=True)
    ipfs_metadata_uri = Column(String, nullable=True)
    
    # PesoBytes earned
    pesobytes_earned = Column(Integer, default=10)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
