"""Blender Script: Render & Export
Usage: Called by EMEFA Desktop Bridge for rendering and exporting scenes.
Compatible with Blender 3.6+
"""

import bpy
import os
from typing import Optional


def render_scene(
    output_path: str = "//render_output.png",
    resolution_x: int = 1920,
    resolution_y: int = 1080,
    samples: int = 128,
    engine: str = "BLENDER_EEVEE_NEXT",
    output_format: str = "PNG",
) -> dict:
    """Render the current scene.

    Args:
        output_path: Output file path (// = relative to .blend file)
        resolution_x: Horizontal resolution
        resolution_y: Vertical resolution
        samples: Render samples (higher = better quality, slower)
        engine: CYCLES or BLENDER_EEVEE_NEXT
        output_format: PNG, JPEG, OPEN_EXR

    Returns:
        dict with render info
    """
    scene = bpy.context.scene

    # Set render engine
    engine_map = {
        "cycles": "CYCLES",
        "eevee": "BLENDER_EEVEE_NEXT",
        "CYCLES": "CYCLES",
        "BLENDER_EEVEE_NEXT": "BLENDER_EEVEE_NEXT",
    }
    scene.render.engine = engine_map.get(engine, "BLENDER_EEVEE_NEXT")

    # Set resolution
    scene.render.resolution_x = resolution_x
    scene.render.resolution_y = resolution_y
    scene.render.resolution_percentage = 100

    # Set samples
    if scene.render.engine == "CYCLES":
        scene.cycles.samples = samples
    else:
        scene.eevee.taa_render_samples = min(samples, 64)

    # Set output
    scene.render.filepath = output_path
    scene.render.image_settings.file_format = output_format

    # Render
    bpy.ops.render.render(write_still=True)

    abs_path = bpy.path.abspath(output_path)
    return {
        "output_path": abs_path,
        "resolution": f"{resolution_x}x{resolution_y}",
        "engine": scene.render.engine,
        "samples": samples,
        "format": output_format,
    }


def export_scene(
    format: str = "glb",
    filename: str = "export",
    output_dir: Optional[str] = None,
    selected_only: bool = False,
) -> dict:
    """Export the scene in various formats.

    Args:
        format: blend, glb, fbx, obj
        filename: Output filename (without extension)
        output_dir: Output directory (default: same as .blend file)
        selected_only: Export only selected objects

    Returns:
        dict with export info
    """
    if not output_dir:
        if bpy.data.filepath:
            output_dir = os.path.dirname(bpy.data.filepath)
        else:
            output_dir = os.path.expanduser("~/EMEFA_exports")

    os.makedirs(output_dir, exist_ok=True)

    filepath = os.path.join(output_dir, f"{filename}.{format}")

    if format == "blend":
        bpy.ops.wm.save_as_mainfile(filepath=filepath, copy=True)

    elif format == "glb":
        bpy.ops.export_scene.gltf(
            filepath=filepath,
            export_format='GLB',
            use_selection=selected_only,
            export_apply=True,
        )

    elif format == "fbx":
        bpy.ops.export_scene.fbx(
            filepath=filepath,
            use_selection=selected_only,
            apply_scale_options='FBX_SCALE_ALL',
        )

    elif format == "obj":
        bpy.ops.wm.obj_export(
            filepath=filepath,
            export_selected_objects=selected_only,
        )

    else:
        return {"error": f"Unknown format: {format}"}

    return {
        "filepath": filepath,
        "format": format,
        "size_bytes": os.path.getsize(filepath) if os.path.exists(filepath) else 0,
    }


def import_reference_image(
    file_path: str,
    name: str = "Reference",
    position: str = "front",
) -> dict:
    """Import an image as a reference in the scene.

    Args:
        file_path: Path to the image file
        name: Name for the reference object
        position: front, back, left, right, top

    Returns:
        dict with reference info
    """
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    positions = {
        "front": {"location": (0, -10, 2), "rotation": (1.5708, 0, 0)},
        "back": {"location": (0, 10, 2), "rotation": (1.5708, 0, 3.14159)},
        "left": {"location": (-10, 0, 2), "rotation": (1.5708, 0, -1.5708)},
        "right": {"location": (10, 0, 2), "rotation": (1.5708, 0, 1.5708)},
        "top": {"location": (0, 0, 10), "rotation": (0, 0, 0)},
    }

    pos_config = positions.get(position, positions["front"])

    bpy.ops.object.empty_add(
        type='IMAGE',
        location=pos_config["location"],
        rotation=pos_config["rotation"],
    )

    ref_obj = bpy.context.active_object
    ref_obj.name = f"Ref_{name}"

    # Load and assign image
    img = bpy.data.images.load(file_path)
    ref_obj.data = img
    ref_obj.empty_display_size = 5

    return {
        "name": ref_obj.name,
        "position": position,
        "image": file_path,
        "location": list(ref_obj.location),
    }


if __name__ == "__main__":
    import json
    import sys

    params = {}
    if len(sys.argv) > 1:
        params = json.loads(sys.argv[1])

    action = params.pop("action", "render")
    if action == "render":
        result = render_scene(**params)
    elif action == "export":
        result = export_scene(**params)
    elif action == "import_reference":
        result = import_reference_image(**params)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result))
