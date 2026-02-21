"""Tests for the Actions system."""

import pytest
from app.services.actions_service import (
    get_available_actions,
    validate_action,
    AVAILABLE_ACTIONS,
)


def test_available_actions():
    """Test that actions are registered."""
    actions = get_available_actions()
    assert len(actions) > 0
    assert any(a["name"] == "send_email" for a in actions)
    assert any(a["name"] == "web_search" for a in actions)


def test_validate_action_enabled():
    """Test action validation with enabled actions."""
    enabled = {"send_email": True, "web_search": True}
    assert validate_action("send_email", enabled) is True
    assert validate_action("web_search", enabled) is True


def test_validate_action_disabled():
    """Test action validation with disabled actions."""
    enabled = {"send_email": False}
    assert validate_action("send_email", enabled) is False


def test_validate_action_not_in_list():
    """Test action validation for non-existent action."""
    assert validate_action("hack_system", {"hack_system": True}) is False


def test_validate_action_empty_config():
    """Test with empty enabled actions."""
    assert validate_action("send_email", {}) is False


def test_action_has_required_fields():
    """Each action should have name, description, category, permissions, rate_limit."""
    for name, action in AVAILABLE_ACTIONS.items():
        assert "name" in action
        assert "description" in action
        assert "category" in action
        assert "permissions" in action
        assert "rate_limit" in action
        assert isinstance(action["permissions"], list)
        assert isinstance(action["rate_limit"], int)
