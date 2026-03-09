"""Tests for architect template, bridge, and project features.

These tests use only pure logic functions (no DB dependencies).
"""

import hashlib
import json
import os
import secrets

import pytest

# Set test env before any app imports
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///test.db")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-testing-only-32chars")
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-not-for-prod")


# ── Template Tests (pure logic, no DB) ──────────────────────────────

class TestArchitectTemplate:
    def test_template_has_required_fields(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        required_keys = [
            "name", "category", "description", "default_objective",
            "default_tone", "default_language", "system_prompt_template",
            "checklist_questions", "required_bridge", "metadata_json",
        ]
        for key in required_keys:
            assert key in ARCHITECT_TEMPLATE, f"Missing key: {key}"

    def test_template_category_is_architect(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        assert ARCHITECT_TEMPLATE["category"].value == "architect"

    def test_template_has_five_checklist_questions(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        assert len(ARCHITECT_TEMPLATE["checklist_questions"]) == 5

    def test_checklist_required_fields(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        for q in ARCHITECT_TEMPLATE["checklist_questions"]:
            assert "id" in q
            assert "question" in q
            assert "type" in q
            assert "required" in q

    def test_template_requires_blender_bridge(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        assert ARCHITECT_TEMPLATE["required_bridge"] == "blender"

    def test_template_metadata_includes_connectors(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        meta = ARCHITECT_TEMPLATE["metadata_json"]
        assert "connectors" in meta
        assert "blender" in meta["connectors"]
        assert "future_connectors" in meta

    def test_system_prompt_has_coaching_mode(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        prompt = ARCHITECT_TEMPLATE["system_prompt_template"]
        assert "COACHING" in prompt

    def test_system_prompt_has_security_rules(self):
        from app.services.template_service import ARCHITECT_TEMPLATE
        prompt = ARCHITECT_TEMPLATE["system_prompt_template"]
        assert "SÉCURITÉ" in prompt

    def test_build_architect_system_prompt(self):
        from app.services.template_service import build_architect_system_prompt

        class MockTemplate:
            system_prompt_template = "Rôle: {language} {tone}\n{checklist_questions}\n{custom_rules}"
            checklist_questions = [
                {"question": "Q1?", "required": True},
                {"question": "Q2?", "required": False},
            ]

        result = build_architect_system_prompt(
            MockTemplate(), language="fr", tone="professional", custom_rules="Test rule"
        )
        assert "fr" in result
        assert "professional" in result
        assert "Q1?" in result
        assert "Test rule" in result

    def test_export_template_json(self):
        from app.services.template_service import export_template_json

        class MockTemplate:
            name = "Test"
            category = "architect"
            description = "Desc"
            icon = "building"
            default_objective = "Obj"
            default_tone = "pro"
            default_language = "fr"
            default_custom_rules = "Rules"
            system_prompt_template = "Prompt"
            checklist_questions = [{"q": "test"}]
            default_channels = {"web_chat_enabled": True}
            required_bridge = "blender"
            metadata_json = {"x": 1}

        result = export_template_json(MockTemplate())
        assert result["name"] == "Test"
        assert result["required_bridge"] == "blender"
        json.dumps(result)


# ── Bridge Tests (pure logic, no DB) ────────────────────────────────

class TestBridgeCommands:
    def test_all_blender_commands_exist(self):
        from app.services.bridge_service import BLENDER_COMMANDS
        expected = [
            "create_object", "import_reference", "apply_material",
            "set_dimensions", "setup_camera", "setup_lighting",
            "render", "export", "execute_script",
        ]
        for cmd in expected:
            assert cmd in BLENDER_COMMANDS, f"Missing command: {cmd}"

    def test_commands_have_required_fields(self):
        from app.services.bridge_service import BLENDER_COMMANDS
        for name, cmd in BLENDER_COMMANDS.items():
            assert "description" in cmd, f"{name} missing description"
            assert "parameters" in cmd, f"{name} missing parameters"
            assert "permission" in cmd, f"{name} missing permission"

    def test_default_permissions(self):
        from app.services.bridge_service import DEFAULT_PERMISSIONS
        assert DEFAULT_PERMISSIONS["open_blender"] is True
        assert DEFAULT_PERMISSIONS["import_image"] is True
        assert DEFAULT_PERMISSIONS["create_mesh"] is True
        assert DEFAULT_PERMISSIONS["export"] is True
        assert DEFAULT_PERMISSIONS["execute_script"] is False

    def test_check_permission_allowed(self):
        from app.services.bridge_service import check_permission

        class MockDevice:
            permissions = {"create_mesh": True, "export": True}

        assert check_permission(MockDevice(), "create_object") is True
        assert check_permission(MockDevice(), "render") is True

    def test_check_permission_denied(self):
        from app.services.bridge_service import check_permission

        class MockDevice:
            permissions = {"create_mesh": True, "export": False}

        assert check_permission(MockDevice(), "render") is False

    def test_check_permission_unknown_action(self):
        from app.services.bridge_service import check_permission

        class MockDevice:
            permissions = {"create_mesh": True}

        assert check_permission(MockDevice(), "nonexistent_action") is False

    def test_execute_script_needs_explicit_permission(self):
        from app.services.bridge_service import check_permission, DEFAULT_PERMISSIONS

        class MockDevice:
            permissions = DEFAULT_PERMISSIONS.copy()

        assert check_permission(MockDevice(), "execute_script") is False

    def test_get_available_commands(self):
        from app.services.bridge_service import get_available_commands
        commands = get_available_commands()
        assert isinstance(commands, dict)
        assert len(commands) >= 8

    def test_ws_connection_management(self):
        from app.services.bridge_service import (
            register_ws_connection,
            unregister_ws_connection,
            is_device_online,
            get_ws_connection,
        )
        register_ws_connection("test-device-123", "mock-ws")
        assert is_device_online("test-device-123") is True
        assert get_ws_connection("test-device-123") == "mock-ws"

        unregister_ws_connection("test-device-123")
        assert is_device_online("test-device-123") is False
        assert get_ws_connection("test-device-123") is None


class TestBridgeAuth:
    def test_token_hash_consistency(self):
        token = secrets.token_urlsafe(48)
        hash1 = hashlib.sha256(token.encode()).hexdigest()
        hash2 = hashlib.sha256(token.encode()).hexdigest()
        assert hash1 == hash2

    def test_different_tokens_different_hashes(self):
        token1 = secrets.token_urlsafe(48)
        token2 = secrets.token_urlsafe(48)
        hash1 = hashlib.sha256(token1.encode()).hexdigest()
        hash2 = hashlib.sha256(token2.encode()).hexdigest()
        assert hash1 != hash2


# ── Architect Project Tests (pure logic) ─────────────────────────────

class TestArchitectProject:
    def test_generate_action_plan_structure(self):
        from app.services.architect_service import generate_action_plan
        plan = generate_action_plan("Maison moderne 150m2")
        assert "steps" in plan
        assert "total_steps" in plan
        assert "brief_summary" in plan
        assert plan["total_steps"] == len(plan["steps"])

    def test_generate_action_plan_has_six_steps(self):
        from app.services.architect_service import generate_action_plan
        plan = generate_action_plan("Test brief")
        assert len(plan["steps"]) == 6

    def test_action_plan_steps_are_ordered(self):
        from app.services.architect_service import generate_action_plan
        plan = generate_action_plan("Test")
        for i, step in enumerate(plan["steps"]):
            assert step["step"] == i + 1

    def test_action_plan_steps_have_valid_actions(self):
        from app.services.architect_service import generate_action_plan
        from app.services.bridge_service import BLENDER_COMMANDS
        plan = generate_action_plan("Test")
        for step in plan["steps"]:
            assert "actions" in step
            assert len(step["actions"]) > 0
            for action in step["actions"]:
                assert action in BLENDER_COMMANDS

    def test_action_plan_all_steps_pending(self):
        from app.services.architect_service import generate_action_plan
        plan = generate_action_plan("Test")
        for step in plan["steps"]:
            assert step["status"] == "pending"

    def test_action_plan_with_checklist(self):
        from app.services.architect_service import generate_action_plan
        checklist = {"dimensions": "10x8x3", "style": "moderne"}
        plan = generate_action_plan("Maison", checklist)
        assert plan["checklist"] == checklist

    def test_action_plan_brief_truncation(self):
        from app.services.architect_service import generate_action_plan
        long_brief = "A" * 300
        plan = generate_action_plan(long_brief)
        assert len(plan["brief_summary"]) <= 200

    def test_action_plan_empty_brief(self):
        from app.services.architect_service import generate_action_plan
        plan = generate_action_plan("")
        assert "Pas de brief" in plan["brief_summary"]
