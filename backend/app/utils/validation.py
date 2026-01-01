"""
Input validation and sanitization utilities for security
"""
import re
import bleach
from typing import Dict, Optional
from fastapi import HTTPException, status


def sanitize_text(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input text to prevent XSS and injection attacks

    Args:
        text: Raw user input
        max_length: Maximum allowed length

    Returns:
        Sanitized text

    Raises:
        HTTPException: If text is too long
    """
    if not text:
        return ""

    if len(text) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text exceeds maximum length of {max_length} characters"
        )

    # Remove HTML tags and sanitize
    sanitized = bleach.clean(text, tags=[], strip=True)

    # Remove any null bytes
    sanitized = sanitized.replace('\x00', '')

    return sanitized.strip()


def validate_wallet_address(wallet_address: str) -> str:
    """
    Validate Ethereum wallet address format

    Args:
        wallet_address: Wallet address to validate

    Returns:
        Lowercase wallet address

    Raises:
        HTTPException: If wallet address is invalid
    """
    if not wallet_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet address is required"
        )

    # Ethereum addresses are 42 characters (0x + 40 hex chars)
    wallet_pattern = re.compile(r'^0x[a-fA-F0-9]{40}$')

    if not wallet_pattern.match(wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid wallet address format"
        )

    return wallet_address.lower()


def validate_social_handle(platform: str, handle: str) -> str:
    """
    Validate and sanitize social media handles

    Args:
        platform: Social media platform name
        handle: User's handle/username

    Returns:
        Sanitized handle

    Raises:
        HTTPException: If handle is invalid
    """
    if not handle:
        return ""

    # Remove whitespace
    handle = handle.strip()

    # Maximum handle length
    max_length = 50

    if len(handle) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Social handle too long (max {max_length} characters)"
        )

    # Remove @ prefix if present
    if handle.startswith('@'):
        handle = handle[1:]

    # Platform-specific validation
    platform_lower = platform.lower()

    # General pattern: alphanumeric, underscore, dot, hyphen
    general_pattern = re.compile(r'^[a-zA-Z0-9._-]+$')

    if platform_lower == 'instagram':
        # Instagram: letters, numbers, periods, underscores (max 30)
        if len(handle) > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instagram handle too long (max 30 characters)"
            )
        pattern = re.compile(r'^[a-zA-Z0-9._]+$')
    elif platform_lower == 'twitter':
        # Twitter/X: letters, numbers, underscores (max 15)
        if len(handle) > 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Twitter handle too long (max 15 characters)"
            )
        pattern = re.compile(r'^[a-zA-Z0-9_]+$')
    elif platform_lower == 'linkedin':
        # LinkedIn: letters, numbers, hyphens (3-100 chars)
        if len(handle) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn handle too short (min 3 characters)"
            )
        pattern = re.compile(r'^[a-zA-Z0-9-]+$')
    elif platform_lower in ['spotify', 'tiktok', 'youtube']:
        # General pattern for these platforms
        pattern = general_pattern
    else:
        # Default validation
        pattern = general_pattern

    if not pattern.match(handle):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {platform} handle format"
        )

    return handle


def sanitize_social_profiles(social_profiles: Dict[str, str]) -> Dict[str, str]:
    """
    Validate and sanitize all social media profiles

    Args:
        social_profiles: Dictionary of platform -> handle

    Returns:
        Sanitized social profiles dictionary

    Raises:
        HTTPException: If any handle is invalid
    """
    if not social_profiles:
        return {}

    sanitized = {}
    allowed_platforms = ['instagram', 'twitter', 'linkedin', 'spotify', 'tiktok', 'youtube']

    for platform, handle in social_profiles.items():
        platform_lower = platform.lower()

        if platform_lower not in allowed_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported social platform: {platform}"
            )

        # Validate and sanitize handle
        sanitized_handle = validate_social_handle(platform, handle)

        if sanitized_handle:  # Only include non-empty handles
            sanitized[platform_lower] = sanitized_handle

    return sanitized


def validate_dimension_value(value: float, dimension_name: str) -> float:
    """
    Validate personality dimension values

    Args:
        value: Dimension value
        dimension_name: Name of the dimension

    Returns:
        Validated value

    Raises:
        HTTPException: If value is out of range
    """
    if not isinstance(value, (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{dimension_name} must be a number"
        )

    if value < 0 or value > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{dimension_name} must be between 0 and 100"
        )

    return float(value)


def validate_event_id(event_id: str) -> str:
    """
    Validate event ID format

    Args:
        event_id: Event identifier

    Returns:
        Validated event ID

    Raises:
        HTTPException: If event ID is invalid
    """
    if not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event ID is required"
        )

    # Remove whitespace
    event_id = event_id.strip()

    # Maximum length
    if len(event_id) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event ID too long"
        )

    # Allow alphanumeric, hyphens, underscores
    pattern = re.compile(r'^[a-zA-Z0-9_-]+$')

    if not pattern.match(event_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event ID format"
        )

    return event_id


def validate_coordinates(latitude: float, longitude: float) -> tuple[float, float]:
    """
    Validate GPS coordinates

    Args:
        latitude: Latitude value
        longitude: Longitude value

    Returns:
        Tuple of validated (latitude, longitude)

    Raises:
        HTTPException: If coordinates are invalid
    """
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinates must be numbers"
        )

    if latitude < -90 or latitude > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90"
        )

    if longitude < -180 or longitude > 180:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180"
        )

    return latitude, longitude
