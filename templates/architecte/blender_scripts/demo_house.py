"""Blender Script: Demo House Generator
Usage: Complete demo script that creates a simple architectural house.
This is the script used in the EMEFA demo scenario.
Compatible with Blender 3.6+
"""

import bpy
import math
import os


def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_material(name: str, color: tuple, roughness: float = 0.5, metallic: float = 0.0) -> bpy.types.Material:
    """Create a material with given properties."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def create_demo_house(
    width: float = 10.0,
    depth: float = 8.0,
    wall_height: float = 3.0,
    roof_angle: float = 30.0,
    style: str = "moderne",
) -> dict:
    """Create a simple demo house with walls, roof, windows, and door.

    Args:
        width: House width in meters
        depth: House depth in meters
        wall_height: Wall height in meters
        roof_angle: Roof angle in degrees
        style: moderne, classique, minimaliste

    Returns:
        dict with created objects info
    """
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    created_objects = []

    # Materials
    if style == "moderne":
        wall_mat = create_material("Walls", (0.9, 0.9, 0.9, 1.0), roughness=0.4)
        roof_mat = create_material("Roof", (0.15, 0.15, 0.15, 1.0), roughness=0.3, metallic=0.8)
        ground_mat = create_material("Ground", (0.3, 0.5, 0.2, 1.0), roughness=0.9)
        window_mat = create_material("Windows", (0.6, 0.8, 0.95, 1.0), roughness=0.05)
        door_mat = create_material("Door", (0.3, 0.2, 0.1, 1.0), roughness=0.6)
    elif style == "classique":
        wall_mat = create_material("Walls", (0.85, 0.8, 0.7, 1.0), roughness=0.7)
        roof_mat = create_material("Roof", (0.6, 0.25, 0.15, 1.0), roughness=0.8)
        ground_mat = create_material("Ground", (0.3, 0.5, 0.2, 1.0), roughness=0.9)
        window_mat = create_material("Windows", (0.6, 0.8, 0.95, 1.0), roughness=0.05)
        door_mat = create_material("Door", (0.4, 0.25, 0.1, 1.0), roughness=0.6)
    else:  # minimaliste
        wall_mat = create_material("Walls", (0.95, 0.95, 0.95, 1.0), roughness=0.2)
        roof_mat = create_material("Roof", (0.95, 0.95, 0.95, 1.0), roughness=0.2)
        ground_mat = create_material("Ground", (0.5, 0.5, 0.5, 1.0), roughness=0.4)
        window_mat = create_material("Windows", (0.5, 0.7, 0.9, 1.0), roughness=0.02)
        door_mat = create_material("Door", (0.2, 0.2, 0.2, 1.0), roughness=0.3)

    # Ground plane
    bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    ground.data.materials.append(ground_mat)
    created_objects.append("Ground")

    # Main walls (box)
    wall_thickness = 0.25
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, wall_height / 2))
    walls = bpy.context.active_object
    walls.name = "Walls"
    walls.dimensions = (width, depth, wall_height)
    walls.data.materials.append(wall_mat)
    created_objects.append("Walls")

    # Roof
    roof_height = (width / 2) * math.tan(math.radians(roof_angle))
    bpy.ops.mesh.primitive_cone_add(
        vertices=4,
        radius1=max(width, depth) * 0.75,
        depth=roof_height,
        location=(0, 0, wall_height + roof_height / 2),
    )
    roof = bpy.context.active_object
    roof.name = "Roof"
    roof.rotation_euler.z = math.radians(45)
    roof.scale.x = width / (max(width, depth) * 0.75 * 1.4)
    roof.scale.y = depth / (max(width, depth) * 0.75 * 1.4)
    roof.data.materials.append(roof_mat)
    created_objects.append("Roof")

    # Front door
    door_width = 1.0
    door_height = 2.2
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, -depth / 2 + 0.01, door_height / 2),
    )
    door = bpy.context.active_object
    door.name = "Door"
    door.dimensions = (door_width, 0.1, door_height)
    door.data.materials.append(door_mat)
    created_objects.append("Door")

    # Front windows (2)
    window_width = 1.5
    window_height = 1.2
    window_sill = 1.0
    for i, x_offset in enumerate([-width / 4, width / 4]):
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(x_offset, -depth / 2 + 0.01, window_sill + window_height / 2),
        )
        win = bpy.context.active_object
        win.name = f"Window_Front_{i + 1}"
        win.dimensions = (window_width, 0.08, window_height)
        win.data.materials.append(window_mat)
        created_objects.append(win.name)

    # Side windows
    for i, y_offset in enumerate([-depth / 4, depth / 4]):
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(width / 2 - 0.01, y_offset, window_sill + window_height / 2),
        )
        win = bpy.context.active_object
        win.name = f"Window_Right_{i + 1}"
        win.dimensions = (0.08, window_width, window_height)
        win.data.materials.append(window_mat)
        created_objects.append(win.name)

    # Camera
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 35
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = (15, -12, 8)
    scene.camera = cam

    # Point camera at house
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, wall_height / 2))
    target = bpy.context.active_object
    target.name = "CameraTarget"

    constraint = cam.constraints.new(type='TRACK_TO')
    constraint.target = target
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    created_objects.extend(["Camera", "CameraTarget"])

    # Sun light
    sun_data = bpy.data.lights.new("Sun", type='SUN')
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("Sun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    created_objects.append("Sun")

    # World
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.4, 0.6, 0.9, 1.0)
    bg.inputs["Strength"].default_value = 0.5

    # Render settings
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.engine = 'BLENDER_EEVEE_NEXT'

    return {
        "objects": created_objects,
        "dimensions": {"width": width, "depth": depth, "wall_height": wall_height},
        "style": style,
        "roof_angle": roof_angle,
        "total_objects": len(created_objects),
    }


def render_and_export(
    output_dir: str = None,
    project_name: str = "demo_house",
) -> dict:
    """Render the scene and export in all formats.

    Args:
        output_dir: Directory for output files
        project_name: Base name for output files

    Returns:
        dict with output file paths
    """
    if not output_dir:
        output_dir = os.path.expanduser("~/EMEFA_exports")
    os.makedirs(output_dir, exist_ok=True)

    outputs = {}

    # Render PNG
    render_path = os.path.join(output_dir, f"{project_name}_render.png")
    bpy.context.scene.render.filepath = render_path
    bpy.ops.render.render(write_still=True)
    outputs["render_png"] = render_path

    # Export .blend
    blend_path = os.path.join(output_dir, f"{project_name}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, copy=True)
    outputs["blend"] = blend_path

    # Export .glb
    glb_path = os.path.join(output_dir, f"{project_name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_apply=True,
    )
    outputs["glb"] = glb_path

    return outputs


# Entry point
if __name__ == "__main__":
    import json
    import sys

    params = {}
    if len(sys.argv) > 1:
        params = json.loads(sys.argv[1])

    # Create the demo house
    house_result = create_demo_house(
        width=params.get("width", 10.0),
        depth=params.get("depth", 8.0),
        wall_height=params.get("wall_height", 3.0),
        roof_angle=params.get("roof_angle", 30.0),
        style=params.get("style", "moderne"),
    )

    # Optionally render and export
    if params.get("render", False):
        export_result = render_and_export(
            output_dir=params.get("output_dir"),
            project_name=params.get("project_name", "demo_house"),
        )
        house_result["outputs"] = export_result

    print(json.dumps(house_result))
