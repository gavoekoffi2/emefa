"""Tests for RAG pipeline components."""

import pytest
from app.services.rag_service import chunk_text, extract_text_from_file, crawl_url


def test_chunk_text_basic():
    """Test text chunking with overlap."""
    text = " ".join([f"word{i}" for i in range(100)])
    chunks = chunk_text(text, chunk_size=20, overlap=5)

    assert len(chunks) > 1
    # Each chunk should have roughly 20 words (except last)
    for chunk in chunks[:-1]:
        word_count = len(chunk.split())
        assert word_count <= 20


def test_chunk_text_empty():
    """Empty text should return empty list."""
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_short():
    """Short text should return single chunk."""
    chunks = chunk_text("Hello world this is a test", chunk_size=50)
    assert len(chunks) == 1
    assert chunks[0] == "Hello world this is a test"


def test_chunk_text_overlap():
    """Verify chunks overlap correctly."""
    words = [f"w{i}" for i in range(20)]
    text = " ".join(words)
    chunks = chunk_text(text, chunk_size=10, overlap=3)

    assert len(chunks) >= 2
    # First chunk should have first 10 words
    first_words = chunks[0].split()
    assert len(first_words) == 10
    # Second chunk should start 7 words in (10 - 3 overlap)
    second_words = chunks[1].split()
    assert second_words[0] == "w7"


def test_extract_text_from_txt():
    """Test plain text extraction."""
    content = b"Hello, this is a test document.\nWith multiple lines."
    text = extract_text_from_file(content, "test.txt")
    assert "Hello, this is a test document." in text
    assert "With multiple lines." in text


def test_extract_text_from_unknown():
    """Unknown file types should attempt UTF-8 decode."""
    content = b"Some content in unknown format"
    text = extract_text_from_file(content, "test.xyz")
    assert text == "Some content in unknown format"


def test_prompt_generator_fallback():
    """Test deterministic fallback prompt generation."""
    from app.services.prompt_generator import build_fallback_prompt

    prompt = build_fallback_prompt(
        objective="Aider les clients e-commerce",
        tone="friendly",
        language="fr",
    )

    assert "Aider les clients e-commerce" in prompt
    assert "friendly" in prompt
    assert "JAMAIS" in prompt  # Security rules
    assert "français" in prompt


def test_prompt_generator_with_rules():
    """Test fallback prompt with custom rules."""
    from app.services.prompt_generator import build_fallback_prompt

    prompt = build_fallback_prompt(
        objective="Support technique",
        custom_rules="Toujours demander le numéro de ticket",
    )

    assert "Support technique" in prompt
    assert "numéro de ticket" in prompt
    assert "RÈGLES ADDITIONNELLES" in prompt
