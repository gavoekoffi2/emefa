"""EMEFA Desktop Bridge Agent
Runs on the user's PC to connect their local Blender to the EMEFA cloud platform.

Installation:
    pip install websockets httpx
    python emefa_bridge.py --server wss://your-emefa.com --device-id <ID> --token <TOKEN>

Requirements:
    - Python 3.10+
    - Blender 3.6+ installed on this machine
    - websockets, httpx packages
"""

import argparse
import asyncio
import json
import logging
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

try:
    import websockets
except ImportError:
    print("ERROR: websockets package required. Install with: pip install websockets")
    sys.exit(1)

try:
    import httpx
except ImportError:
    print("ERROR: httpx package required. Install with: pip install httpx")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("emefa-bridge")

# Blender scripts directory (relative to this file)
SCRIPTS_DIR = Path(__file__).parent.parent / "templates" / "architecte" / "blender_scripts"


class BlenderBridge:
    """Manages Blender process and script execution."""

    def __init__(self, blender_path: str = "blender"):
        self.blender_path = blender_path
        self._validate_blender()

    def _validate_blender(self):
        """Check that Blender is accessible."""
        try:
            result = subprocess.run(
                [self.blender_path, "--version"],
                capture_output=True, text=True, timeout=10,
            )
            version_line = result.stdout.strip().split("\n")[0]
            logger.info(f"Blender found: {version_line}")
            self.blender_version = version_line
        except (FileNotFoundError, subprocess.TimeoutExpired):
            logger.error(f"Blender not found at: {self.blender_path}")
            logger.error("Set --blender-path to your Blender executable")
            self.blender_version = None

    def get_script_for_action(self, action_type: str) -> Optional[str]:
        """Get the Blender Python script for a given action type."""
        script_map = {
            "create_object": "create_object.py",
            "apply_material": "apply_material.py",
            "setup_camera": "setup_scene.py",
            "setup_lighting": "setup_scene.py",
            "import_reference": "render_export.py",
            "render": "render_export.py",
            "export": "render_export.py",
            "set_dimensions": "create_object.py",
        }
        script_name = script_map.get(action_type)
        if script_name:
            script_path = SCRIPTS_DIR / script_name
            if script_path.exists():
                return str(script_path)
        return None

    async def execute_action(self, action_type: str, parameters: dict) -> dict:
        """Execute a Blender action by running the appropriate script.

        The script is run in Blender's background mode with parameters
        passed as JSON via command-line arguments.
        """
        if not self.blender_version:
            return {"status": "failed", "error": "Blender not available"}

        script_path = self.get_script_for_action(action_type)

        if action_type == "execute_script":
            # Custom script execution (requires explicit permission)
            custom_script = parameters.get("script", "")
            if not custom_script:
                return {"status": "failed", "error": "No script provided"}

            # Write custom script to temp file
            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.py', delete=False, prefix='emefa_'
            ) as f:
                f.write(custom_script)
                script_path = f.name

            try:
                result = await self._run_blender_script(script_path, parameters)
                return result
            finally:
                os.unlink(script_path)

        if not script_path:
            return {"status": "failed", "error": f"No script found for action: {action_type}"}

        # Build a wrapper script that calls the right function
        wrapper = self._build_wrapper_script(action_type, parameters, script_path)

        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.py', delete=False, prefix='emefa_wrapper_'
        ) as f:
            f.write(wrapper)
            wrapper_path = f.name

        try:
            result = await self._run_blender_script(wrapper_path, parameters)
            return result
        finally:
            os.unlink(wrapper_path)

    def _build_wrapper_script(self, action_type: str, parameters: dict, script_path: str) -> str:
        """Build a wrapper script that imports and calls the right function."""
        params_json = json.dumps(parameters)
        return f"""
import sys
import json
sys.path.insert(0, {json.dumps(str(SCRIPTS_DIR))})

params = json.loads('''{params_json}''')

action_type = {json.dumps(action_type)}

if action_type == "create_object":
    from create_object import create_object
    result = create_object(**params)
elif action_type == "apply_material":
    from apply_material import apply_material
    result = apply_material(**params)
elif action_type in ("setup_camera", "setup_lighting"):
    from setup_scene import setup_camera, setup_lighting
    if action_type == "setup_camera":
        result = setup_camera(**params)
    else:
        result = setup_lighting(**params)
elif action_type == "render":
    from render_export import render_scene
    result = render_scene(**params)
elif action_type == "export":
    from render_export import export_scene
    result = export_scene(**params)
elif action_type == "import_reference":
    from render_export import import_reference_image
    result = import_reference_image(**params)
elif action_type == "set_dimensions":
    import bpy
    obj = bpy.data.objects.get(params.get("object_name", ""))
    if obj:
        obj.dimensions = (params.get("width", 1), params.get("depth", 1), params.get("height", 1))
        result = {{"object": obj.name, "dimensions": list(obj.dimensions)}}
    else:
        result = {{"error": "Object not found"}}
else:
    result = {{"error": f"Unknown action: {{action_type}}"}}

print("EMEFA_RESULT:" + json.dumps(result))
"""

    async def _run_blender_script(self, script_path: str, parameters: dict) -> dict:
        """Run a Python script inside Blender and capture output."""
        cmd = [
            self.blender_path,
            "--background",
            "--python", script_path,
        ]

        logger.info(f"Running Blender: {' '.join(cmd)}")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=120
            )

            output = stdout.decode("utf-8", errors="replace")
            errors = stderr.decode("utf-8", errors="replace")

            # Look for our result marker in stdout
            for line in output.split("\n"):
                if line.startswith("EMEFA_RESULT:"):
                    result_json = line[len("EMEFA_RESULT:"):]
                    return {
                        "status": "completed",
                        "result": json.loads(result_json),
                    }

            # No result marker found
            return {
                "status": "completed",
                "result": {"output": output[-500:] if output else "No output"},
                "warnings": errors[-500:] if errors else None,
            }

        except asyncio.TimeoutError:
            return {"status": "failed", "error": "Blender script timed out (120s)"}
        except Exception as e:
            return {"status": "failed", "error": str(e)}


class EMEFABridgeClient:
    """WebSocket client that connects to the EMEFA cloud and executes Blender commands."""

    def __init__(
        self,
        server_url: str,
        device_id: str,
        device_token: str,
        blender_path: str = "blender",
    ):
        self.server_url = server_url
        self.device_id = device_id
        self.device_token = device_token
        self.blender = BlenderBridge(blender_path)
        self._running = True

    async def connect(self):
        """Connect to the EMEFA server and process commands."""
        ws_url = f"{self.server_url}/api/v1/bridge/ws/{self.device_id}?token={self.device_token}"
        logger.info(f"Connecting to EMEFA server: {self.server_url}")

        reconnect_delay = 2
        max_delay = 60

        while self._running:
            try:
                async with websockets.connect(ws_url, ping_interval=30) as ws:
                    logger.info("Connected to EMEFA server!")
                    reconnect_delay = 2

                    # Send capability update
                    await ws.send(json.dumps({
                        "type": "capability_update",
                        "blender_version": self.blender.blender_version,
                    }))

                    # Start heartbeat task
                    heartbeat_task = asyncio.create_task(self._heartbeat(ws))

                    try:
                        await self._message_loop(ws)
                    finally:
                        heartbeat_task.cancel()

            except websockets.exceptions.ConnectionClosed as e:
                logger.warning(f"Connection closed: {e}")
            except Exception as e:
                logger.error(f"Connection error: {e}")

            if self._running:
                logger.info(f"Reconnecting in {reconnect_delay}s...")
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_delay)

    async def _heartbeat(self, ws):
        """Send periodic heartbeats."""
        while True:
            try:
                await asyncio.sleep(30)
                await ws.send(json.dumps({"type": "heartbeat"}))
            except Exception:
                break

    async def _message_loop(self, ws):
        """Process incoming messages from the server."""
        async for raw_msg in ws:
            try:
                msg = json.loads(raw_msg)
                msg_type = msg.get("type")

                if msg_type == "connected":
                    logger.info(f"Server confirmed connection. Permissions: {msg.get('permissions')}")
                    logger.info(f"Available commands: {msg.get('commands')}")

                elif msg_type == "pong":
                    pass  # Heartbeat response

                elif msg_type == "execute_action":
                    action_id = msg.get("action_id")
                    action_type = msg.get("action_type")
                    parameters = msg.get("parameters", {})

                    logger.info(f"Executing action: {action_type} (ID: {action_id})")

                    # Execute in Blender
                    result = await self.blender.execute_action(action_type, parameters)

                    # Send result back
                    await ws.send(json.dumps({
                        "type": "action_result",
                        "action_id": action_id,
                        "status": result.get("status", "completed"),
                        "result": result.get("result"),
                        "error": result.get("error"),
                    }))

                    logger.info(f"Action {action_id} result: {result.get('status')}")

                else:
                    logger.debug(f"Unknown message type: {msg_type}")

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {raw_msg[:100]}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")

    def stop(self):
        """Stop the bridge client."""
        self._running = False


def main():
    parser = argparse.ArgumentParser(
        description="EMEFA Desktop Bridge - Connect your local Blender to EMEFA cloud",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python emefa_bridge.py --server wss://emefa.example.com --device-id abc123 --token xyz789
  python emefa_bridge.py --server ws://localhost:8000 --device-id abc123 --token xyz789 --blender-path /usr/bin/blender
        """,
    )
    parser.add_argument("--server", required=True, help="EMEFA server URL (ws:// or wss://)")
    parser.add_argument("--device-id", required=True, help="Device ID from EMEFA registration")
    parser.add_argument("--token", required=True, help="Device token from EMEFA registration")
    parser.add_argument("--blender-path", default="blender", help="Path to Blender executable")

    args = parser.parse_args()

    client = EMEFABridgeClient(
        server_url=args.server,
        device_id=args.device_id,
        device_token=args.token,
        blender_path=args.blender_path,
    )

    logger.info("=" * 60)
    logger.info("  EMEFA Desktop Bridge")
    logger.info("  Connecting your Blender to the cloud...")
    logger.info("=" * 60)

    try:
        asyncio.run(client.connect())
    except KeyboardInterrupt:
        logger.info("Bridge stopped by user.")
        client.stop()


if __name__ == "__main__":
    main()
