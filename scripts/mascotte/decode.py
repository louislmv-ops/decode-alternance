import bpy, bmesh, sys, math, json
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
cfg = json.loads(argv[0])
out = cfg['out']; res = cfg.get('res', 512); samples = cfg.get('samples', 48)
acc = cfg.get('acc', [])            # 'cap','glasses','tie','bow'
face = cfg.get('face', 'smile')     # smile, wink, surprised, neutral, happy, think
rotz = math.radians(cfg.get('rotz', 0)); hair = cfg.get('hair', True)
LIME = (0.42, 0.78, 0.035, 1)  # lineaire

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, color, rough=0.5, metal=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sheen: b.inputs['Sheen Weight'].default_value = sheen
    return m

# --- Corps : des sphères fondues en une forme de nuage, puis lissée.
blobs = [((0,0,-0.02),(1.05,0.9,0.85)),
         ((-0.62,0,0.32),(0.5,0.5,0.5)), ((0,0,0.55),(0.58,0.55,0.5)), ((0.62,0,0.32),(0.5,0.5,0.5)),
         ((-0.88,0,-0.12),(0.42,0.45,0.45)), ((0.88,0,-0.12),(0.42,0.45,0.45)),
         ((-0.5,0,-0.55),(0.5,0.5,0.42)), ((0.5,0,-0.55),(0.5,0.5,0.42)), ((0,0.05,-0.62),(0.5,0.5,0.38))]
parts = []
for loc,sc_ in blobs:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc, segments=48, ring_count=24)
    o = bpy.context.object; o.scale = sc_; parts.append(o)
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object; body.name = 'Corps'
bpy.ops.object.transform_apply(scale=True)
rm = body.modifiers.new('rm','REMESH'); rm.mode='VOXEL'; rm.voxel_size=0.035
bpy.ops.object.modifier_apply(modifier='rm')
sm = body.modifiers.new('sm','SMOOTH'); sm.iterations=4; sm.factor=0.5
bpy.ops.object.modifier_apply(modifier='sm')
bpy.ops.object.shade_smooth()
body.data.materials.append(mat('peau', tuple(cfg.get('root',(0.18,0.40,0.01)))+(1,), 0.8))

# --- Fourrure : poils courts et denses.
if hair:
    ps = body.modifiers.new('fur','PARTICLE_SYSTEM').particle_system
    s = ps.settings; s.type='HAIR'; s.count = cfg.get('count', 7000); s.hair_length = cfg.get('fur', 0.24)
    s.use_advanced_hair = True; s.child_type='INTERPOLATED'; s.rendered_child_count = cfg.get('children', 30)
    s.child_length = 1.0; s.roughness_1 = 0.07; s.roughness_2 = 0.12; s.roughness_endpoint = 0.06; s.roughness_2_size = 0.6
    s.clump_factor = 0.45; s.clump_shape = -0.2; s.kink = 'NO'
    s.root_radius = 1.0; s.tip_radius = 0.0; s.radius_scale = 0.014
    s.display_step = 3; s.render_step = 3
    if 'cap' in acc:
        vg = body.vertex_groups.new(name='densite')
        for v in body.data.vertices:
            vg.add([v.index], 0.15 if (v.co.z > 0.7 and abs(v.co.x) < 0.6 and v.normal.z > 0.3) else 1.0, 'REPLACE')
        ps.vertex_group_length = 'densite'
    hm = bpy.data.materials.new('poils'); hm.use_nodes=True
    nt = hm.node_tree; nt.nodes.clear()
    o_ = nt.nodes.new('ShaderNodeOutputMaterial'); h = nt.nodes.new('ShaderNodeBsdfPrincipled')
    hi = nt.nodes.new('ShaderNodeHairInfo'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = tuple(cfg.get('root',(0.18,0.40,0.01))) + (1,); ramp.color_ramp.elements[1].color = tuple(cfg.get('tip',(0.72,1.0,0.1))) + (1,)
    nt.links.new(hi.outputs['Intercept'], ramp.inputs[0]); nt.links.new(ramp.outputs[0], h.inputs['Base Color'])
    h.inputs['Roughness'].default_value = 0.55
    nt.links.new(h.outputs[0], o_.inputs[0])
    body.data.materials.append(hm); s.material = 2

# --- Visage.
black = mat('noir', (0.005,0.005,0.006,1), 0.12)
FS = cfg.get('facescale', 1.0)
def grow(before):
    # Agrandit le visage autour de son centre et l'avance un peu hors des poils.
    for o in set(bpy.data.objects) - before:
        o.location.x = o.location.x * FS
        o.location.z = 0.05 + (o.location.z - 0.05) * FS
        o.location.y -= 0.045 * (FS - 1)
        o.scale = (o.scale[0]*FS, o.scale[1]*FS, o.scale[2]*FS)
_face = set(bpy.data.objects)
def eye(x, closed=False, big=1.0):
    if closed:
        bpy.ops.curve.primitive_bezier_circle_add(radius=0.09, location=(x, -1.02, 0.28))
        c = bpy.context.object; c.data.bevel_depth = 0.014; c.rotation_euler=(math.radians(90),0,0)
        c.scale=(1,0.45,1); c.data.materials.append(black)
        # ne garder que l'arc haut
        return c
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09*big*cfg.get('eyescale',1), location=(x, -1.12-0.03*(cfg.get('eyescale',1)-1), 0.12))
    e = bpy.context.object; e.scale=(0.7,0.5,1.35); bpy.ops.object.shade_smooth(); e.data.materials.append(black)
    return e
def arc_eye(x):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.019, location=(x,-1.14,0.1), rotation=(math.radians(90),0,0))
    a = bpy.context.object; a.scale=(1,1,0.8); a.data.materials.append(black)
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(x,-1.14,-0.04)); cu = bpy.context.object
    m = a.modifiers.new('cut','BOOLEAN'); m.object = cu; m.operation='DIFFERENCE'
    bpy.context.view_layer.objects.active = a; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cu)
if face == 'happy':
    arc_eye(-0.3); arc_eye(0.3)
elif face == 'think':
    for x in (-0.24, 0.36):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(x, -1.11, 0.2))
        e = bpy.context.object; e.scale=(0.7,0.5,1.3); bpy.ops.object.shade_smooth(); e.data.materials.append(black)
elif face == 'wink':
    eye(-0.3); 
    bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.018, location=(0.3,-1.14,0.1), rotation=(math.radians(90),0,0))
    w = bpy.context.object; w.scale=(1,1,0.75); w.data.materials.append(black)
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0.3,-1.14,-0.04)); cutw = bpy.context.object
    bw = w.modifiers.new('cut','BOOLEAN'); bw.object = cutw; bw.operation='DIFFERENCE'
    bpy.context.view_layer.objects.active = w; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cutw)
else:
    big = 1.25 if face=='surprised' else 1.0
    eye(-0.3, big=big); eye(0.3, big=big)
if face == 'surprised':
    bpy.ops.mesh.primitive_torus_add(major_radius=0.075, minor_radius=0.02, location=(0,-1.14,-0.15), rotation=(math.radians(90),0,0))
    bpy.context.object.data.materials.append(black)
elif face == 'think':
    bpy.ops.mesh.primitive_cylinder_add(radius=0.014, depth=0.12, location=(0.08,-1.13,-0.12), rotation=(0,math.radians(80),0))
    bpy.context.object.data.materials.append(black)
elif face != 'neutral':
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09*cfg.get('eyescale',1), minor_radius=0.016*cfg.get('eyescale',1), location=(0,-1.13-0.03*(cfg.get('eyescale',1)-1),-0.06-0.04*(cfg.get('eyescale',1)-1)), rotation=(math.radians(90),0,0))
    m_ = bpy.context.object; m_.data.materials.append(black)
    # garder la moitié basse : on coupe avec un booléen
    bpy.ops.mesh.primitive_cube_add(size=0.4, location=(0,-1.13,0.14)); cut = bpy.context.object
    b = m_.modifiers.new('cut','BOOLEAN'); b.object = cut; b.operation='DIFFERENCE'
    bpy.context.view_layer.objects.active = m_; bpy.ops.object.modifier_apply(modifier='cut')
    bpy.data.objects.remove(cut)

if cfg.get('blush'):
    pink = mat('joues', (0.95,0.32,0.55,1), 0.6)
    for x in (-0.36, 0.36):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(x,-1.1,-0.06))
        o = bpy.context.object; o.scale=(1.2,0.35,0.7); bpy.ops.object.shade_smooth(); o.data.materials.append(pink)
grow(_face)

# --- Accessoires.
if 'cap' in acc:
    felt = mat('feutre', (0.006,0.006,0.008,1), 1.0); felt.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.05
    gold = mat('or', (0.55,0.36,0.08,1), 0.35, metal=0.6)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=0.42, location=(0,0,0.9), vertices=4, rotation=(0,0,math.radians(45)))
    c1 = bpy.context.object; c1.scale=(1,1,1); c1.data.materials.append(felt)
    bv = c1.modifiers.new('bv','BEVEL'); bv.width=0.02; bv.segments=3
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,1.12)); top = bpy.context.object
    top.scale=(1.8,1.8,0.06); top.rotation_euler=(math.radians(5),0,math.radians(8)); top.data.materials.append(felt)
    bv = top.modifiers.new('bv','BEVEL'); bv.width=0.015; bv.segments=3
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.05, location=(0,-0.07,1.18)); bpy.context.object.data.materials.append(felt)
    # gland : cordon + houppe
    bpy.ops.curve.primitive_bezier_curve_add(location=(0,0,0)); cord = bpy.context.object
    sp = cord.data.splines[0]; p0, p1 = sp.bezier_points
    p0.co=(0,-0.07,1.2); p0.handle_left=(-0.1,-0.07,1.2); p0.handle_right=(0.5,-0.4,1.14)
    p1.co=(0.85,-0.85,0.92); p1.handle_left=(0.86,-0.84,1.04); p1.handle_right=(0.85,-0.85,0.77)
    cord.data.bevel_depth=0.012; cord.data.materials.append(gold)
    bpy.ops.mesh.primitive_cone_add(radius1=0.06, radius2=0.015, depth=0.35, location=(0.85,-0.85,0.72)); bpy.context.object.data.materials.append(gold)
if 'glasses' in acc:
    _gl = set(bpy.data.objects)
    yel = mat('jaune', (0.85,0.6,0.02,1), 0.3)
    for x in (-0.3,0.3):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.19, minor_radius=0.028, location=(x,-1.2,0.12), rotation=(math.radians(90),0,0))
        bpy.context.object.data.materials.append(yel)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.18, location=(0,-1.2,0.16), rotation=(0,math.radians(90),0)); bpy.context.object.data.materials.append(yel)
    grow(_gl)
if 'tie' in acc:
    red = mat('cravate', (0.42,0.008,0.01,1), 0.55)
    bm = bmesh.new()
    pts=[(-0.07,0,-0.20),(0.07,0,-0.20),(0.05,0,-0.30),(0.12,0,-0.75),(0,0,-0.88),(-0.12,0,-0.75),(-0.05,0,-0.30)]
    vs=[bm.verts.new(p) for p in pts]; bm.faces.new(vs)
    me=bpy.data.meshes.new('tie'); bm.to_mesh(me); t=bpy.data.objects.new('tie',me); sc.collection.objects.link(t)
    t.location=(0,-1.2,-0.2); t.data.materials.append(red)
    so=t.modifiers.new('so','SOLIDIFY'); so.thickness=0.04; bv=t.modifiers.new('bv','BEVEL'); bv.width=0.01; bv.segments=2
if 'bow' in acc:
    pur = mat('noeud', (0.25,0.04,0.55,1), 0.6, sheen=0.3)
    for x in (-0.13,0.13):
        bpy.ops.mesh.primitive_cone_add(radius1=0.11, radius2=0.03, depth=0.2, location=(x,-1.08,-0.2), rotation=(0,math.radians(90 if x<0 else -90),0), vertices=24)
        o=bpy.context.object; o.scale=(1,0.6,1); bpy.ops.object.shade_smooth(); o.data.materials.append(pur)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(0,-1.1,-0.2)); bpy.context.object.data.materials.append(pur)

if 'loupe' in acc:
    rim = mat('monture', (0.85,0.6,0.02,1), 0.3)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.045, location=(0.98,-1.05,-0.32), rotation=(math.radians(90),0,math.radians(-15)), major_segments=64)
    bpy.context.object.data.materials.append(rim)
    glass = bpy.data.materials.new('verre'); glass.use_nodes=True
    gb = glass.node_tree.nodes['Principled BSDF']; gb.inputs['Base Color'].default_value=(0.85,0.92,1,1)
    gb.inputs['Roughness'].default_value=0.02; gb.inputs['Transmission Weight'].default_value=1.0; gb.inputs['IOR'].default_value=1.2
    bpy.ops.mesh.primitive_cylinder_add(radius=0.29, depth=0.03, location=(0.98,-1.05,-0.32), rotation=(math.radians(90),0,math.radians(-15)), vertices=64)
    bpy.context.object.data.materials.append(glass)
    hdl = mat('manche', (0.03,0.02,0.06,1), 0.35)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.5, location=(1.27,-1.0,-0.78), rotation=(0,math.radians(-33),0), vertices=32)
    o=bpy.context.object; bpy.ops.object.shade_smooth(); o.data.materials.append(hdl)

# Tout tourne ensemble.
bpy.ops.object.empty_add(location=(0,0,0)); root = bpy.context.object
for o in list(sc.objects):
    if o != root and o.type in ('MESH','CURVE'): o.parent = root
root.rotation_euler = (0,0,rotz)

# --- Lumière et caméra.
def area(loc, e, size, rot):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); l=bpy.context.object; l.data.energy=e; l.data.size=size
area((-3,-4,4), 900, 5, (math.radians(50),0,math.radians(-35)))
area((4,-2,1.5), 350, 4, (math.radians(75),0,math.radians(60)))
area((0,4,3), 1400, 3, (math.radians(-120),0,0))
area((-3,3,-1), 500, 3, (math.radians(-80),0,math.radians(-140)))
bpy.ops.object.camera_add(location=(0,-7.0,1.9), rotation=(math.radians(76),0,0)); cam=bpy.context.object; sc.camera=cam
cam.data.lens = 60
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.55,0.55,0.55,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.6

sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=samples; sc.cycles.use_denoising=False; sc.cycles.use_adaptive_sampling=True; sc.cycles.adaptive_threshold=0.004; sc.render.filter_size=1.2
sc.render.film_transparent=True; sc.render.resolution_x=sc.render.resolution_y=res
sc.view_settings.view_transform='AgX' if 'AgX' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
sc.render.image_settings.color_mode='RGBA'
try:
    sc.view_settings.look = 'AgX - Punchy'
except Exception:
    pass
if cfg.get('vivid'):
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.35
sc.render.filepath=out
bpy.ops.render.render(write_still=True)
