"""Blender Script: Create 3D Object
Usage: Called by EMEFA Desktop Bridge to create objects in Blender.
Compatible with Blender 3.6+
"""

import bpy
import math
from typing import Optional


def create_object(
    object_type: str = "cube",
    name: str = "Object",
    location: tuple = (0, 0, 0),
    scale: tuple = (1, 1, 1),
    rotation: tuple = (0, 0, 0),
    dimensions: Optional[tuple] = None,
) -> dict:
    """Create a 3D object in the current Blender scene.

    Args:
        object_type: cube, sphere, cylinder, plane, cone, torus, empty
        name: Name of the new object
        location: (x, y, z) position in meters
        scale: (x, y, z) scale factors
        rotation: (x, y, z) rotation in degrees
        dimensions: (width, depth, height) in meters (overrides scale)

    Returns:
        dict with object name and properties
    """
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Create object based on type
    creators = {
        "cube": lambda: bpy.ops.mesh.primitive_cube_add(size=1, location=location),
        "sphere": lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=location),
        "cylinder": lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1, location=location),
        "plane": lambda: bpy.ops.mesh.primitive_plane_add(size=1, location=location),
        "cone": lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.5, depth=1, location=location),
        "torus": lambda: bpy.ops.mesh.primitive_torus_add(location=location),
        "empty": lambda: bpy.ops.object.empty_add(type='PLAIN_AXES', location=location),
    }

    creator = creators.get(object_type)
    if not creator:
        return {"error": f"Unknown object type: {object_type}"}

    creator()
    obj = bpy.context.active_object
    obj.name = name

    # Apply rotation (convert degrees to radians)
    obj.rotation_euler = (
        math.radians(rotation[0]),
        math.radians(rotation[1]),
        math.radians(rotation[2]),
    )

    # Apply dimensions or scale
    if dimensions and object_type != "empty":
        obj.dimensions = dimensions
    else:
        obj.scale = scale

    return {
        "name": obj.name,
        "type": object_type,
        "location": list(obj.location),
        "dimensions": list(obj.dimensions),
        "rotation_degrees": list(rotation),
    }


# Entry point when called as script
if __name__ == "__main__":
    import json
    import sys

    # Read parameters from environment or stdin
    params = {}
    if len(sys.argv) > 1:
        params = json.loads(sys.argv[1])

    result = create_object(**params)
    print(json.dumps(result))
