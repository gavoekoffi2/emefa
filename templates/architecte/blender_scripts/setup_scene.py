"""Blender Script: Scene Setup
Usage: Called by EMEFA Desktop Bridge to set up a new architectural scene.
Compatible with Blender 3.6+
"""

import bpy
import math


def setup_camera(
    location: tuple = (10, -10, 8),
    target: tuple = (0, 0, 0),
    focal_length: float = 50,
) -> dict:
    """Position the camera and point it at a target.

    Args:
        location: Camera position (x, y, z)
        target: Point the camera looks at
        focal_length: Lens focal length in mm

    Returns:
        dict with camera info
    """
    # Get or create camera
    cam = bpy.data.objects.get("Camera")
    if not cam:
        cam_data = bpy.data.cameras.new("Camera")
        cam = bpy.data.objects.new("Camera", cam_data)
        bpy.context.scene.collection.objects.link(cam)
        bpy.context.scene.camera = cam

    cam.location = location
    cam.data.lens = focal_length

    # Point camera at target using track-to constraint
    for c in cam.constraints:
        cam.constraints.remove(c)

    # Create empty at target for tracking
    target_empty = bpy.data.objects.get("CameraTarget")
    if not target_empty:
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=target)
        target_empty = bpy.context.active_object
        target_empty.name = "CameraTarget"
    else:
        target_empty.location = target

    constraint = cam.constraints.new(type='TRACK_TO')
    constraint.target = target_empty
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'

    return {
        "camera": cam.name,
        "location": list(location),
        "target": list(target),
        "focal_length": focal_length,
    }


def setup_lighting(
    preset: str = "outdoor_day",
    sun_strength: float = 3.0,
    ambient_strength: float = 0.5,
) -> dict:
    """Configure scene lighting.

    Args:
        preset: studio, outdoor_day, outdoor_sunset, interior, custom
        sun_strength: Sun light intensity
        ambient_strength: Ambient/world light intensity

    Returns:
        dict with lighting info
    """
    presets = {
        "studio": {
            "sun_rotation": (math.radians(60), 0, math.radians(45)),
            "sun_strength": 5.0,
            "world_color": (0.05, 0.05, 0.07),
            "world_strength": 0.3,
        },
        "outdoor_day": {
            "sun_rotation": (math.radians(50), 0, math.radians(30)),
            "sun_strength": sun_strength,
            "world_color": (0.4, 0.6, 0.9),
            "world_strength": ambient_strength,
        },
        "outdoor_sunset": {
            "sun_rotation": (math.radians(15), 0, math.radians(-60)),
            "sun_strength": 2.0,
            "world_color": (0.8, 0.4, 0.2),
            "world_strength": 0.3,
        },
        "interior": {
            "sun_rotation": (math.radians(70), 0, math.radians(20)),
            "sun_strength": 2.0,
            "world_color": (0.02, 0.02, 0.03),
            "world_strength": 0.1,
        },
    }

    config = presets.get(preset, presets["outdoor_day"])

    # Remove existing lights
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    # Create sun light
    sun_data = bpy.data.lights.new(name="Sun", type='SUN')
    sun_data.energy = config["sun_strength"]
    sun_obj = bpy.data.objects.new("Sun", sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = config["sun_rotation"]

    # Set world/ambient lighting
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = (*config["world_color"], 1.0)
        bg_node.inputs["Strength"].default_value = config["world_strength"]

    return {
        "preset": preset,
        "sun_strength": config["sun_strength"],
        "world_strength": config["world_strength"],
    }


def setup_architectural_scene(
    unit_system: str = "METRIC",
    unit_scale: float = 1.0,
    grid_scale: float = 1.0,
) -> dict:
    """Set up a clean architectural scene with proper units and settings.

    Args:
        unit_system: METRIC or IMPERIAL
        unit_scale: Scale factor (1.0 = 1 Blender unit = 1 meter)
        grid_scale: Grid display scale

    Returns:
        dict with scene info
    """
    scene = bpy.context.scene

    # Set units
    scene.unit_settings.system = unit_system
    scene.unit_settings.scale_length = unit_scale

    # Clean default scene (remove default cube, light, camera if needed)
    for obj_name in ["Cube"]:
        obj = bpy.data.objects.get(obj_name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Set render settings for architecture
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    # Set viewport settings
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.overlay.grid_scale = grid_scale
                    space.clip_end = 1000

    # Add ground plane
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"

    # Apply grey material to ground
    mat = bpy.data.materials.new(name="Ground_Material")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.4, 0.4, 0.4, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.9
    ground.data.materials.append(mat)

    # Setup default camera and lighting
    setup_camera()
    setup_lighting()

    return {
        "unit_system": unit_system,
        "unit_scale": unit_scale,
        "objects": ["Ground", "Camera", "Sun", "CameraTarget"],
    }


if __name__ == "__main__":
    import json
    import sys

    params = {}
    if len(sys.argv) > 1:
        params = json.loads(sys.argv[1])
    result = setup_architectural_scene(**params)
    print(json.dumps(result))
