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

    def _is_rate_limited(self, client_ip: str) -> tuple[bool, int, int]:
        """Returns (is_limited, remaining, reset_seconds)."""
        now = time.time()
        window_start = now - 60.0

        # Clean old entries
        timestamps = self._buckets[client_ip]
        self._buckets[client_ip] = [t for t in timestamps if t > window_start]

        current_count = len(self._buckets[client_ip])
        remaining = max(0, self.rpm - current_count)
        # Reset time: seconds until the oldest entry in the window expires
        reset = int(self._buckets[client_ip][0] + 60.0 - now) if self._buckets[client_ip] else 60

        if current_count >= self.rpm:
            return True, 0, reset

        self._buckets[client_ip].append(now)
        remaining = max(0, self.rpm - current_count - 1)
        return False, remaining, reset

    def _cleanup_stale_buckets(self):
        """Remove buckets with no recent activity to prevent memory leaks."""
        now = time.time()
        window_start = now - 60.0
        stale_keys = [ip for ip, timestamps in self._buckets.items()
                      if not timestamps or all(t <= window_start for t in timestamps)]
        for key in stale_keys:
            del self._buckets[key]

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        is_limited, remaining, reset = self._is_rate_limited(client_ip)

        # Periodic cleanup of stale buckets (every 100 requests approx)
        if len(self._buckets) > 100:
            self._cleanup_stale_buckets()

        if is_limited:
            return Response(
                content='{"detail":"Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.rpm),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset)
        return response
