"""Security utilities: hashing, JWT, encryption."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt
from cryptography.fernet import Fernet

from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# Fernet encryption for data at rest (memory, secrets)
_fernet: Optional[Fernet] = None

import logging as _logging
_security_logger = _logging.getLogger("emefa.security")


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = settings.ENCRYPTION_KEY
        if key == "change-me-fernet-key" or len(key) != 44:
            _security_logger.warning(
                "ENCRYPTION_KEY is not set or invalid. Generating a temporary key. "
                "Data encrypted with this key will be LOST on restart. "
                "Set a valid Fernet key via: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )
            _fernet = Fernet(Fernet.generate_key())
        else:
            _fernet = Fernet(key.encode())
    return _fernet


def encrypt_data(data: str) -> str:
    return get_fernet().encrypt(data.encode()).decode()


def decrypt_data(encrypted: str) -> str:
    return get_fernet().decrypt(encrypted.encode()).decode()
