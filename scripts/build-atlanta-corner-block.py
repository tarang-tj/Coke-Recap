"""
Build a Five Points Atlanta 1886 commercial corner block as a single GLB.

Run from project root:
    /Applications/Blender.app/Contents/MacOS/Blender \\
        --background \\
        --python scripts/build-atlanta-corner-block.py

Output: public/assets/models/atlanta-corner-block.glb

Composition (low-poly stylized, matches existing asset aesthetic):

  - Pharmacy: 4-story Italianate brick commercial, ~8 m wide × 14 m tall.
    Storefront ground floor with display window + door + awning.
    Three upper floors with tall narrow paired windows + stone lintels.
    Heavy decorative cornice at roofline.
  - Corner building: 3-story brick at 90° to the pharmacy, ~6 m wide × 11 m tall.
    Distinct color (sandstone/tan brick) to differentiate from the pharmacy.
  - Distant building: 2-story smaller, atmospheric depth, simpler facade.
  - Wooden plank sidewalk: warm tan, raised ~15 cm above street.
  - Cobblestone street: cool gray, wider plane.
  - 2 cast-iron gas street lamps with emissive warm glass.
  - Coordinate convention: building bases at world y=0, output centered at origin.
"""

import bpy
import bmesh
import math
import os
import sys

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------

OUTPUT_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd(),
        "public", "assets", "models", "atlanta-corner-block.glb",
    )
)

# Brick palettes (linear RGB, Blender uses 0-1)
BRICK_RED = (0.42, 0.12, 0.08, 1.0)     # rich red Victorian brick
BRICK_TAN = (0.55, 0.40, 0.28, 1.0)     # sandstone tan brick
MORTAR    = (0.78, 0.74, 0.68, 1.0)     # cream mortar (lightens via mix)
STONE     = (0.78, 0.72, 0.60, 1.0)     # cream sandstone for lintels/cornices
WINDOW    = (0.10, 0.12, 0.16, 1.0)     # dark window glass
WINDOW_LIT = (1.0, 0.90, 0.62, 1.0)     # warm interior glow (emissive)
WOOD_DARK = (0.30, 0.18, 0.10, 1.0)     # dark wood for doors / window frames
WOOD_TAN  = (0.55, 0.38, 0.22, 1.0)     # warm tan sidewalk planks
COBBLE    = (0.32, 0.30, 0.28, 1.0)     # cool gray cobblestone street
IRON      = (0.10, 0.08, 0.06, 1.0)     # cast-iron gas-lamp post
AWNING    = (0.55, 0.06, 0.10, 1.0)     # burgundy striped awning


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

def clear_scene():
    """Delete everything in the scene so we start fresh."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def make_material(name, color, roughness=0.85, metallic=0.0, emission=None, emission_strength=0.0):
    """Create a Principled BSDF material with optional emission."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return mat
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        # Emission inputs renamed across Blender versions — try the common names.
        for name_em in ("Emission", "Emission Color"):
            if name_em in bsdf.inputs:
                bsdf.inputs[name_em].default_value = emission
                break
        for name_str in ("Emission Strength",):
            if name_str in bsdf.inputs:
                bsdf.inputs[name_str].default_value = emission_strength
                break
    return mat


def add_box(name, dims, location, material, rotation=(0, 0, 0)):
    """Add a unit cube, scale to dims, position, and assign material."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material is not None:
        obj.data.materials.append(material)
    return obj


def add_cylinder(name, radius, depth, location, material, vertices=12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, location=location, vertices=vertices, rotation=rotation
    )
    obj = bpy.context.active_object
    obj.name = name
    if material is not None:
        obj.data.materials.append(material)
    return obj


def add_plane(name, dims_xy, location, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (dims_xy[0], dims_xy[1], 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material is not None:
        obj.data.materials.append(material)
    return obj


# ----------------------------------------------------------------------------
# Composition
# ----------------------------------------------------------------------------

def build_pharmacy(x, z, materials):
    """
    Primary 4-story Italianate brick pharmacy building.
    Origin at base center. Building faces -Y (toward viewer at z>0 in world).
    Width=8, Depth=5, total height=14.
    """
    g = bpy.data.collections.new("pharmacy")
    bpy.context.scene.collection.children.link(g)
    layer_col = bpy.context.view_layer.layer_collection.children[g.name]
    bpy.context.view_layer.active_layer_collection = layer_col

    W, D, H = 8.0, 5.0, 14.0

    # Main brick mass
    add_box("pharmacy_main", (W, D, H), (x, z, H / 2), materials["brick_red"])

    # ---- Stone cornice at roofline ----
    # A heavier cornice band that wraps the upper edge.
    cornice_h = 0.7
    add_box(
        "pharmacy_cornice",
        (W + 0.4, D + 0.4, cornice_h),
        (x, z, H - cornice_h / 2),
        materials["stone"],
    )
    # Second decorative band below cornice
    add_box(
        "pharmacy_cornice_band",
        (W + 0.2, D + 0.2, 0.18),
        (x, z, H - cornice_h - 0.20),
        materials["stone"],
    )

    # ---- Floor divider bands (between storefront and upper floors) ----
    add_box(
        "pharmacy_floor_band_1",
        (W + 0.15, D + 0.15, 0.30),
        (x, z, 3.6),  # top of storefront
        materials["stone"],
    )

    # ---- Upper-story windows (3 floors, paired tall narrow windows) ----
    # Each floor has 4 windows along the facade (front face at -Y end).
    floor_heights = [4.5, 7.5, 10.5]
    window_w, window_h = 0.9, 1.9
    window_x_positions = [-2.7, -0.9, 0.9, 2.7]
    facade_y = z - D / 2 - 0.05  # just proud of the brick face (forward in -Y)
    for fh in floor_heights:
        for wx in window_x_positions:
            # Stone lintel above window
            add_box(
                "lintel",
                (window_w + 0.20, 0.10, 0.14),
                (x + wx, facade_y, fh + window_h / 2 + 0.10),
                materials["stone"],
            )
            # Window pane (darker, slight inset)
            add_box(
                "window",
                (window_w, 0.08, window_h),
                (x + wx, facade_y, fh),
                materials["window_lit"],
            )
            # Stone sill below window
            add_box(
                "sill",
                (window_w + 0.20, 0.14, 0.10),
                (x + wx, facade_y - 0.02, fh - window_h / 2 - 0.08),
                materials["stone"],
            )

    # ---- Ground-floor storefront ----
    storefront_h = 3.0
    storefront_y = z - D / 2 - 0.08  # forward of facade
    # Large display window (left side)
    add_box(
        "display_window_left",
        (3.2, 0.10, 2.4),
        (x - 2.0, storefront_y, 1.6),
        materials["window_lit"],
    )
    # Wooden frame around display window
    add_box(
        "display_frame_left",
        (3.4, 0.12, 0.20),
        (x - 2.0, storefront_y - 0.01, 0.30),
        materials["wood_dark"],
    )
    add_box(
        "display_frame_left_top",
        (3.4, 0.12, 0.20),
        (x - 2.0, storefront_y - 0.01, 2.90),
        materials["wood_dark"],
    )

    # Wooden door (center-right)
    add_box(
        "door",
        (1.2, 0.10, 2.6),
        (x + 0.6, storefront_y, 1.3),
        materials["wood_dark"],
    )
    # Door transom window above
    add_box(
        "transom",
        (1.2, 0.10, 0.4),
        (x + 0.6, storefront_y, 2.85),
        materials["window_lit"],
    )

    # Display window right (smaller)
    add_box(
        "display_window_right",
        (1.6, 0.10, 2.0),
        (x + 2.5, storefront_y, 1.5),
        materials["window_lit"],
    )
    add_box(
        "display_frame_right",
        (1.8, 0.12, 0.16),
        (x + 2.5, storefront_y - 0.01, 0.40),
        materials["wood_dark"],
    )

    # ---- Burgundy striped awning above storefront ----
    awning_y = z - D / 2 - 0.6
    awning_top_z = storefront_h + 0.45
    awning_front_z = storefront_h - 0.5
    # Slanted awning — approximate with a tilted box.
    awning = add_box(
        "awning",
        (W - 0.6, 0.05, 1.4),
        (x, awning_y, (awning_top_z + awning_front_z) / 2),
        materials["awning"],
    )
    # Tilt the awning forward.
    awning.rotation_euler = (math.radians(28), 0, 0)
    bpy.context.view_layer.objects.active = awning
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)


def build_corner_building(x, z, materials):
    """3-story sandstone-tan brick corner building, rotated 90°."""
    W, D, H = 6.0, 5.0, 11.0

    g = bpy.data.collections.new("corner_bldg")
    bpy.context.scene.collection.children.link(g)
    layer_col = bpy.context.view_layer.layer_collection.children[g.name]
    bpy.context.view_layer.active_layer_collection = layer_col

    # Main mass — rotated so the long face is on +X side
    add_box(
        "corner_main",
        (D, W, H),
        (x, z, H / 2),
        materials["brick_tan"],
        rotation=(0, 0, math.radians(0)),
    )

    # Cornice
    add_box(
        "corner_cornice",
        (D + 0.3, W + 0.3, 0.55),
        (x, z, H - 0.55 / 2),
        materials["stone"],
    )

    # Side-facing windows (facing -X toward camera+ pharmacy corner)
    facade_x = x - D / 2 - 0.05
    floor_zs = [4.0, 7.0]
    window_y_positions = [-1.8, -0.6, 0.6, 1.8]
    window_w, window_h = 0.7, 1.6
    for fz in floor_zs:
        for wy in window_y_positions:
            add_box(
                "corner_window",
                (0.08, window_w, window_h),
                (facade_x, z + wy, fz),
                materials["window_lit"],
            )
            add_box(
                "corner_lintel",
                (0.10, window_w + 0.18, 0.12),
                (facade_x, z + wy, fz + window_h / 2 + 0.09),
                materials["stone"],
            )

    # Simple storefront on the corner-facing side
    add_box(
        "corner_storefront",
        (0.10, W * 0.7, 2.4),
        (facade_x, z, 1.4),
        materials["window_lit"],
    )


def build_distant_building(x, z, materials):
    """2-story atmospheric-perspective filler down the street."""
    W, D, H = 5.0, 4.0, 8.0
    add_box("distant_main", (W, D, H), (x, z, H / 2), materials["brick_red"])
    add_box(
        "distant_cornice",
        (W + 0.2, D + 0.2, 0.4),
        (x, z, H - 0.2),
        materials["stone"],
    )
    # Few windows
    facade_y = z - D / 2 - 0.05
    for fh in (3.0, 5.5):
        for wx in (-1.5, 0.0, 1.5):
            add_box(
                "distant_window",
                (0.6, 0.08, 1.2),
                (x + wx, facade_y, fh),
                materials["window_lit"],
            )


def build_gas_lamp(x, y, materials):
    """Cast-iron gas street lamp with emissive warm glass globe."""
    # Post
    add_cylinder("lamp_post", 0.10, 4.5, (x, y, 2.25), materials["iron"])
    # Decorative cap on post (small disc)
    add_cylinder("lamp_cap", 0.18, 0.10, (x, y, 4.55), materials["iron"])
    # Glass globe
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.32, location=(x, y, 4.95), segments=14, ring_count=8
    )
    obj = bpy.context.active_object
    obj.name = "lamp_globe"
    obj.data.materials.append(materials["lamp_glass"])
    # Decorative finial on top
    add_cylinder("lamp_finial", 0.06, 0.20, (x, y, 5.35), materials["iron"])


def build_street_and_sidewalk(materials):
    """
    Cobblestone street + wooden plank sidewalk IN FRONT of the buildings.
    Blender -Y direction is "forward" (toward camera in GLTF after yup
    conversion), so the street and sidewalk live at more-negative Y values
    than the pharmacy facade at Y=-3.55.
    """
    # Sidewalk — narrow strip between buildings and street, on the sidewalk side
    # of the facade. Y=-5 puts it ~1.5 units in front of the facade.
    add_box(
        "sidewalk",
        (28.0, 2.6, 0.20),
        (-2.0, -5.0, 0.10),
        materials["wood_tan"],
    )
    # Street (large flat plane) — further forward, between sidewalk and the
    # viewer. Y=-11 with width 14 puts it spanning Y from -18 to -4 (just
    # past the sidewalk's front edge at Y=-6.3).
    add_plane(
        "street",
        (40.0, 14.0),
        (0.0, -11.0, 0.0),
        materials["cobble"],
    )


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def subdivide_mesh(obj, cuts=2):
    """Subdivide a mesh so vertex-color AO has enough resolution to show."""
    if obj.type != "MESH":
        return
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.subdivide(number_cuts=cuts)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake_ao_to_vertex_colors():
    """
    Cycles-bake ambient occlusion into per-vertex colors on every mesh.

    Workflow (Bruno-style baked-shading minus UV unwrapping):
      1. Subdivide each mesh so vertex colors have enough resolution.
      2. Add a 'Col' vertex color attribute to each mesh.
      3. Add an Attribute node to each material that reads 'Col' and multiplies
         it into the Principled BSDF Base Color.
      4. Configure Cycles to bake AO targeting the active color attribute.
      5. Bake.

    The exported GLB will carry baked AO in vertex colors which Three.js
    multiplies into the base color at render time — giving 'pre-lit' surfaces
    that look dimensional even under simple runtime lighting.
    """
    print("\n[atlanta-block] subdividing meshes for vertex-color resolution…")
    mesh_objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for obj in mesh_objects:
        subdivide_mesh(obj, cuts=2)

    print("[atlanta-block] adding vertex color attribute + Attribute node to materials…")
    for obj in mesh_objects:
        mesh = obj.data
        # Ensure a vertex color attribute named "Col" exists (CORNER domain so
        # each vertex of each face gets its own color — lets AO darken the
        # face corners while the centers stay light).
        if "Col" not in mesh.color_attributes:
            mesh.color_attributes.new(name="Col", type="BYTE_COLOR", domain="CORNER")

        # Wire each material so the vertex color attribute modulates Base Color
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None or not mat.use_nodes:
                continue
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links
            bsdf = nodes.get("Principled BSDF")
            if bsdf is None:
                continue
            # Capture the original base color before we rewire
            orig = bsdf.inputs["Base Color"].default_value
            # Add an Attribute node reading "Col"
            attr = nodes.new(type="ShaderNodeAttribute")
            attr.attribute_name = "Col"
            attr.location = (-400, 100)
            # Add an RGB constant node holding the original color
            base = nodes.new(type="ShaderNodeRGB")
            base.outputs[0].default_value = orig
            base.location = (-400, -100)
            # Mix them via Multiply — vertex color (AO) multiplies base color
            mix = nodes.new(type="ShaderNodeMixRGB")
            mix.blend_type = "MULTIPLY"
            mix.inputs["Fac"].default_value = 1.0
            mix.location = (-150, 0)
            links.new(base.outputs[0], mix.inputs["Color1"])
            links.new(attr.outputs["Color"], mix.inputs["Color2"])
            links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])

    print("[atlanta-block] configuring Cycles AO bake…")
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16  # AO is cheap; 16 is plenty for vertex bake
    scene.cycles.use_denoising = True
    scene.render.bake.target = "VERTEX_COLORS"

    # Add a sun light so the bake has dramatic directional shadows
    bpy.ops.object.light_add(type="SUN", location=(10, -10, 15))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.data.color = (1.0, 0.92, 0.72)  # warm golden-hour amber
    sun.rotation_euler = (math.radians(35), math.radians(-25), math.radians(40))

    print("[atlanta-block] baking AO to vertex colors per object…")
    for obj in mesh_objects:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.bake(type="AO")
            print(f"  ✓ baked AO on {obj.name}")
        except Exception as e:
            print(f"  ✗ skipped {obj.name}: {e}")

    print("[atlanta-block] AO bake complete\n")


def main():
    clear_scene()

    materials = {
        "brick_red":   make_material("brick_red", BRICK_RED, roughness=0.92),
        "brick_tan":   make_material("brick_tan", BRICK_TAN, roughness=0.88),
        "stone":       make_material("stone", STONE, roughness=0.75),
        "wood_dark":   make_material("wood_dark", WOOD_DARK, roughness=0.85),
        "wood_tan":    make_material("wood_tan", WOOD_TAN, roughness=0.90),
        "window_lit":  make_material(
            "window_lit", WINDOW, roughness=0.18,
            emission=WINDOW_LIT, emission_strength=1.8,
        ),
        "cobble":      make_material("cobble", COBBLE, roughness=0.95),
        "iron":        make_material("iron", IRON, roughness=0.55, metallic=0.7),
        "awning":      make_material("awning", AWNING, roughness=0.80),
        "lamp_glass":  make_material(
            "lamp_glass", (0.95, 0.85, 0.55, 1.0), roughness=0.05,
            emission=(1.0, 0.88, 0.58, 1.0), emission_strength=4.5,
        ),
    }

    # Layout positions (origin = pharmacy storefront viewing target)
    # The pharmacy is the hero — front and slightly left.
    # The corner building is to the right at 90 deg.
    # The distant building is far left.
    build_pharmacy(x=0.0, z=-1.0, materials=materials)
    build_corner_building(x=7.0, z=-1.0, materials=materials)
    build_distant_building(x=-9.0, z=-1.5, materials=materials)
    build_street_and_sidewalk(materials)
    # Gas lamps on the sidewalk in front of the buildings (Y=-5 sidewalk)
    build_gas_lamp(-3.5, -5.2, materials)
    build_gas_lamp(3.5, -5.2, materials)

    # NOTE: bake_ao_to_vertex_colors() is defined above but disabled — the
    # per-object bake loop runs ~150 bakes on this scene and OOMs the OS.
    # Use runtime SSAO postprocessing instead until we collapse all geometry
    # into a single joined mesh + smart-UV-project + single bake. Future work.
    # bake_ao_to_vertex_colors()

    # Ensure output dir exists
    out_dir = os.path.dirname(OUTPUT_PATH)
    os.makedirs(out_dir, exist_ok=True)

    # Select all and export
    bpy.ops.object.select_all(action="SELECT")
    print(f"\n[atlanta-block] Objects in scene: {len(bpy.context.scene.objects)}")
    print(f"[atlanta-block] Exporting to: {OUTPUT_PATH}\n")

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_PATH,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n[atlanta-block] DONE — {size_mb:.2f} MB at {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
