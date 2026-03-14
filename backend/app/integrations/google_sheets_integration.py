"""Google Sheets Integration for EMEFA - Tier 1 Priority."""

import logging
import json
from typing import Dict, Optional, Any, List
from datetime import datetime
import httpx
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials

logger = logging.getLogger(__name__)


class GoogleSheetsIntegration:
    """Google Sheets API Integration."""
    
    BASE_URL = "https://sheets.googleapis.com/v4"
    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    
    def __init__(
        self,
        service_account_json: Dict[str, Any] | str,
        timeout: int = 30,
    ):
        """Initialize Google Sheets integration.
        
        Args:
            service_account_json: Service account JSON or path to file
            timeout: HTTP request timeout
        """
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        
        # Load credentials
        if isinstance(service_account_json, str):
            with open(service_account_json, 'r') as f:
                service_account_json = json.load(f)
        
        self.credentials = Credentials.from_service_account_info(
            service_account_json,
            scopes=self.SCOPES,
        )
        self.access_token = None
        self.token_expiry = None
    
    async def _ensure_token(self):
        """Ensure access token is valid and refreshed if needed."""
        if self.access_token and self.token_expiry and datetime.utcnow() < self.token_expiry:
            return
        
        request = Request()
        self.credentials.refresh(request)
        self.access_token = self.credentials.token
        self.token_expiry = self.credentials.expiry
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
    
    # ========================
    # Read Operations
    # ========================
    
    async def get_spreadsheet(
        self,
        spreadsheet_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get spreadsheet metadata.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            
        Returns:
            Spreadsheet metadata or None on error
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}"
        
        try:
            response = await self.client.get(
                url,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to get spreadsheet: {str(e)}")
            return None
    
    async def get_values(
        self,
        spreadsheet_id: str,
        range_name: str,
    ) -> Optional[List[List[str]]]:
        """Get values from a range.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range (e.g., "Sheet1!A1:D10")
            
        Returns:
            List of rows or None on error
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}/values/{range_name}"
        
        try:
            response = await self.client.get(
                url,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()
            return data.get("values", [])
        except httpx.HTTPError as e:
            logger.error(f"Failed to get values: {str(e)}")
            return None
    
    async def get_values_as_dicts(
        self,
        spreadsheet_id: str,
        range_name: str,
    ) -> Optional[List[Dict[str, str]]]:
        """Get values as list of dictionaries (first row as keys).
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            
        Returns:
            List of dictionaries or None on error
        """
        values = await self.get_values(spreadsheet_id, range_name)
        
        if not values or len(values) < 2:
            return None
        
        headers = values[0]
        rows = values[1:]
        
        result = []
        for row in rows:
            # Pad row with empty strings if necessary
            while len(row) < len(headers):
                row.append("")
            
            row_dict = {header: value for header, value in zip(headers, row)}
            result.append(row_dict)
        
        return result
    
    # ========================
    # Write Operations
    # ========================
    
    async def append_values(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
    ) -> Optional[Dict[str, Any]]:
        """Append values to a range.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            values: List of rows to append
            
        Returns:
            Response data or None on error
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}/values/{range_name}:append"
        
        payload = {
            "values": values,
        }
        
        params = {
            "valueInputOption": "RAW",
            "insertDataOption": "INSERT_ROWS",
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                params=params,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            logger.info(f"Values appended to {range_name}")
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to append values: {str(e)}")
            return None
    
    async def update_values(
        self,
        spreadsheet_id: str,
        range_name: str,
        values: List[List[Any]],
    ) -> Optional[Dict[str, Any]]:
        """Update values in a range.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            values: List of rows to update
            
        Returns:
            Response data or None on error
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}/values/{range_name}"
        
        payload = {
            "values": values,
        }
        
        params = {
            "valueInputOption": "RAW",
        }
        
        try:
            response = await self.client.put(
                url,
                json=payload,
                params=params,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            logger.info(f"Values updated in {range_name}")
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to update values: {str(e)}")
            return None
    
    async def append_row_as_dict(
        self,
        spreadsheet_id: str,
        range_name: str,
        row_dict: Dict[str, Any],
    ) -> bool:
        """Append a row from a dictionary.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            row_dict: Dictionary with column headers as keys
            
        Returns:
            True if successful
        """
        # First get headers to maintain order
        values = await self.get_values(spreadsheet_id, range_name)
        
        if not values:
            logger.error("Could not get headers from sheet")
            return False
        
        headers = values[0]
        
        # Build row in correct order
        row = [str(row_dict.get(header, "")) for header in headers]
        
        result = await self.append_values(
            spreadsheet_id,
            range_name,
            [row],
        )
        
        return result is not None
    
    # ========================
    # Batch Operations
    # ========================
    
    async def batch_update(
        self,
        spreadsheet_id: str,
        requests: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Perform batch update operations.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            requests: List of request objects
            
        Returns:
            Response data or None on error
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}:batchUpdate"
        
        payload = {
            "requests": requests,
        }
        
        try:
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            logger.info(f"Batch update completed for spreadsheet {spreadsheet_id}")
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to batch update: {str(e)}")
            return None
    
    async def create_sheet(
        self,
        spreadsheet_id: str,
        title: str,
    ) -> Optional[Dict[str, Any]]:
        """Create a new sheet.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            title: Sheet title
            
        Returns:
            Sheet data or None on error
        """
        requests = [
            {
                "addSheet": {
                    "properties": {
                        "title": title,
                    }
                }
            }
        ]
        
        result = await self.batch_update(spreadsheet_id, requests)
        
        if result:
            return result.get("replies", [{}])[0]
        
        return None
    
    # ========================
    # Utilities
    # ========================
    
    async def search_in_range(
        self,
        spreadsheet_id: str,
        range_name: str,
        search_text: str,
        column_index: int = 0,
    ) -> Optional[Dict[str, Any]]:
        """Search for text in a range.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            search_text: Text to search for
            column_index: Column to search in (0-based)
            
        Returns:
            First matching row as dict or None
        """
        rows = await self.get_values_as_dicts(spreadsheet_id, range_name)
        
        if not rows:
            return None
        
        # Get header at column_index
        values = await self.get_values(spreadsheet_id, range_name)
        if not values or len(values[0]) <= column_index:
            return None
        
        header = values[0][column_index]
        
        # Search
        for row in rows:
            if header in row and search_text in row[header]:
                return row
        
        return None
    
    async def clear_range(
        self,
        spreadsheet_id: str,
        range_name: str,
    ) -> bool:
        """Clear values in a range.
        
        Args:
            spreadsheet_id: Google Sheets spreadsheet ID
            range_name: A1 notation range
            
        Returns:
            True if successful
        """
        await self._ensure_token()
        
        url = f"{self.BASE_URL}/spreadsheets/{spreadsheet_id}/values/{range_name}:clear"
        
        try:
            response = await self.client.post(
                url,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            logger.info(f"Range {range_name} cleared")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to clear range: {str(e)}")
            return False
    
    # ========================
    # Cleanup
    # ========================
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
