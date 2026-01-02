import json
from typing import Dict, Optional
import logging
import requests

logger = logging.getLogger(__name__)


class IPFSService:
    """
    Service for uploading NFT metadata to IPFS.
    Uses Pinata API for IPFS pinning (more reliable than ipfshttpclient).
    """

    def __init__(self, pinata_api_key: Optional[str] = None, pinata_secret: Optional[str] = None):
        """
        Initialize IPFS service with Pinata credentials.

        Args:
            pinata_api_key: Pinata API key (optional, can use env var)
            pinata_secret: Pinata secret key (optional, can use env var)
        """
        self.pinata_api_key = pinata_api_key
        self.pinata_secret = pinata_secret
        self.pinata_url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

    def upload_metadata(self, metadata: Dict) -> str:
        """
        Upload JSON metadata to IPFS via Pinata, return IPFS URI.

        Args:
            metadata: Dictionary containing NFT metadata

        Returns:
            IPFS URI (ipfs://CID) or placeholder if upload fails
        """
        try:
            if not self.pinata_api_key or not self.pinata_secret:
                logger.warning("IPFS credentials not configured. Using placeholder URI.")
                return self._generate_placeholder_uri(metadata)

            headers = {
                "pinata_api_key": self.pinata_api_key,
                "pinata_secret_api_key": self.pinata_secret,
                "Content-Type": "application/json"
            }

            response = requests.post(
                self.pinata_url,
                json={
                    "pinataContent": metadata,
                    "pinataMetadata": {
                        "name": metadata.get("name", "VibeConnect NFT Metadata")
                    }
                },
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                ipfs_hash = response.json()["IpfsHash"]
                logger.info(f"✅ Metadata uploaded to IPFS: {ipfs_hash}")
                return f"ipfs://{ipfs_hash}"
            else:
                logger.error(f"Failed to upload to IPFS: {response.text}")
                return self._generate_placeholder_uri(metadata)

        except Exception as e:
            logger.error(f"Error uploading metadata to IPFS: {e}")
            return self._generate_placeholder_uri(metadata)

    def _generate_placeholder_uri(self, metadata: Dict) -> str:
        """
        Generate placeholder URI when IPFS upload fails.

        Args:
            metadata: Metadata dictionary

        Returns:
            Placeholder IPFS URI
        """
        connection_id = metadata.get("attributes", [{}])[0].get("value", "unknown")
        placeholder = f"ipfs://placeholder-connection-{connection_id}"
        logger.info(f"Using placeholder URI: {placeholder}")
        return placeholder

    def generate_connection_metadata(
        self,
        connection_id: int,
        user_a: str,
        user_b: str,
        event_name: str,
        compatibility_score: int,
        timestamp: str,
        dimension_alignment: Optional[Dict[str, float]] = None,
        proximity_overlap_minutes: int = 0
    ) -> Dict:
        """
        Generate OpenSea-compatible NFT metadata for a connection.

        Args:
            connection_id: Unique connection ID
            user_a: Wallet address of first user
            user_b: Wallet address of second user
            event_name: Name of the event where they met
            compatibility_score: Compatibility percentage (0-100)
            timestamp: ISO format timestamp
            dimension_alignment: Optional dimension alignment scores
            proximity_overlap_minutes: Minutes they were together

        Returns:
            Dictionary containing NFT metadata following OpenSea standard
        """
        attributes = [
            {"trait_type": "Event", "value": event_name},
            {"trait_type": "Compatibility", "value": compatibility_score, "display_type": "number"},
            {"trait_type": "Date", "value": timestamp},
            {"trait_type": "User A", "value": self._format_address(user_a)},
            {"trait_type": "User B", "value": self._format_address(user_b)},
        ]

        # Add proximity overlap if available
        if proximity_overlap_minutes > 0:
            hours = proximity_overlap_minutes // 60
            minutes = proximity_overlap_minutes % 60
            attributes.append({
                "trait_type": "Time Together",
                "value": f"{hours}h {minutes}m"
            })

        # Add dimension alignment scores if available
        if dimension_alignment:
            for dimension, score in dimension_alignment.items():
                attributes.append({
                    "trait_type": f"{dimension.capitalize()} Alignment",
                    "value": int(score),
                    "display_type": "number"
                })

        metadata = {
            "name": f"VibeConnect Connection #{connection_id}",
            "description": f"An authentic connection made at {event_name} with {compatibility_score}% compatibility. "
                          f"This NFT represents a real-world connection between two people who vibed together.",
            "image": "ipfs://QmVibeConnectLogoPlaceholder",  # TODO: Replace with actual logo
            "external_url": f"https://vibeconnect.app/connection/{connection_id}",
            "attributes": attributes,
            "properties": {
                "category": "Connection",
                "compatibility_score": compatibility_score,
                "event": event_name,
                "timestamp": timestamp
            }
        }

        return metadata

    def generate_profile_metadata(
        self,
        profile_id: int,
        wallet_address: str,
        username: Optional[str] = None,
        bio: Optional[str] = None,
        dimensions: Optional[Dict[str, float]] = None,
        total_connections: int = 0
    ) -> Dict:
        """
        Generate OpenSea-compatible NFT metadata for a user profile.

        Args:
            profile_id: Unique profile ID
            wallet_address: User's wallet address
            username: Optional username
            bio: Optional bio
            dimensions: Optional personality dimensions
            total_connections: Number of connections made

        Returns:
            Dictionary containing NFT metadata following OpenSea standard
        """
        display_name = username or self._format_address(wallet_address)

        attributes = [
            {"trait_type": "Total Connections", "value": total_connections, "display_type": "number"}
        ]

        # Add personality dimensions if available
        if dimensions:
            for dimension, score in dimensions.items():
                attributes.append({
                    "trait_type": dimension.capitalize(),
                    "value": int(score),
                    "display_type": "number"
                })

        metadata = {
            "name": f"{display_name}'s VibeConnect Profile",
            "description": bio or f"VibeConnect profile for {display_name}. "
                                 f"This NFT represents their unique personality profile and on-chain identity.",
            "image": "ipfs://QmVibeConnectProfilePlaceholder",  # TODO: Replace with actual profile image
            "external_url": f"https://vibeconnect.app/profile/{wallet_address}",
            "attributes": attributes,
            "properties": {
                "category": "Profile",
                "total_connections": total_connections,
                "wallet_address": wallet_address
            }
        }

        return metadata

    @staticmethod
    def _format_address(address: str) -> str:
        """
        Format wallet address for display (0x1234...5678).

        Args:
            address: Full wallet address

        Returns:
            Formatted address
        """
        if len(address) > 10:
            return f"{address[:6]}...{address[-4:]}"
        return address


# Singleton instance
ipfs_service = IPFSService()
