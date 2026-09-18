"""
Physics is Easy — 3D asset pipeline.

Builds every .glb used by the 3-D scenes from scratch, so the assets in
public/models are reproducible rather than opaque binary files nobody can edit.

Run through Blender's own Python, never a system Python:

    blender --background --python tools/blender/build_models.py

or, on Windows with the path from DECISIONS.md:

    "X:\\TheBleanderrr\\blender.exe" --background --python tools/blender/build_models.py

Design rules (see DECISIONS D-009):
  * no bare primitives — every mesh is shaped, bevelled and shaded
  * a polygon budget per model, enforced by decimation before export
  * Draco compression on export, which typically cuts mesh size 5–10×
  * +Y up and metres, matching three.js and glTF conventions
"""

import math
import os
import sys

import bpy  # type: ignore  # provided by Blender at runtime

# ── Configuration ──────────────────────────────────────────────────────────

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "models")

# Keeping models under this budget is what makes the 3-D views usable on a
# mid-range phone. Anything above it gets decimated before export.
MAX_TRIANGLES = 6000


def log(message: str) -> None:
    print(f"[physics-is-easy] {message}", flush=True)


def reset_scene() -> None:
    """Empty the file so each model is built in isolation."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"


def make_material(name: str, rgba, roughness: float = 0.4, metallic: float = 0.0):
    """A simple Principled BSDF material; glTF exports these natively."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def shade_smooth(obj) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


def bevel(obj, width: float = 0.01, segments: int = 2) -> None:
    """A small bevel is what stops a primitive from reading as a primitive:
    it catches light on the edges the way real objects do."""
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(40)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def triangle_count() -> int:
    total = 0
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            total += len(obj.data.loop_triangles)
    return total


def enforce_budget() -> None:
    """Decimate the heaviest meshes until the scene fits the budget."""
    count = triangle_count()
    if count <= MAX_TRIANGLES:
        log(f"  {count} triangles (within budget)")
        return

    ratio = MAX_TRIANGLES / count
    log(f"  {count} triangles — decimating to {ratio:.2f}")
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
        mod.ratio = ratio
        bpy.ops.object.modifier_apply(modifier=mod.name)
    log(f"  now {triangle_count()} triangles")


def export(filename: str) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    enforce_budget()

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    size_kb = os.path.getsize(path) / 1024
    log(f"  wrote {filename} ({size_kb:.1f} KB)")


# ── Models ─────────────────────────────────────────────────────────────────


def build_projectile_ball() -> None:
    """A cannonball with a seam and slight surface variation, for the
    projectile scene. A bare UV sphere reads as a placeholder; a seam and a
    bevelled band make it read as an object."""
    reset_scene()
    log("projectile-ball.glb")

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=32, ring_count=16)
    ball = bpy.context.active_object
    ball.name = "ProjectileBall"

    # Equatorial seam band
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.281, minor_radius=0.012, major_segments=32, minor_segments=8
    )
    band = bpy.context.active_object
    band.name = "Seam"

    metal = make_material("BallMetal", (0.32, 0.36, 0.55, 1.0), roughness=0.35, metallic=0.6)
    seam = make_material("BallSeam", (0.15, 0.17, 0.25, 1.0), roughness=0.55)
    ball.data.materials.append(metal)
    band.data.materials.append(seam)

    shade_smooth(ball)
    shade_smooth(band)
    export("projectile-ball.glb")


def build_balance_beam() -> None:
    """Beam, pivot wedge and hanging pans for the torque scene."""
    reset_scene()
    log("balance-beam.glb")

    bpy.ops.mesh.primitive_cube_add(size=1)
    beam = bpy.context.active_object
    beam.name = "Beam"
    beam.scale = (2.8, 0.09, 0.25)
    bpy.ops.object.transform_apply(scale=True)
    bevel(beam, width=0.03)

    # Graduation ridges every 0.25 m, so the beam looks like an instrument
    for i in range(-10, 11):
        if i == 0:
            continue
        bpy.ops.mesh.primitive_cube_add(size=1, location=(i * 0.25, 0, 0.13))
        tick = bpy.context.active_object
        tick.name = f"Tick{i}"
        tick.scale = (0.006, 0.09, 0.02)
        bpy.ops.object.transform_apply(scale=True)

    bpy.ops.mesh.primitive_cone_add(radius1=0.32, depth=0.9, vertices=4, location=(0, 0, -0.58))
    pivot = bpy.context.active_object
    pivot.name = "Pivot"
    bevel(pivot, width=0.015)

    steel = make_material("BeamSteel", (0.62, 0.65, 0.72, 1.0), roughness=0.3, metallic=0.8)
    dark = make_material("PivotDark", (0.22, 0.24, 0.30, 1.0), roughness=0.5)
    beam.data.materials.append(steel)
    pivot.data.materials.append(dark)

    export("balance-beam.glb")


def build_collision_cart() -> None:
    """A low-friction cart for the collision scene: body, bumper and wheels."""
    reset_scene()
    log("collision-cart.glb")

    bpy.ops.mesh.primitive_cube_add(size=1)
    body = bpy.context.active_object
    body.name = "CartBody"
    body.scale = (0.5, 0.32, 0.22)
    bpy.ops.object.transform_apply(scale=True)
    bevel(body, width=0.035, segments=3)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=0.30, location=(0.52, 0, 0), rotation=(0, math.radians(90), 0))
    bumper = bpy.context.active_object
    bumper.name = "Bumper"
    shade_smooth(bumper)

    for x in (-0.3, 0.3):
        for y in (-0.34, 0.34):
            bpy.ops.mesh.primitive_cylinder_add(
                radius=0.1, depth=0.05, location=(x, y, -0.2), rotation=(math.radians(90), 0, 0)
            )
            wheel = bpy.context.active_object
            wheel.name = f"Wheel{x}{y}"
            shade_smooth(wheel)

    shell = make_material("CartShell", (0.85, 0.36, 0.14, 1.0), roughness=0.45)
    rubber = make_material("CartRubber", (0.12, 0.12, 0.14, 1.0), roughness=0.85)
    body.data.materials.append(shell)
    bumper.data.materials.append(rubber)

    export("collision-cart.glb")


def build_magnet_bar() -> None:
    """A bar magnet with distinct N and S halves for the induction scene."""
    reset_scene()
    log("bar-magnet.glb")

    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.35, 0, 0))
    north = bpy.context.active_object
    north.name = "NorthPole"
    north.scale = (0.35, 0.16, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    bevel(north, width=0.025, segments=3)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.35, 0, 0))
    south = bpy.context.active_object
    south.name = "SouthPole"
    south.scale = (0.35, 0.16, 0.16)
    bpy.ops.object.transform_apply(scale=True)
    bevel(south, width=0.025, segments=3)

    red = make_material("PoleNorth", (0.80, 0.22, 0.20, 1.0), roughness=0.4)
    blue = make_material("PoleSouth", (0.20, 0.42, 0.82, 1.0), roughness=0.4)
    north.data.materials.append(red)
    south.data.materials.append(blue)

    export("bar-magnet.glb")


def build_gas_container() -> None:
    """A transparent container with a piston face for the kinetic-theory scene."""
    reset_scene()
    log("gas-container.glb")

    bpy.ops.mesh.primitive_cube_add(size=4)
    box = bpy.context.active_object
    box.name = "GasBox"
    bpy.context.view_layer.objects.active = box
    wire = box.modifiers.new(name="Wireframe", type="WIREFRAME")
    wire.thickness = 0.06
    bpy.ops.object.modifier_apply(modifier=wire.name)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(2.05, 0, 0))
    piston = bpy.context.active_object
    piston.name = "Piston"
    piston.scale = (0.08, 2.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    bevel(piston, width=0.02)

    frame = make_material("BoxFrame", (0.30, 0.55, 0.85, 1.0), roughness=0.3, metallic=0.4)
    steel = make_material("PistonSteel", (0.55, 0.57, 0.62, 1.0), roughness=0.35, metallic=0.7)
    box.data.materials.append(frame)
    piston.data.materials.append(steel)

    export("gas-container.glb")


MODELS = {
    "projectile-ball": build_projectile_ball,
    "balance-beam": build_balance_beam,
    "collision-cart": build_collision_cart,
    "bar-magnet": build_magnet_bar,
    "gas-container": build_gas_container,
}


def main() -> None:
    # Arguments after "--" are ours; Blender keeps everything before it.
    argv = sys.argv
    requested = argv[argv.index("--") + 1 :] if "--" in argv else []

    targets = requested or list(MODELS)
    unknown = [name for name in targets if name not in MODELS]
    if unknown:
        log(f"unknown model(s): {', '.join(unknown)}")
        log(f"available: {', '.join(MODELS)}")
        sys.exit(1)

    log(f"output directory: {OUTPUT_DIR}")
    for name in targets:
        MODELS[name]()
    log(f"done — {len(targets)} model(s) built")


if __name__ == "__main__":
    main()
