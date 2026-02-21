"""Test configuration."""

import os

# Set test environment variables before importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///test.db")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-testing-only-32chars")
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-not-for-prod")
os.environ.setdefault("LIVEKIT_API_KEY", "devkey")
os.environ.setdefault("LIVEKIT_API_SECRET", "secret1234567890")
