"""African SMS Integration for EMEFA - Tier 1 Priority (Africastalking, Twilio, etc.)."""

import logging
from typing import Dict, Optional, Any, List
from enum import Enum
import httpx

logger = logging.getLogger(__name__)


class SMSProvider(str, Enum):
    """SMS providers for African markets."""
    AFRICASTALKING = "africastalking"
    TWILIO = "twilio"
    NEXMO = "nexmo"
    CLICKATELL = "clickatell"
    INFOBIP = "infobip"


class AfricaTalkingSMSIntegration:
    """Africas Talking SMS Integration - Best for Africa."""
    
    BASE_URL = "https://api.africastalking.com"
    
    def __init__(
        self,
        api_key: str,
        username: str = "sandbox",
        timeout: int = 30,
    ):
        """Initialize Africa's Talking integration.
        
        Args:
            api_key: Africa's Talking API key
            username: Africa's Talking username
            timeout: HTTP request timeout
        """
        self.api_key = api_key
        self.username = username
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        return {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "apiKey": self.api_key,
        }
    
    async def send_sms(
        self,
        phone_number: str,
        message: str,
        sender_id: str = None,
    ) -> Optional[Dict[str, Any]]:
        """Send SMS message.
        
        Args:
            phone_number: Recipient phone (with country code, e.g., +233123456789)
            message: SMS message text (160 chars max for reliability)
            sender_id: Sender ID (optional, 11 chars max)
            
        Returns:
            Response data or None on error
        """
        url = f"{self.BASE_URL}/version1/messaging"
        
        # Prepare payload
        payload = {
            "username": self.username,
            "to": phone_number,
            "message": message,
        }
        
        if sender_id:
            payload["from"] = sender_id
        
        try:
            response = await self.client.post(
                url,
                data=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("SMSMessageData", {}).get("Recipients"):
                logger.info(f"SMS sent to {phone_number}")
                return result
            else:
                logger.error(f"Africa's Talking SMS error: {result}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Africa's Talking send failed: {str(e)}")
            return None
    
    async def send_bulk_sms(
        self,
        phone_numbers: List[str],
        message: str,
        sender_id: str = None,
    ) -> Optional[Dict[str, Any]]:
        """Send SMS to multiple recipients.
        
        Args:
            phone_numbers: List of phone numbers
            message: SMS message text
            sender_id: Sender ID
            
        Returns:
            Response data or None on error
        """
        url = f"{self.BASE_URL}/version1/messaging"
        
        payload = {
            "username": self.username,
            "to": ",".join(phone_numbers),
            "message": message,
        }
        
        if sender_id:
            payload["from"] = sender_id
        
        try:
            response = await self.client.post(
                url,
                data=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("SMSMessageData", {}).get("Recipients"):
                logger.info(f"Bulk SMS sent to {len(phone_numbers)} recipients")
                return result
            else:
                logger.error(f"Africa's Talking bulk SMS error: {result}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Africa's Talking bulk send failed: {str(e)}")
            return None
    
    async def get_account_balance(self) -> Optional[Dict[str, Any]]:
        """Get account balance.
        
        Returns:
            Account balance data or None on error
        """
        url = f"{self.BASE_URL}/version1/user"
        
        payload = {
            "username": self.username,
        }
        
        try:
            response = await self.client.get(
                url,
                params=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to get account balance: {str(e)}")
            return None
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class TwilioSMSIntegration:
    """Twilio SMS Integration - Global fallback."""
    
    BASE_URL = "https://api.twilio.com/2010-04-01"
    
    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        timeout: int = 30,
    ):
        """Initialize Twilio integration.
        
        Args:
            account_sid: Twilio account SID
            auth_token: Twilio auth token
            timeout: HTTP request timeout
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            timeout=timeout,
            auth=(account_sid, auth_token),
        )
    
    async def send_sms(
        self,
        to_phone: str,
        from_phone: str,
        message: str,
    ) -> Optional[Dict[str, Any]]:
        """Send SMS via Twilio.
        
        Args:
            to_phone: Recipient phone number
            from_phone: Twilio phone number
            message: SMS message
            
        Returns:
            Response data or None on error
        """
        url = f"{self.BASE_URL}/Accounts/{self.account_sid}/Messages.json"
        
        payload = {
            "To": to_phone,
            "From": from_phone,
            "Body": message,
        }
        
        try:
            response = await self.client.post(
                url,
                data=payload,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Twilio SMS sent: {result.get('sid')}")
            return result
        
        except httpx.HTTPError as e:
            logger.error(f"Twilio send failed: {str(e)}")
            return None
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class SMSIntegrationFactory:
    """Factory for SMS provider instances."""
    
    @staticmethod
    def create_sms_client(
        provider: SMSProvider | str,
        **config
    ) -> Optional[Any]:
        """Create SMS client for provider.
        
        Args:
            provider: SMS provider type
            **config: Provider-specific configuration
            
        Returns:
            SMS client instance or None
        """
        provider = SMSProvider(provider) if isinstance(provider, str) else provider
        
        if provider == SMSProvider.AFRICASTALKING:
            return AfricaTalkingSMSIntegration(
                api_key=config.get("api_key"),
                username=config.get("username", "sandbox"),
            )
        
        elif provider == SMSProvider.TWILIO:
            return TwilioSMSIntegration(
                account_sid=config.get("account_sid"),
                auth_token=config.get("auth_token"),
            )
        
        else:
            logger.warning(f"SMS provider {provider} not yet implemented")
            return None
