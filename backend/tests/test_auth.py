"""Tests for authentication endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    encrypt_data,
    decrypt_data,
)


def test_password_hashing():
    """Test bcrypt password hashing and verification."""
    password = "secure_password_123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_jwt_tokens():
    """Test JWT access and refresh token creation/decoding."""
    data = {"sub": "user-123", "email": "test@example.com"}

    access = create_access_token(data)
    decoded = decode_token(access)

    assert decoded["sub"] == "user-123"
    assert decoded["email"] == "test@example.com"
    assert decoded["type"] == "access"

    refresh = create_refresh_token(data)
    decoded_r = decode_token(refresh)

    assert decoded_r["sub"] == "user-123"
    assert decoded_r["type"] == "refresh"


def test_jwt_token_different():
    """Access and refresh tokens should be different."""
    data = {"sub": "user-456"}
    access = create_access_token(data)
    refresh = create_refresh_token(data)
    assert access != refresh


def test_encryption():
    """Test Fernet encryption/decryption for data at rest."""
    plaintext = "This is a secret memory fact"
    encrypted = encrypt_data(plaintext)

    assert encrypted != plaintext
    assert decrypt_data(encrypted) == plaintext


def test_encryption_different_outputs():
    """Same input should produce different ciphertext (Fernet uses random IV)."""
    plaintext = "test data"
    enc1 = encrypt_data(plaintext)
    enc2 = encrypt_data(plaintext)
    # Fernet uses different IV each time
    assert enc1 != enc2
    assert decrypt_data(enc1) == plaintext
    assert decrypt_data(enc2) == plaintext
