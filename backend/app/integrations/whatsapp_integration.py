"""WhatsApp Integration for EMEFA - Tier 1 Priority."""

import logging
import json
import hashlib
import hmac
from typing import Dict, Optional, Any, List
from datetime import datetime
import httpx
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class WhatsAppIntegration:
    """WhatsApp Cloud API Integration."""
    
    BASE_URL = "https://graph.instagram.com"
    API_VERSION = "v19.0"
    
    def __init__(
        self,
        phone_number_id: str,
        access_token: str,
        business_account_id: str,
        webhook_verify_token: str = None,
        timeout: int = 30,
    ):
        """Initialize WhatsApp integration.
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Facebook/Meta access token
            business_account_id: WhatsApp Business Account ID
            webhook_verify_token: Token for webhook verification
            timeout: HTTP request timeout
        """
        self.phone_number_id = phone_number_id
        self.access_token = access_token
        self.business_account_id = business_account_id
        self.webhook_verify_token = webhook_verify_token or "emefa_webhook_secret"
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _get_url(self, endpoint: str) -> str:
        """Construct full API URL."""
        return f"{self.BASE_URL}/{self.API_VERSION}{endpoint}"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
    
    # ========================
    # Message Sending
    # ========================
    
    async def send_text_message(
        self,
        recipient_phone: str,
        message: str,
    ) -> Dict[str, Any]:
        """Send a text message via WhatsApp.
        
        Args:
            recipient_phone: Recipient phone number (with country code, no +)
            message: Message text
            
        Returns:
            Response with message_id
        """
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": "text",
            "text": {"body": message},
        }
        
        url = self._get_url(f"/{self.phone_number_id}/messages")
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"WhatsApp message sent: {result.get('messages', [{}])[0].get('id')}")
            return result
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp send failed: {str(e)}")
            raise
    
    async def send_template_message(
        self,
        recipient_phone: str,
        template_name: str,
        language: str = "en",
        parameters: List[str] = None,
    ) -> Dict[str, Any]:
        """Send a pre-approved template message.
        
        Args:
            recipient_phone: Recipient phone number
            template_name: Name of the template
            language: Template language code
            parameters: Template parameters
            
        Returns:
            Response with message_id
        """
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language},
            },
        }
        
        if parameters:
            payload["template"]["components"] = [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in parameters],
                }
            ]
        
        url = self._get_url(f"/{self.phone_number_id}/messages")
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp template send failed: {str(e)}")
            raise
    
    async def send_media_message(
        self,
        recipient_phone: str,
        media_url: str,
        media_type: str,  # image, video, audio, document
        caption: str = None,
    ) -> Dict[str, Any]:
        """Send a media message.
        
        Args:
            recipient_phone: Recipient phone number
            media_url: URL of the media file
            media_type: Type of media
            caption: Optional caption (for images only)
            
        Returns:
            Response with message_id
        """
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": media_type,
            media_type: {
                "link": media_url,
            },
        }
        
        if caption and media_type == "image":
            payload[media_type]["caption"] = caption
        
        url = self._get_url(f"/{self.phone_number_id}/messages")
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp media send failed: {str(e)}")
            raise
    
    async def send_interactive_message(
        self,
        recipient_phone: str,
        interactive_type: str,  # button, list
        message_text: str,
        buttons: List[Dict[str, str]] = None,
        list_sections: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Send an interactive message with buttons or list.
        
        Args:
            recipient_phone: Recipient phone number
            interactive_type: 'button' or 'list'
            message_text: Main message text
            buttons: List of button objects
            list_sections: List of section objects
            
        Returns:
            Response with message_id
        """
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": "interactive",
            "interactive": {
                "type": interactive_type,
                "body": {"text": message_text},
            },
        }
        
        if interactive_type == "button" and buttons:
            payload["interactive"]["action"] = {
                "buttons": buttons,
            }
        elif interactive_type == "list" and list_sections:
            payload["interactive"]["action"] = {
                "sections": list_sections,
            }
        
        url = self._get_url(f"/{self.phone_number_id}/messages")
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp interactive send failed: {str(e)}")
            raise
    
    # ========================
    # Webhook Verification
    # ========================
    
    def verify_webhook(self, token: str, challenge: str) -> Optional[str]:
        """Verify webhook with Meta.
        
        Args:
            token: Verification token from request
            challenge: Challenge string from request
            
        Returns:
            Challenge string if verification successful, None otherwise
        """
        if token == self.webhook_verify_token:
            logger.info("WhatsApp webhook verified")
            return challenge
        
        logger.warning("WhatsApp webhook verification failed")
        return None
    
    def verify_signature(self, body: str, signature: str) -> bool:
        """Verify webhook signature.
        
        Args:
            body: Request body
            signature: X-Hub-Signature header value
            
        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            self.access_token.encode(),
            body.encode(),
            hashlib.sha256,
        ).hexdigest()
        
        received_signature = signature.split("=")[1] if "=" in signature else ""
        
        return hmac.compare_digest(expected_signature, received_signature)
    
    # ========================
    # Message Parsing
    # ========================
    
    @staticmethod
    def parse_webhook_message(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse incoming webhook message.
        
        Args:
            payload: Webhook payload from Meta
            
        Returns:
            Parsed message data or None
        """
        try:
            # Navigate through the webhook structure
            entry = payload.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                return None
            
            message = messages[0]
            sender_phone = value.get("contacts", [{}])[0].get("wa_id")
            sender_name = value.get("contacts", [{}])[0].get("profile", {}).get("name")
            
            parsed = {
                "message_id": message.get("id"),
                "timestamp": message.get("timestamp"),
                "sender_phone": sender_phone,
                "sender_name": sender_name,
                "type": message.get("type"),
                "received_at": datetime.utcnow(),
            }
            
            # Parse message content based on type
            msg_type = message.get("type")
            
            if msg_type == "text":
                parsed["text"] = message.get("text", {}).get("body", "")
            
            elif msg_type == "image":
                parsed["media_type"] = "image"
                parsed["media_id"] = message.get("image", {}).get("id")
                parsed["media_caption"] = message.get("image", {}).get("caption")
            
            elif msg_type == "video":
                parsed["media_type"] = "video"
                parsed["media_id"] = message.get("video", {}).get("id")
            
            elif msg_type == "audio":
                parsed["media_type"] = "audio"
                parsed["media_id"] = message.get("audio", {}).get("id")
            
            elif msg_type == "document":
                parsed["media_type"] = "document"
                parsed["media_id"] = message.get("document", {}).get("id")
                parsed["filename"] = message.get("document", {}).get("filename")
            
            elif msg_type == "interactive":
                interaction = message.get("interactive", {})
                parsed["interactive_type"] = interaction.get("type")
                parsed["interaction_data"] = interaction.get(interaction.get("type"), {})
            
            return parsed
        
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"Error parsing webhook message: {str(e)}")
            return None
    
    # ========================
    # Contact Management
    # ========================
    
    async def get_contact_profile(
        self,
        phone_number: str,
    ) -> Optional[Dict[str, Any]]:
        """Get contact profile information.
        
        Args:
            phone_number: Phone number (with country code, no +)
            
        Returns:
            Contact profile data or None
        """
        url = self._get_url(f"/{phone_number}")
        params = {
            "fields": "wa_id,name,short_description,description,profile_picture_url",
            "access_token": self.access_token,
        }
        
        try:
            response = await self.client.get(
                url,
                params=params,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get contact profile: {str(e)}")
            return None
    
    async def mark_message_as_read(
        self,
        message_id: str,
    ) -> bool:
        """Mark a message as read.
        
        Args:
            message_id: WhatsApp message ID
            
        Returns:
            True if successful
        """
        url = self._get_url(f"/{message_id}")
        payload = {
            "status": "read",
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to mark message as read: {str(e)}")
            return False
    
    # ========================
    # Cleanup
    # ========================
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
