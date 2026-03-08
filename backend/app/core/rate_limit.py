"""Simple in-memory rate limiting middleware."""

import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Token bucket rate limiter per IP address."""

    def __init__(self, app, requests_per_minute: int | None = None):
        super().__init__(app)
        self.rpm = requests_per_minute or settings.RATE_LIMIT_REQUESTS_PER_MINUTE
        self._buckets: dict[str, list[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Clean old entries
        timestamps = self._buckets[client_ip]
        self._buckets[client_ip] = [t for t in timestamps if t > window_start]

        if len(self._buckets[client_ip]) >= self.rpm:
            return True

        self._buckets[client_ip].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        if self._is_rate_limited(client_ip):
            return Response(
                content='{"detail":"Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)
        return response
