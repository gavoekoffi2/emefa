"""African Payment Integration for EMEFA - Mobile Money & Payment Gateways."""

import logging
import hmac
import hashlib
from typing import Dict, Optional, Any, List
from enum import Enum
from datetime import datetime
import httpx
import json

logger = logging.getLogger(__name__)


class PaymentProvider(str, Enum):
    """Payment providers for African markets."""
    MOMO_AFRICA = "momo_africa"  # Orange Money, MTN Mobile Money, Airtel, etc.
    PAYSTACK = "paystack"         # Paystack (Nigeria, Ghana, Kenya, etc.)
    FLUTTERWAVE = "flutterwave"   # Flutterwave (Pan-African)
    PESAPAL = "pesapal"           # PesaPal (Kenya, Uganda, Tanzania)
    INSTAPAY = "instapay"         # Instapay (Nigeria)


class MOMOAfricaIntegration:
    """MTN Mobile Money & Orange Money Integration."""
    
    BASE_URL = "https://api.mtn.com"
    
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        primary_key: str,
        timeout: int = 30,
    ):
        """Initialize MOMO Africa integration.
        
        Args:
            api_key: MOMO API key
            api_secret: MOMO API secret
            primary_key: Primary key for subscriptions
            timeout: HTTP request timeout
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.primary_key = primary_key
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _get_headers(self, request_id: str) -> Dict[str, str]:
        """Get request headers."""
        return {
            "X-Reference-Id": request_id,
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.primary_key,
        }
    
    async def request_to_pay(
        self,
        amount: float,
        currency: str,
        external_id: str,
        payer_message: str,
        payee_note: str,
        phone_number: str,
    ) -> Optional[Dict[str, Any]]:
        """Request payment from phone number.
        
        Args:
            amount: Payment amount
            currency: Currency code (e.g., 'XOF', 'GHS')
            external_id: External transaction ID
            payer_message: Message to payer
            payee_note: Note for payee
            phone_number: Phone number to request from
            
        Returns:
            Transaction reference or None on error
        """
        import uuid
        request_id = str(uuid.uuid4())
        
        url = f"{self.BASE_URL}/collection/v1_0/requesttopay"
        
        payload = {
            "amount": str(amount),
            "currency": currency,
            "externalId": external_id,
            "payerMessage": payer_message,
            "payeeNote": payee_note,
            "payer": {
                "partyIdType": "MSISDN",
                "partyId": phone_number,
            },
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(request_id),
            )
            response.raise_for_status()
            logger.info(f"MOMO request created: {request_id}")
            return {"reference_id": request_id}
        
        except httpx.HTTPError as e:
            logger.error(f"MOMO request failed: {str(e)}")
            return None
    
    async def get_transaction_status(
        self,
        reference_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get transaction status.
        
        Args:
            reference_id: Transaction reference ID
            
        Returns:
            Transaction status or None on error
        """
        url = f"{self.BASE_URL}/collection/v1_0/requesttopay/{reference_id}"
        
        try:
            response = await self.client.get(
                url,
                headers=self._get_headers(reference_id),
            )
            response.raise_for_status()
            return response.json()
        
        except httpx.HTTPError as e:
            logger.error(f"Failed to get status: {str(e)}")
            return None
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class PaystackIntegration:
    """Paystack Payment Integration."""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(
        self,
        secret_key: str,
        timeout: int = 30,
    ):
        """Initialize Paystack integration.
        
        Args:
            secret_key: Paystack secret key
            timeout: HTTP request timeout
        """
        self.secret_key = secret_key
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
    
    async def initialize_transaction(
        self,
        amount: int,  # In kobo (1/100 of currency unit)
        email: str,
        phone: str = None,
        metadata: Dict[str, Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """Initialize payment transaction.
        
        Args:
            amount: Amount in kobo/smallest unit
            email: Customer email
            phone: Customer phone (optional)
            metadata: Additional metadata
            
        Returns:
            Transaction data with authorization URL or None
        """
        url = f"{self.BASE_URL}/transaction/initialize"
        
        payload = {
            "amount": amount,
            "email": email,
        }
        
        if phone:
            payload["metadata"] = {"phone": phone, **(metadata or {})}
        elif metadata:
            payload["metadata"] = metadata
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("status"):
                logger.info(f"Paystack transaction initialized: {result['data']['reference']}")
                return result.get("data")
            else:
                logger.error(f"Paystack error: {result.get('message')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Paystack initialization failed: {str(e)}")
            return None
    
    async def verify_transaction(
        self,
        reference: str,
    ) -> Optional[Dict[str, Any]]:
        """Verify transaction.
        
        Args:
            reference: Transaction reference
            
        Returns:
            Transaction data or None on error
        """
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        
        try:
            response = await self.client.get(
                url,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("status"):
                return result.get("data")
            else:
                logger.error(f"Paystack verification error: {result.get('message')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Paystack verification failed: {str(e)}")
            return None
    
    async def create_transfer_recipient(
        self,
        type_name: str,
        account_number: str,
        bank_code: str,
        name: str,
    ) -> Optional[Dict[str, Any]]:
        """Create transfer recipient.
        
        Args:
            type_name: 'nuban' or 'mobile_money'
            account_number: Account or phone number
            bank_code: Bank code
            name: Recipient name
            
        Returns:
            Recipient data or None on error
        """
        url = f"{self.BASE_URL}/transferrecipient"
        
        payload = {
            "type": type_name,
            "account_number": account_number,
            "bank_code": bank_code,
            "name": name,
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("status"):
                return result.get("data")
            else:
                logger.error(f"Create recipient error: {result.get('message')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Create recipient failed: {str(e)}")
            return None
    
    async def initiate_transfer(
        self,
        source: str,
        amount: int,
        recipient: int,
        reason: str = None,
    ) -> Optional[Dict[str, Any]]:
        """Initiate transfer.
        
        Args:
            source: 'balance'
            amount: Amount in kobo
            recipient: Recipient ID
            reason: Transfer reason
            
        Returns:
            Transfer data or None on error
        """
        url = f"{self.BASE_URL}/transfer"
        
        payload = {
            "source": source,
            "amount": amount,
            "recipient": recipient,
        }
        
        if reason:
            payload["reason"] = reason
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("status"):
                logger.info(f"Transfer initiated: {result['data']['reference']}")
                return result.get("data")
            else:
                logger.error(f"Transfer error: {result.get('message')}")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"Transfer initiation failed: {str(e)}")
            return None
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class PaymentIntegrationFactory:
    """Factory for payment provider instances."""
    
    @staticmethod
    def create_payment_client(
        provider: PaymentProvider | str,
        **config
    ) -> Optional[Any]:
        """Create payment client for provider.
        
        Args:
            provider: Payment provider type
            **config: Provider-specific configuration
            
        Returns:
            Payment client instance or None
        """
        provider = PaymentProvider(provider) if isinstance(provider, str) else provider
        
        if provider == PaymentProvider.MOMO_AFRICA:
            return MOMOAfricaIntegration(
                api_key=config.get("api_key"),
                api_secret=config.get("api_secret"),
                primary_key=config.get("primary_key"),
            )
        
        elif provider == PaymentProvider.PAYSTACK:
            return PaystackIntegration(
                secret_key=config.get("secret_key"),
            )
        
        else:
            logger.warning(f"Payment provider {provider} not yet implemented")
            return None


class PaymentValidator:
    """Validate payment-related data."""
    
    @staticmethod
    def validate_phone_number(phone: str, country_code: str) -> bool:
        """Validate African phone number.
        
        Args:
            phone: Phone number (may start with + or country code)
            country_code: Country code (e.g., 'GH', 'NG', 'KE')
            
        Returns:
            True if valid
        """
        # Remove common prefixes
        clean = phone.replace("+", "").replace(" ", "").lstrip("0")
        
        # Basic validation (lengths vary by country)
        country_lengths = {
            "GH": 9,   # Ghana
            "NG": 10,  # Nigeria
            "KE": 9,   # Kenya
            "UG": 9,   # Uganda
            "TZ": 9,   # Tanzania
            "SN": 9,   # Senegal
            "CI": 8,   # Ivory Coast
        }
        
        expected_len = country_lengths.get(country_code)
        if expected_len:
            return len(clean) == expected_len
        
        # Default: at least 8 digits
        return len(clean) >= 8 and clean.isdigit()
    
    @staticmethod
    def validate_amount(amount: float | int) -> bool:
        """Validate payment amount.
        
        Args:
            amount: Payment amount
            
        Returns:
            True if valid
        """
        try:
            amount_float = float(amount)
            return amount_float > 0 and amount_float < 10000000  # Max 10M
        except (ValueError, TypeError):
            return False
