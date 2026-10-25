import bpy, sys, math, json
argv = sys.argv[sys.argv.index('--')+1:]
cfg = json.loads(argv[0])
out = cfg['out']; res = cfg.get('res', 512); samples = cfg.get('samples', 64)
acc = cfg.get('acc', [])          # cap, glasses, tie, loupe
face = cfg.get('face', 'smile')   # smile, happy, wink, surprised, think
arms = cfg.get('arms', 'down')    # down, wave, hold, up
rotz = math.radians(cfg.get('rotz', 0))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, color, rough=0.5, metal=0.0, coat=0.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    if emit:
        b.inputs['Emission Color'].default_value = color; b.inputs['Emission Strength'].default_value = emit
    return m

def clay(name, low, high):
    """Pâte douce : dégradé du bas vers le haut, un peu de transluscence et un léger vernis."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs[0])
    ramp.color_ramp.elements[0].position = 0.15; ramp.color_ramp.elements[0].color = low + (1,)
    ramp.color_ramp.elements[1].position = 0.95; ramp.color_ramp.elements[1].color = high + (1,)
    nt.links.new(ramp.outputs[0], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.42
    b.inputs['Subsurface Weight'].default_value = 0.25
    b.inputs['Subsurface Radius'].default_value = (0.6, 0.3, 0.8)
    b.inputs['Subsurface Scale'].default_value = 0.15
    b.inputs['Coat Weight'].default_value = 0.35; b.inputs['Coat Roughness'].default_value = 0.25
    b.inputs['Sheen Weight'].default_value = 0.2
    return m

LOW = tuple(cfg.get('low', (0.1, 0.015, 0.62)))
HIGH = tuple(cfg.get('high', (0.5, 0.2, 1.0)))
skin = clay('peau', LOW, HIGH)
limb = clay('membres', LOW, (LOW[0]*1.6, LOW[1]*1.6, min(1, LOW[2]*1.15)))

# --- Corps : un mochi, rond et un peu plus large en bas.
A, B, C = 1.05, 0.88, 0.95
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=96, ring_count=48)
body = bpy.context.object; body.scale = (A, B, C)
bpy.ops.object.transform_apply(scale=True)
for v in body.data.vertices:
    z = v.co.z
    if z < 0:   # bas plus plein, assise un peu aplatie
        v.co.x *= 1 + 0.08 * (-z); v.co.y *= 1 + 0.06 * (-z)
        if z < -0.78: v.co.z = -0.78 - (z + 0.78) * 0.35
bpy.ops.object.shade_smooth()
sub = body.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
body.data.materials.append(skin)

def surf(x, z, inset=0.0):
    """Le point de la face avant du corps à (x, z)."""
    k = 1 - (x / A) ** 2 - (z / C) ** 2
    return -B * math.sqrt(max(k, 0.02)) * (1 + (0.06 * -z if z < 0 else 0)) + inset

black = mat('noir', (0.004, 0.003, 0.012, 1), 0.35)
black.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.15
white = mat('reflet', (1, 1, 1, 1), 0.2, emit=4.0)
pink = mat('joues', (1.0, 0.18, 0.45, 1), 0.55)

EY, EX = cfg.get('eye_z', 0.0), cfg.get('eye_x', 0.37)

def eye(x, z=EY, big=1.0):
    y = surf(x, z, 0.03)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16 * big, location=(x, y, z), segments=48, ring_count=24)
    e = bpy.context.object; e.scale = (0.82, 0.55, 1.12); bpy.ops.object.shade_smooth(); e.data.materials.append(black)
    for (dx, dz, r) in ((-0.045, 0.07, 0.045), (0.04, -0.06, 0.02)):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r * big, location=(x + dx * big, y - 0.06 * big, z + dz * big))
        bpy.context.object.data.materials.append(white)

def arc(x, z, r=0.085, up=True, thick=0.022):
    y = surf(x, z, 0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=thick, location=(x, y - 0.01, z), rotation=(math.radians(90), 0, 0), major_segments=48, minor_segments=12)
    a = bpy.context.object; a.data.materials.append(black)
    bpy.ops.mesh.primitive_cube_add(size=r * 3, location=(x, y, z + (-r * 1.5 if up else r * 1.5)))
    cu = bpy.context.object
    m = a.modifiers.new('cut', 'BOOLEAN'); m.object = cu; m.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = a; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cu)

# --- Visage.
if face == 'happy':
    arc(-EX, EY, 0.12, up=True, thick=0.03); arc(EX, EY, 0.12, up=True, thick=0.03)
elif face == 'wink':
    eye(-EX); arc(EX, EY - 0.02, 0.12, up=True, thick=0.03)
elif face == 'think':
    eye(-EX + 0.05, EY + 0.06); eye(EX + 0.05, EY + 0.06)
else:
    big = 1.18 if face == 'surprised' else 1.0
    eye(-EX, big=big); eye(EX, big=big)

MZ = EY - 0.24
if face == 'surprised':
    y = surf(0, MZ - 0.02, 0.01)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, location=(0, y, MZ - 0.02)); o = bpy.context.object
    o.scale = (0.85, 0.5, 1.1); o.data.materials.append(black)
elif face == 'think':
    arc(0.12, MZ + 0.03, 0.07, up=False, thick=0.025)
else:
    arc(0, MZ + 0.06, 0.1 if face != 'happy' else 0.12, up=False, thick=0.03)
if face in ('happy', 'wink', 'smile') or cfg.get('blush'):
    for x in (-EX - 0.12, EX + 0.12):
        z = EY - 0.2; y = surf(x, z, -0.012)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(x, y, z)); o = bpy.context.object
        o.scale = (1.3, 0.3, 0.8); o.rotation_euler = (0, 0, math.radians(18 if x > 0 else -18))
        bpy.ops.object.shade_smooth(); o.data.materials.append(pink)

# --- Bras et pieds : de petites capsules.
def capsule(start, angle_deg, length, radius, side):
    a = math.radians(angle_deg)
    dx, dz = math.sin(a) * side, -math.cos(a)
    cx, cz = start[0] + dx * length / 2, start[2] + dz * length / 2
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(cx, start[1], cz), segments=32, ring_count=16)
    o = bpy.context.object; o.scale = (radius, radius, length / 2 + radius * 0.4)
    o.rotation_euler = (0, -a * side, 0); bpy.ops.object.shade_smooth(); o.data.materials.append(limb)
    return (start[0] + dx * length, start[1], start[2] + dz * length)

ARM = {'down': (30, 30), 'wave': (30, 150), 'hold': (30, 75), 'up': (150, 150), 'grip': (84, 84)}[arms]
SZ = -0.46 if arms == 'grip' else -0.18
SX = 0.9 if arms == 'grip' else 0.95
hand_r = capsule((-SX, -0.12, SZ), ARM[0], 0.36, 0.13, -1)
hand_l = capsule((SX, -0.12, SZ), ARM[1], 0.36, 0.13, 1)
for x in (-0.38, 0.38):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(x, -0.25, -0.86)); o = bpy.context.object
    o.scale = (0.2, 0.26, 0.12); bpy.ops.object.shade_smooth(); o.data.materials.append(limb)

# --- Accessoires.
if 'cap' in acc:
    felt = mat('feutre', (0.01, 0.01, 0.014, 1), 0.7)
    gold = mat('or', (0.95, 0.66, 0.08, 1), 0.3, metal=0.7)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.52, depth=0.3, location=(0, 0.02, 0.8), vertices=48)
    bpy.context.object.data.materials.append(felt)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.02, 0.96)); top = bpy.context.object
    top.scale = (1.45, 1.45, 0.05); top.rotation_euler = (math.radians(6), 0, math.radians(10)); top.data.materials.append(felt)
    bv = top.modifiers.new('bv', 'BEVEL'); bv.width = 0.015; bv.segments = 3
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0, -0.02, 1.01)); bpy.context.object.data.materials.append(gold)
    bpy.ops.curve.primitive_bezier_curve_add(); cord = bpy.context.object
    p0, p1 = cord.data.splines[0].bezier_points
    p0.co = (0, -0.02, 1.02); p0.handle_left = (-0.1, -0.02, 1.02); p0.handle_right = (0.35, -0.35, 0.98)
    p1.co = (0.66, -0.66, 0.77); p1.handle_left = (0.67, -0.65, 0.91); p1.handle_right = (0.66, -0.66, 0.7)
    cord.data.bevel_depth = 0.014; cord.data.materials.append(gold)
    bpy.ops.mesh.primitive_cone_add(radius1=0.065, radius2=0.02, depth=0.3, location=(0.66, -0.66, 0.59)); bpy.context.object.data.materials.append(gold)
if 'glasses' in acc:
    yel = mat('jaune', (1.0, 0.75, 0.02, 1), 0.25, coat=0.5)
    for x in (-EX, EX):
        y = surf(x, EY, -0.1)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.25, minor_radius=0.03, location=(x, y, EY), rotation=(math.radians(90), 0, 0), major_segments=64)
        bpy.context.object.data.materials.append(yel)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.3, location=(0, surf(0, EY + 0.04, -0.1), EY + 0.04), rotation=(0, math.radians(90), 0))
    bpy.context.object.data.materials.append(yel)
if 'tie' in acc:
    red = mat('noeud', (0.95, 0.75, 0.02, 1), 0.35, coat=0.4)
    z = -0.45; y = surf(0, z, -0.02)
    for x in (-0.13, 0.13):
        bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.03, depth=0.22, location=(x, y, z), rotation=(0, math.radians(90 if x < 0 else -90), 0), vertices=32)
        o = bpy.context.object; o.scale = (1, 0.55, 1); bpy.ops.object.shade_smooth(); o.data.materials.append(red)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(0, y - 0.02, z)); bpy.context.object.data.materials.append(red)
if 'loupe' in acc:
    rim = mat('monture', (1.0, 0.75, 0.02, 1), 0.25, coat=0.5)
    glass = bpy.data.materials.new('verre'); glass.use_nodes = True
    gb = glass.node_tree.nodes['Principled BSDF']; gb.inputs['Base Color'].default_value = (0.9, 0.95, 1, 1)
    gb.inputs['Base Color'].default_value = (0.7, 0.88, 1, 1); gb.inputs['Roughness'].default_value = 0.08; gb.inputs['Alpha'].default_value = 0.3
    hx, hy, hz = hand_l
    cx, cz = hx + 0.16, hz + 0.45
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.32, location=(hx + 0.05, hy - 0.08, hz + 0.02), rotation=(0, math.radians(20), 0))
    bpy.context.object.data.materials.append(mat('manche', (0.05, 0.03, 0.1, 1), 0.3, coat=0.6))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.055, location=(cx, hy - 0.1, cz), rotation=(math.radians(90), 0, math.radians(-10)), major_segments=64)
    bpy.context.object.data.materials.append(rim)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.02, location=(cx, hy - 0.1, cz), rotation=(math.radians(90), 0, math.radians(-10)), vertices=64)
    bpy.context.object.data.materials.append(glass)

# Tout tourne ensemble.
bpy.ops.object.empty_add(location=(0, 0, 0)); root = bpy.context.object
for o in list(sc.objects):
    if o != root and o.type in ('MESH', 'CURVE'): o.parent = root
root.rotation_euler = (0, 0, rotz)

# --- Lumière de studio douce, un liseré derrière.
def area(loc, e, size, rot, color=(1, 1, 1)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l = bpy.context.object
    l.data.energy = e; l.data.size = size; l.data.color = color
area((-3, -4, 4), 700, 6, (math.radians(50), 0, math.radians(-35)))
area((4, -3, 1.5), 250, 5, (math.radians(75), 0, math.radians(55)), (1, 0.9, 1))
area((0, 4, 3), 1200, 3, (math.radians(-120), 0, 0), (0.9, 0.85, 1))
area((0, -3, -3), 120, 6, (math.radians(135), 0, 0))
bpy.ops.object.camera_add(location=(0, -7.2, 1.2), rotation=(math.radians(81), 0, 0)); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 58
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.95, 0.94, 1, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.5

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = False
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.01
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = res
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'AgX' if 'AgX' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
try:
    sc.view_settings.look = 'AgX - Punchy'
except Exception:
    pass
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.15
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
