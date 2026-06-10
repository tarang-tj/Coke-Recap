"""Coke-Recap diorama design level-up — brick detailing & material richness.

PASTE-AND-RUN in Blender's Scripting tab (Blender 4.2+ / 5.x), or headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/level-up-diorama-design.py

What it does (everything survives glTF export — no live procedural shaders):
  1. Imports the source diorama GLB (SRC below).
  2. Bakes small tileable detail textures ONCE on a throwaway plane (Cycles
     EMIT/NORMAL bakes, seconds total — never the per-object bake that OOMs):
       - 4 brick albedos (one per Brick/Brick2/Brick3/Brick4, each derived from
         that material's existing colour so the author's palette survives)
         + 1 shared brick normal map (mortar grooves)
       - stone coursing albedo+normal (subtle, keeps the cream facades cream)
       - cobblestone albedo+normal, big sidewalk pavers, wood planks, mottled
         dirt, striped canvas for the non-Coke awnings
  3. Writes world-scale box-projected UVs onto just those meshes (bricks are
     real-world ~20x8 cm). Meshes carrying ANY image texture — the 7 Coca-Cola
     logo decals — are never touched, so their UVs/materials stay pristine.
  4. Rewires the SAME material datablocks (names preserved — the React app keys
     runtime fixes off Car_ad_m/Btn_logo_m/... /CarBody) to the baked tiles.
  5. PBR polish: Glass gets low roughness (real reflections from the app's env
     map), Chrome/Brass/Metal go properly metallic, Marble tightens.
  6. Exports OUT as GLB. Animations (Smoke_*, WagonRig/CarRig, wheels) ride
     through untouched; textures embed as PNG (the app's whitenLetters() needs
     readable PNGs — never KTX2-compress this file).

After export, the proven web pipeline for this repo (resize FIRST, meshopt LAST):
  npx @gltf-transform/cli resize <OUT> /tmp/d1.glb --width 2048 --height 1152
  npx @gltf-transform/cli meshopt /tmp/d1.glb public/assets/models/coca-cola-diorama.glb
"""

import bpy
import os
from math import radians
from mathutils import Vector

# ----------------------------------------------------------------- CONFIG ---
SRC = "/Users/tarangjammalamadaka/Desktop/Coca-Cola.glb"
OUT = "/Users/tarangjammalamadaka/Desktop/Coca-Cola-detailed.glb"
TILE_DIR = "/tmp/coke-recap-tiles"        # baked PNGs also saved here
RENDER_PREVIEWS = True                     # before/after PNGs in /tmp
TEX = 512                                  # tile resolution (px)

# Per-pattern physical tile size in metres (UV repeats every TILE metres).
SCALE_M = {"brick": 1.0, "stone": 1.8, "cobble": 1.4, "plank": 1.2,
           "pavers": 2.4, "dirt": 3.0, "stripe": 0.9}

# material name -> (pattern, roughness). Colours are read from the materials.
RETEXTURE = {
    "Brick":  ("brick", 0.90), "Brick2": ("brick", 0.90),
    "Brick3": ("brick", 0.90), "Brick4": ("brick", 0.90),
    "Stone":  ("stone", 0.85),
    "Cobble": ("cobble", 0.95), "Sidewalk": ("pavers", 0.92),
    "Dirt":   ("dirt", 1.00),  "Wood": ("plank", 0.65),
    "Awning2": ("stripe", 0.80),
}
# PBR-factor-only upgrades: name -> (metallic, roughness)
PBR_TWEAKS = {"Glass": (0.0, 0.08), "Chrome": (1.0, 0.12),
              "Brass": (1.0, 0.30), "Metal": (0.9, 0.35), "Marble": (0.0, 0.22)}

# ------------------------------------------------------------- SMALL UTILS --
def srgb_ramp(nt, fac_out, stops):
    """ColorRamp doubling as a colour mixer; stops = [(pos,(r,g,b,a)), ...]."""
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = stops[0][0]
    ramp.color_ramp.elements[0].color = stops[0][1]
    ramp.color_ramp.elements[1].position = stops[-1][0]
    ramp.color_ramp.elements[1].color = stops[-1][1]
    for pos, col in stops[1:-1]:
        e = ramp.color_ramp.elements.new(pos); e.color = col
    nt.links.new(fac_out, ramp.inputs["Fac"])
    return ramp

def vmul(nt, a_out, b_out):
    n = nt.nodes.new("ShaderNodeVectorMath"); n.operation = "MULTIPLY"
    nt.links.new(a_out, n.inputs[0]); nt.links.new(b_out, n.inputs[1])
    return n.outputs["Vector"]

def base_color_of(mat, fallback=(0.6, 0.4, 0.3, 1)):
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                return tuple(n.inputs["Base Color"].default_value)
    return fallback

def shade(rgb, f):  # value-scale a colour, keep alpha 1
    return (min(rgb[0] * f, 1), min(rgb[1] * f, 1), min(rgb[2] * f, 1), 1)

# --------------------------------------------------- PATTERN NODE BUILDERS --
# Each builder wires nodes in `nt` and returns (color_socket, height_socket).
def brick_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Color1"].default_value = shade(base, 1.00)
    br.inputs["Color2"].default_value = shade(base, 0.72)   # per-brick variety
    br.inputs["Mortar"].default_value = (0.82, 0.78, 0.70, 1)  # warm cream
    br.inputs["Mortar Size"].default_value = 0.006
    br.inputs["Mortar Smooth"].default_value = 0.6
    br.inputs["Bias"].default_value = 0.0
    # ~6 bricks x 12 courses per metre tile -> real-world ~17x8 cm bricks
    br.inputs["Brick Width"].default_value = 0.167
    br.inputs["Row Height"].default_value = 0.083
    nt.links.new(uv.outputs["UV"], br.inputs["Vector"])
    # large soft weathering: multiply slow noise over the brick colour
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 2.0
    nt.links.new(uv.outputs["UV"], nz.inputs["Vector"])
    wear = srgb_ramp(nt, nz.outputs["Fac"],
                     [(0.0, (0.86, 0.84, 0.82, 1)), (1.0, (1, 1, 1, 1))])
    col = vmul(nt, br.outputs["Color"], wear.outputs["Color"])
    # height: bricks high (1), mortar recessed (0)
    h = srgb_ramp(nt, br.outputs["Fac"], [(0.0, (1, 1, 1, 1)), (1.0, (0, 0, 0, 1))])
    return col, h.outputs["Color"]

def stone_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    br = nt.nodes.new("ShaderNodeTexBrick")     # big ashlar blocks
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Color1"].default_value = shade(base, 1.00)
    br.inputs["Color2"].default_value = shade(base, 0.94)   # whisper variation
    br.inputs["Mortar"].default_value = shade(base, 0.80)
    br.inputs["Mortar Size"].default_value = 0.004
    br.inputs["Mortar Smooth"].default_value = 0.8
    br.inputs["Brick Width"].default_value = 0.55
    br.inputs["Row Height"].default_value = 0.22
    nt.links.new(uv.outputs["UV"], br.inputs["Vector"])
    h = srgb_ramp(nt, br.outputs["Fac"], [(0.0, (1, 1, 1, 1)), (1.0, (0.25, 0.25, 0.25, 1))])
    return br.outputs["Color"], h.outputs["Color"]

def cobble_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    vo = nt.nodes.new("ShaderNodeTexVoronoi")
    vo.feature = "DISTANCE_TO_EDGE"
    vo.inputs["Scale"].default_value = 9.0
    nt.links.new(uv.outputs["UV"], vo.inputs["Vector"])
    gaps = srgb_ramp(nt, vo.outputs["Distance"],
                     [(0.00, shade(base, 0.45)), (0.06, shade(base, 0.80)),
                      (0.18, shade(base, 1.05))])
    nz = nt.nodes.new("ShaderNodeTexNoise")              # per-stone tint jitter
    nz.inputs["Scale"].default_value = 14.0
    nt.links.new(uv.outputs["UV"], nz.inputs["Vector"])
    jit = srgb_ramp(nt, nz.outputs["Fac"],
                    [(0.0, (0.85, 0.85, 0.88, 1)), (1.0, (1.05, 1.0, 0.95, 1))])
    col = vmul(nt, gaps.outputs["Color"], jit.outputs["Color"])
    h = srgb_ramp(nt, vo.outputs["Distance"],
                  [(0.0, (0, 0, 0, 1)), (0.15, (1, 1, 1, 1))])
    return col, h.outputs["Color"]

def pavers_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    br = nt.nodes.new("ShaderNodeTexBrick")     # long rectangular flagstones
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Color1"].default_value = shade(base, 1.0)
    br.inputs["Color2"].default_value = shade(base, 0.92)
    br.inputs["Mortar"].default_value = shade(base, 0.70)
    br.inputs["Mortar Size"].default_value = 0.005
    br.inputs["Brick Width"].default_value = 0.5
    br.inputs["Row Height"].default_value = 0.25
    nt.links.new(uv.outputs["UV"], br.inputs["Vector"])
    h = srgb_ramp(nt, br.outputs["Fac"], [(0.0, (1, 1, 1, 1)), (1.0, (0.2, 0.2, 0.2, 1))])
    return br.outputs["Color"], h.outputs["Color"]

def plank_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")              # planks run horizontal
    mp.inputs["Rotation"].default_value = (0, 0, radians(90))
    nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Color1"].default_value = shade(base, 1.05)
    br.inputs["Color2"].default_value = shade(base, 0.78)
    br.inputs["Mortar"].default_value = shade(base, 0.45)  # board gaps
    br.inputs["Mortar Size"].default_value = 0.004
    br.inputs["Brick Width"].default_value = 1.0           # long boards
    br.inputs["Row Height"].default_value = 0.12
    br.offset = 0.5
    nt.links.new(mp.outputs["Vector"], br.inputs["Vector"])
    nz = nt.nodes.new("ShaderNodeTexNoise")                # wood grain streaks
    nz.inputs["Scale"].default_value = 3.0
    nz.inputs["Distortion"].default_value = 4.0
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    grain = srgb_ramp(nt, nz.outputs["Fac"],
                      [(0.0, (0.85, 0.8, 0.75, 1)), (1.0, (1, 1, 1, 1))])
    col = vmul(nt, br.outputs["Color"], grain.outputs["Color"])
    h = srgb_ramp(nt, br.outputs["Fac"], [(0.0, (1, 1, 1, 1)), (1.0, (0.3, 0.3, 0.3, 1))])
    return col, h.outputs["Color"]

def dirt_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 6.0
    nz.inputs["Detail"].default_value = 6.0
    nt.links.new(uv.outputs["UV"], nz.inputs["Vector"])
    col = srgb_ramp(nt, nz.outputs["Fac"],
                    [(0.0, shade(base, 0.78)), (0.5, shade(base, 1.0)),
                     (1.0, shade(base, 1.12))])
    return col.outputs["Color"], nz.outputs["Fac"]

def stripe_pattern(nt, base):
    uv = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(uv.outputs["UV"], sep.inputs["Vector"])
    m1 = nt.nodes.new("ShaderNodeMath"); m1.operation = "MULTIPLY"
    m1.inputs[1].default_value = 6.0                      # 6 stripes per tile
    nt.links.new(sep.outputs["X"], m1.inputs[0])
    m2 = nt.nodes.new("ShaderNodeMath"); m2.operation = "FRACT"
    nt.links.new(m1.outputs["Value"], m2.inputs[0])
    col = srgb_ramp(nt, m2.outputs["Value"],
                    [(0.0, shade(base, 1.0)), (0.49, shade(base, 1.0)),
                     (0.51, (0.93, 0.90, 0.82, 1)), (1.0, (0.93, 0.90, 0.82, 1))])
    col.color_ramp.interpolation = "CONSTANT"
    return col.outputs["Color"], m2.outputs["Value"]

PATTERNS = {"brick": brick_pattern, "stone": stone_pattern,
            "cobble": cobble_pattern, "pavers": pavers_pattern,
            "plank": plank_pattern, "dirt": dirt_pattern,
            "stripe": stripe_pattern}

# ------------------------------------------------------------- BAKE RIG -----
def make_bake_plane():
    bpy.ops.mesh.primitive_plane_add(size=2)
    plane = bpy.context.active_object
    plane.name = "_BakePlane"
    return plane

def new_image(name, srgb=True):
    img = bpy.data.images.new(name, TEX, TEX, alpha=False)
    img.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    return img

def bake_pattern(plane, pattern, base, albedo_img, normal_img=None):
    """EMIT-bake albedo (1 sample, exact); optional NORMAL bake from height."""
    mat = bpy.data.materials.new("_BakeMat"); mat.use_nodes = True
    plane.data.materials.clear(); plane.data.materials.append(mat)
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    col, height = PATTERNS[pattern](nt, base)

    emit = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(col, emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    tgt = nt.nodes.new("ShaderNodeTexImage"); tgt.image = albedo_img
    nt.nodes.active = tgt
    bpy.context.view_layer.objects.active = plane
    plane.select_set(True)
    bpy.context.scene.cycles.samples = 1
    bpy.ops.object.bake(type="EMIT")

    if normal_img is not None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.35
        bump.inputs["Distance"].default_value = 0.02
        nt.links.new(height, bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        tgt.image = normal_img
        bpy.context.scene.cycles.samples = 8
        bpy.ops.object.bake(type="NORMAL")

    bpy.data.materials.remove(mat)

# ------------------------------------------------- WORLD-SCALE BOX UVs ------
def triplanar_uv(obj, metres_per_tile):
    me = obj.data
    uv = me.uv_layers.active or me.uv_layers.new(name="UVMap")
    mw = obj.matrix_world
    rot = mw.to_3x3()
    inv = 1.0 / metres_per_tile
    for poly in me.polygons:
        n = rot @ poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            co = mw @ me.vertices[me.loops[li].vertex_index].co
            if ax == 0:   u, v = co.y, co.z
            elif ax == 1: u, v = co.x, co.z
            else:         u, v = co.x, co.y
            uv.data[li].uv = (u * inv, v * inv)

# --------------------------------------------------------- PREVIEW RENDER ---
def render_preview(path, cam_pos, cam_look):
    sc = bpy.context.scene
    cam_data = bpy.data.cameras.new("_PrevCam"); cam_data.angle = radians(55)
    cam = bpy.data.objects.new("_PrevCam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = cam_pos
    d = (Vector(cam_look) - Vector(cam_pos)).normalized()
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sun_data = bpy.data.lights.new("_PrevSun", "SUN")
    sun_data.energy = 4.0; sun_data.color = (1.0, 0.88, 0.7)
    sun = bpy.data.objects.new("_PrevSun", sun_data)
    sc.collection.objects.link(sun)
    sun.rotation_euler = (radians(55), 0, radians(140))
    world = bpy.data.worlds.new("_PrevWorld"); world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.9, 0.62, 0.45, 1); bg.inputs[1].default_value = 0.6
    old_world = sc.world; sc.world = world
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.view_settings.view_transform = "Standard"
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        try:
            sc.render.engine = eng; break
        except TypeError:
            continue
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.world = old_world
    for ob in (cam, sun): bpy.data.objects.remove(ob)
    bpy.data.cameras.remove(cam_data); bpy.data.lights.remove(sun_data)
    bpy.data.worlds.remove(world)
    print("PREVIEW:", path)

# glTF (x, y, z) -> Blender (x, -z, y); app home pose for like-for-like shots.
G2B = lambda p: (p[0], -p[2], p[1])
WIDE_POS, WIDE_LOOK = G2B((-8, 7, -34)), G2B((0, 5.5, -2))
CLOSE_POS, CLOSE_LOOK = G2B((7, 2.4, -12.5)), G2B((3.7, 1.0, -5.9))

# ------------------------------------------------------------------ MAIN ----
def main():
    os.makedirs(TILE_DIR, exist_ok=True)
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    print(f"imported {len(bpy.data.objects)} objects, "
          f"{len(bpy.data.materials)} materials, {len(bpy.data.actions)} actions")

    if RENDER_PREVIEWS:
        render_preview("/tmp/diorama-before.png", WIDE_POS, WIDE_LOOK)

    # --- bake all tiles -----------------------------------------------------
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.device = "CPU"
    plane = make_bake_plane()
    baked = {}            # material name -> (albedo_img, normal_img|None)
    norm_cache = {}       # pattern -> normal image (shared across variants)
    NORMAL_FOR = {"brick", "stone", "cobble", "plank", "pavers"}
    for mat_name, (pattern, _rough) in RETEXTURE.items():
        mat = bpy.data.materials.get(mat_name)
        if not mat:
            print(f"  !! material {mat_name} not found, skipping"); continue
        base = base_color_of(mat)
        albedo = new_image(f"tile_{mat_name}_albedo", srgb=True)
        need_norm = pattern in NORMAL_FOR and pattern not in norm_cache
        normal = new_image(f"tile_{pattern}_normal", srgb=False) if need_norm else None
        bake_pattern(plane, pattern, base, albedo, normal)
        if normal is not None:
            norm_cache[pattern] = normal
        baked[mat_name] = (albedo, norm_cache.get(pattern))
        print(f"  baked {pattern} tile for {mat_name}")
    bpy.data.objects.remove(plane)
    for img in bpy.data.images:
        if img.name.startswith("tile_"):
            img.filepath_raw = os.path.join(TILE_DIR, img.name + ".png")
            img.file_format = "PNG"
            img.save()
            try: img.pack()
            except Exception: pass

    # --- world-scale UVs (skip any mesh that carries an image texture) ------
    def mat_has_image(m):
        return bool(m and m.use_nodes and
                    any(n.type == "TEX_IMAGE" and n.image and
                        not n.image.name.startswith("tile_")
                        for n in m.node_tree.nodes))
    done_meshes, uv_count = set(), 0
    for ob in bpy.data.objects:
        if ob.type != "MESH" or ob.data.name in done_meshes: continue
        mats = [s.material for s in ob.material_slots]
        if any(mat_has_image(m) for m in mats): continue   # decal mesh: hands off
        hit = [m.name for m in mats if m and m.name in RETEXTURE]
        if not hit: continue
        pattern = RETEXTURE[hit[0]][0]
        triplanar_uv(ob, SCALE_M[pattern])
        done_meshes.add(ob.data.name); uv_count += 1
    print(f"  box-projected UVs on {uv_count} meshes")

    # --- rewire the named materials to their baked tiles ---------------------
    for mat_name, (pattern, rough) in RETEXTURE.items():
        mat = bpy.data.materials.get(mat_name)
        if not mat or mat_name not in baked: continue
        albedo, normal = baked[mat_name]
        mat.use_nodes = True
        nt = mat.node_tree; nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.inputs["Roughness"].default_value = rough
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = albedo
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if normal is not None:
            ntex = nt.nodes.new("ShaderNodeTexImage"); ntex.image = normal
            nmap = nt.nodes.new("ShaderNodeNormalMap")
            nmap.inputs["Strength"].default_value = 0.8
            nt.links.new(ntex.outputs["Color"], nmap.inputs["Color"])
            nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # --- PBR factor polish ----------------------------------------------------
    for mat_name, (metal, rough) in PBR_TWEAKS.items():
        mat = bpy.data.materials.get(mat_name)
        if not mat or not mat.use_nodes: continue
        for n in mat.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                n.inputs["Metallic"].default_value = metal
                n.inputs["Roughness"].default_value = rough
        print(f"  PBR: {mat_name} metallic={metal} roughness={rough}")

    # --- export ----------------------------------------------------------------
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB",
                              export_image_format="AUTO")
    print("EXPORTED:", OUT, f"({os.path.getsize(OUT)/1e6:.2f} MB)")

    if RENDER_PREVIEWS:
        render_preview("/tmp/diorama-after-wide.png", WIDE_POS, WIDE_LOOK)
        render_preview("/tmp/diorama-after-close.png", CLOSE_POS, CLOSE_LOOK)

main()
