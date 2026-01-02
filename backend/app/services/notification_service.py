import os
import json
from typing import Optional, Dict
from datetime import datetime

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


class NotificationService:
    """
    Service for sending push notifications via Firebase Cloud Messaging (FCM)
    Gracefully handles missing Firebase credentials for development environments
    """

    def __init__(self):
        self.initialized = False
        self.firebase_app = None

        # Check if Firebase is available and credentials exist
        if FIREBASE_AVAILABLE:
            self._initialize_firebase()
        else:
            print("Warning: firebase-admin not installed. Push notifications disabled.")

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK with credentials"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                self.firebase_app = firebase_admin.get_app()
                self.initialized = True
                print("Firebase Admin SDK already initialized")
                return

            # Try to load credentials from environment variable
            firebase_creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            firebase_creds_json = os.getenv('FIREBASE_CREDENTIALS_JSON')

            if firebase_creds_path and os.path.exists(firebase_creds_path):
                # Load from file
                cred = credentials.Certificate(firebase_creds_path)
                self.firebase_app = firebase_admin.initialize_app(cred)
                self.initialized = True
                print("Firebase Admin SDK initialized from file")
            elif firebase_creds_json:
                # Load from JSON string
                cred_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(cred_dict)
                self.firebase_app = firebase_admin.initialize_app(cred)
                self.initialized = True
                print("Firebase Admin SDK initialized from JSON")
            else:
                print("Warning: Firebase credentials not found. Push notifications disabled.")
                print("Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON environment variable.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            print("Push notifications will be disabled.")

    def send_connection_request(
        self,
        device_token: str,
        sender_username: Optional[str],
        sender_wallet: str,
        compatibility_score: float,
        event_name: str,
        match_id: int
    ) -> bool:
        """
        Send a push notification for a new connection request

        Args:
            device_token: FCM device token of the recipient
            sender_username: Username of the sender (or None if not set)
            sender_wallet: Wallet address of the sender
            compatibility_score: Compatibility score (0-100)
            event_name: Name of the event where they matched
            match_id: ID of the match

        Returns:
            True if notification sent successfully, False otherwise
        """
        if not self.initialized or not FIREBASE_AVAILABLE:
            print(f"Notification not sent (Firebase not initialized): Match {match_id}")
            return False

        try:
            # Create notification title and body
            sender_display = sender_username if sender_username else f"{sender_wallet[:6]}...{sender_wallet[-4:]}"
            title = "New Connection Request!"
            body = f"{sender_display} wants to connect. {int(compatibility_score)}% compatible from {event_name}"

            # Create the message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'type': 'connection_request',
                    'match_id': str(match_id),
                    'sender_wallet': sender_wallet,
                    'sender_username': sender_username or '',
                    'compatibility_score': str(compatibility_score),
                    'event_name': event_name,
                    'timestamp': datetime.utcnow().isoformat()
                },
                token=device_token,
                # Set priority for time-sensitive notifications
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default',
                        channel_id='connection_requests'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1
                        )
                    )
                )
            )

            # Send the message
            response = messaging.send(message)
            print(f"Successfully sent notification: {response}")
            return True

        except Exception as e:
            print(f"Error sending notification: {e}")
            return False

    def send_connection_accepted(
        self,
        device_token: str,
        accepter_username: Optional[str],
        accepter_wallet: str,
        event_name: str,
        connection_id: int
    ) -> bool:
        """
        Send a push notification when a connection request is accepted

        Args:
            device_token: FCM device token of the recipient
            accepter_username: Username of the person who accepted
            accepter_wallet: Wallet address of the person who accepted
            event_name: Name of the event where they matched
            connection_id: ID of the connection

        Returns:
            True if notification sent successfully, False otherwise
        """
        if not self.initialized or not FIREBASE_AVAILABLE:
            print(f"Notification not sent (Firebase not initialized): Connection {connection_id}")
            return False

        try:
            # Create notification title and body
            accepter_display = accepter_username if accepter_username else f"{accepter_wallet[:6]}...{accepter_wallet[-4:]}"
            title = "Connection Accepted!"
            body = f"{accepter_display} accepted your connection from {event_name}. Start chatting now!"

            # Create the message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'type': 'connection_accepted',
                    'connection_id': str(connection_id),
                    'accepter_wallet': accepter_wallet,
                    'accepter_username': accepter_username or '',
                    'event_name': event_name,
                    'timestamp': datetime.utcnow().isoformat()
                },
                token=device_token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default',
                        channel_id='connection_updates'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1
                        )
                    )
                )
            )

            # Send the message
            response = messaging.send(message)
            print(f"Successfully sent notification: {response}")
            return True

        except Exception as e:
            print(f"Error sending notification: {e}")
            return False

    def send_bulk_notifications(
        self,
        tokens_and_data: list[Dict]
    ) -> Dict[str, int]:
        """
        Send notifications to multiple devices

        Args:
            tokens_and_data: List of dicts with 'token' and notification data

        Returns:
            Dict with success and failure counts
        """
        if not self.initialized or not FIREBASE_AVAILABLE:
            print("Bulk notifications not sent (Firebase not initialized)")
            return {'success': 0, 'failure': len(tokens_and_data)}

        success_count = 0
        failure_count = 0

        for item in tokens_and_data:
            # Extract notification type and send accordingly
            if item.get('type') == 'connection_request':
                success = self.send_connection_request(
                    device_token=item['token'],
                    sender_username=item.get('sender_username'),
                    sender_wallet=item['sender_wallet'],
                    compatibility_score=item['compatibility_score'],
                    event_name=item['event_name'],
                    match_id=item['match_id']
                )
            elif item.get('type') == 'connection_accepted':
                success = self.send_connection_accepted(
                    device_token=item['token'],
                    accepter_username=item.get('accepter_username'),
                    accepter_wallet=item['accepter_wallet'],
                    event_name=item['event_name'],
                    connection_id=item['connection_id']
                )
            else:
                success = False

            if success:
                success_count += 1
            else:
                failure_count += 1

        return {
            'success': success_count,
            'failure': failure_count
        }


# Initialize notification service
notification_service = NotificationService()
