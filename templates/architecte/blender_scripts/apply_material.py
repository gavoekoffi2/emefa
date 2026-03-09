"""Blender Script: Apply Material
Usage: Called by EMEFA Desktop Bridge to apply materials to objects.
Compatible with Blender 3.6+
"""

import bpy
from typing import Optional


# Predefined architectural material presets
MATERIAL_PRESETS = {
    "concrete": {
        "base_color": (0.6, 0.6, 0.6, 1.0),
        "roughness": 0.85,
        "metallic": 0.0,
    },
    "wood": {
        "base_color": (0.55, 0.35, 0.17, 1.0),
        "roughness": 0.6,
        "metallic": 0.0,
    },
    "glass": {
        "base_color": (0.8, 0.9, 0.95, 1.0),
        "roughness": 0.05,
        "metallic": 0.0,
        "transmission": 0.95,
    },
    "metal": {
        "base_color": (0.7, 0.7, 0.72, 1.0),
        "roughness": 0.3,
        "metallic": 1.0,
    },
    "stone": {
        "base_color": (0.5, 0.48, 0.45, 1.0),
        "roughness": 0.9,
        "metallic": 0.0,
    },
    "brick": {
        "base_color": (0.65, 0.3, 0.2, 1.0),
        "roughness": 0.8,
        "metallic": 0.0,
    },
}


def hex_to_rgba(hex_color: str) -> tuple:
    """Convert hex color (#RRGGBB) to RGBA tuple."""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b, 1.0)


def apply_material(
    object_name: str,
    material_type: str = "concrete",
    color: Optional[str] = None,
    roughness: float = 0.5,
    metallic: float = 0.0,
) -> dict:
    """Apply a material to a named object.

    Args:
        object_name: Name of the target object
        material_type: Preset name (concrete, wood, glass, metal, stone, brick, custom)
        color: Hex color override (#RRGGBB)
        roughness: Surface roughness (0.0 = smooth, 1.0 = rough)
        metallic: Metallic factor (0.0 = dielectric, 1.0 = metal)

    Returns:
        dict with material info
    """
    obj = bpy.data.objects.get(object_name)
    if not obj:
        return {"error": f"Object not found: {object_name}"}

    # Get preset or use custom
    preset = MATERIAL_PRESETS.get(material_type, {})

    mat_name = f"EMEFA_{material_type}_{object_name}"
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True

    # Get Principled BSDF node
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return {"error": "Could not find Principled BSDF node"}

    # Apply color
    if color:
        bsdf.inputs["Base Color"].default_value = hex_to_rgba(color)
    elif "base_color" in preset:
        bsdf.inputs["Base Color"].default_value = preset["base_color"]

    # Apply properties
    bsdf.inputs["Roughness"].default_value = preset.get("roughness", roughness)
    bsdf.inputs["Metallic"].default_value = preset.get("metallic", metallic)

    # Glass: set transmission
    if preset.get("transmission"):
        bsdf.inputs["Transmission Weight"].default_value = preset["transmission"]

    # Assign material to object
    if obj.data and hasattr(obj.data, 'materials'):
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

    return {
        "object": object_name,
        "material": mat_name,
        "type": material_type,
        "color": color or str(preset.get("base_color", "")),
    }


if __name__ == "__main__":
    import json
    import sys

    params = {}
    if len(sys.argv) > 1:
        params = json.loads(sys.argv[1])
    result = apply_material(**params)
    print(json.dumps(result))
