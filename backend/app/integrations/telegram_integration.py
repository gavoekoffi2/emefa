"""Telegram Integration for EMEFA - Tier 1 Priority."""

import logging
import json
from typing import Dict, Optional, Any, List
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class TelegramIntegration:
    """Telegram Bot API Integration."""
    
    BASE_URL = "https://api.telegram.org"
    
    def __init__(
        self,
        bot_token: str,
        timeout: int = 30,
    ):
        """Initialize Telegram integration.
        
        Args:
            bot_token: Telegram bot token from BotFather
            timeout: HTTP request timeout
        """
        self.bot_token = bot_token
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _get_url(self, method: str) -> str:
        """Construct full API URL."""
        return f"{self.BASE_URL}/bot{self.bot_token}/{method}"
    
    # ========================
    # Message Sending
    # ========================
    
    async def send_message(
        self,
        chat_id: int | str,
        text: str,
        parse_mode: str = "HTML",
        reply_to_message_id: Optional[int] = None,
        keyboard: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Send a text message.
        
        Args:
            chat_id: Telegram chat ID
            text: Message text
            parse_mode: HTML or Markdown
            reply_to_message_id: Reply to message ID
            keyboard: Inline or reply keyboard
            
        Returns:
            Message data or None on error
        """
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        
        if reply_to_message_id:
            payload["reply_to_message_id"] = reply_to_message_id
        
        if keyboard:
            if keyboard.get("type") == "inline":
                payload["reply_markup"] = {
                    "inline_keyboard": keyboard.get("buttons", [])
                }
            elif keyboard.get("type") == "reply":
                payload["reply_markup"] = {
                    "keyboard": keyboard.get("buttons", []),
                    "resize_keyboard": True,
                    "one_time_keyboard": keyboard.get("one_time", False),
                }
        
        try:
            response = await self.client.post(
                self._get_url("sendMessage"),
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                message = result.get("result", {})
                logger.info(f"Telegram message sent: {message.get('message_id')}")
                return message
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Telegram send failed: {str(e)}")
            return None
    
    async def send_photo(
        self,
        chat_id: int | str,
        photo: str,  # URL or file_id
        caption: str = None,
        parse_mode: str = "HTML",
    ) -> Optional[Dict[str, Any]]:
        """Send a photo.
        
        Args:
            chat_id: Telegram chat ID
            photo: Photo URL or file_id
            caption: Photo caption
            parse_mode: HTML or Markdown
            
        Returns:
            Message data or None on error
        """
        payload = {
            "chat_id": chat_id,
            "photo": photo,
        }
        
        if caption:
            payload["caption"] = caption
            payload["parse_mode"] = parse_mode
        
        try:
            response = await self.client.post(
                self._get_url("sendPhoto"),
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                return result.get("result")
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Telegram photo send failed: {str(e)}")
            return None
    
    async def send_document(
        self,
        chat_id: int | str,
        document: str,  # URL or file_id
        caption: str = None,
        parse_mode: str = "HTML",
    ) -> Optional[Dict[str, Any]]:
        """Send a document.
        
        Args:
            chat_id: Telegram chat ID
            document: Document URL or file_id
            caption: Document caption
            parse_mode: HTML or Markdown
            
        Returns:
            Message data or None on error
        """
        payload = {
            "chat_id": chat_id,
            "document": document,
        }
        
        if caption:
            payload["caption"] = caption
            payload["parse_mode"] = parse_mode
        
        try:
            response = await self.client.post(
                self._get_url("sendDocument"),
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                return result.get("result")
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Telegram document send failed: {str(e)}")
            return None
    
    # ========================
    # Update Handling
    # ========================
    
    @staticmethod
    def parse_update(update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse incoming update from Telegram.
        
        Args:
            update: Update payload from Telegram
            
        Returns:
            Parsed message data or None
        """
        try:
            update_id = update.get("update_id")
            
            # Handle message
            if "message" in update:
                message = update["message"]
                sender = message.get("from", {})
                
                parsed = {
                    "update_id": update_id,
                    "message_id": message.get("message_id"),
                    "chat_id": message.get("chat", {}).get("id"),
                    "sender_id": sender.get("id"),
                    "sender_name": f"{sender.get('first_name', '')} {sender.get('last_name', '')}".strip(),
                    "sender_username": sender.get("username"),
                    "timestamp": message.get("date"),
                    "type": "message",
                    "received_at": datetime.utcnow(),
                }
                
                # Parse content
                if "text" in message:
                    parsed["text"] = message["text"]
                elif "photo" in message:
                    parsed["content_type"] = "photo"
                    parsed["photo"] = message["photo"][-1]  # Largest version
                    parsed["caption"] = message.get("caption")
                elif "document" in message:
                    parsed["content_type"] = "document"
                    parsed["document"] = message["document"]
                elif "video" in message:
                    parsed["content_type"] = "video"
                    parsed["video"] = message["video"]
                    parsed["caption"] = message.get("caption")
                elif "audio" in message:
                    parsed["content_type"] = "audio"
                    parsed["audio"] = message["audio"]
                
                return parsed
            
            # Handle callback query
            elif "callback_query" in update:
                query = update["callback_query"]
                sender = query.get("from", {})
                
                return {
                    "update_id": update_id,
                    "type": "callback_query",
                    "callback_query_id": query.get("id"),
                    "chat_id": query.get("message", {}).get("chat", {}).get("id"),
                    "sender_id": sender.get("id"),
                    "sender_name": f"{sender.get('first_name', '')} {sender.get('last_name', '')}".strip(),
                    "data": query.get("data"),
                    "received_at": datetime.utcnow(),
                }
            
            return None
        
        except (KeyError, TypeError) as e:
            logger.error(f"Error parsing Telegram update: {str(e)}")
            return None
    
    # ========================
    # Webhook Management
    # ========================
    
    async def set_webhook(
        self,
        webhook_url: str,
        allowed_updates: List[str] = None,
    ) -> bool:
        """Set webhook URL.
        
        Args:
            webhook_url: Full webhook URL
            allowed_updates: List of allowed update types
            
        Returns:
            True if successful
        """
        payload = {
            "url": webhook_url,
        }
        
        if allowed_updates:
            payload["allowed_updates"] = allowed_updates
        
        try:
            response = await self.client.post(
                self._get_url("setWebhook"),
                json=payload,
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                logger.info(f"Telegram webhook set: {webhook_url}")
                return True
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return False
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to set webhook: {str(e)}")
            return False
    
    async def get_webhook_info(self) -> Optional[Dict[str, Any]]:
        """Get webhook information.
        
        Returns:
            Webhook info or None on error
        """
        try:
            response = await self.client.post(
                self._get_url("getWebhookInfo"),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                return result.get("result")
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to get webhook info: {str(e)}")
            return None
    
    async def delete_webhook(self) -> bool:
        """Delete webhook.
        
        Returns:
            True if successful
        """
        try:
            response = await self.client.post(
                self._get_url("deleteWebhook"),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                logger.info("Telegram webhook deleted")
                return True
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return False
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to delete webhook: {str(e)}")
            return False
    
    # ========================
    # Bot Information
    # ========================
    
    async def get_me(self) -> Optional[Dict[str, Any]]:
        """Get bot information.
        
        Returns:
            Bot info or None on error
        """
        try:
            response = await self.client.post(
                self._get_url("getMe"),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("ok"):
                return result.get("result")
            else:
                logger.error(f"Telegram API error: {result.get('description')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to get bot info: {str(e)}")
            return None
    
    # ========================
    # Cleanup
    # ========================
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
