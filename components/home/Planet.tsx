'use client';

import { useEffect, useRef } from 'react';

// La planète de Décode : une géante de glace violette (la couleur de la mascotte), dessinée en direct
// par la carte graphique. Pas de vidéo à télécharger ni de librairie 3D : un seul petit shader.
// L'image fixe en CSS (.sky__poster) s'affiche tout de suite ; le dessin en direct la remplace quand
// il est prêt, à la même place. Sans WebGL, ou si l'on préfère réduire les animations, l'image reste.

const VERTEX = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAGMENT = `
precision highp float;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uTime;
uniform float uIntro;

float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(1.7,9.2,4.1);a*=.5;}return v;}

void main(){
  float e=1.-pow(1.-uIntro,4.);
  float radius=uRadius*(.88+.12*e);
  vec2 center=uCenter-vec2(0.,(1.-e)*.36*uRadius);
  vec2 p=(gl_FragCoord.xy-center)/radius;
  float r=length(p);
  // La lumière arrive de derrière la planète puis tourne vers l'avant : un lever de soleil.
  vec3 L=normalize(mix(vec3(.25,.55,-.8),vec3(-.55,.42,.72),e));
  vec2 lp=normalize(L.xy+1e-4);

  // Le halo de l'atmosphère, plus fort du côté éclairé.
  float halo=exp(-max(r-1.,0.)*7.)*(.35+.65*smoothstep(-.6,1.,dot(p/max(r,1e-4),lp)));
  vec3 col=vec3(.56,.44,1.)*halo*.55;
  float alpha=halo*.55;

  // Les anneaux, très fins, inclinés comme ceux de Neptune.
  vec3 N=normalize(vec3(-.18,.97,.36));
  float rz=-(p.x*N.x+p.y*N.y)/N.z;
  float rr=length(vec3(p,rz));
  float ring=smoothstep(1.52,1.56,rr)*smoothstep(1.64,1.6,rr)*.55+smoothstep(1.86,1.95,rr)*smoothstep(2.3,2.1,rr)*.22;
  ring*=.75+.25*noise(vec3(rr*40.,0.,0.));
  float zs=r<1.?sqrt(1.-r*r):-1.;
  float ringFront=rz>zs?1.:0.;

  if(r<1.){
    float z=zs;
    vec3 n=vec3(p,z);
    // Axe incliné, puis la rotation : les bandes défilent lentement.
    float t=-.38;
    vec3 q=vec3(cos(t)*n.x-sin(t)*n.y,sin(t)*n.x+cos(t)*n.y,n.z);
    float s=uTime*.045;
    vec3 w=vec3(cos(s)*q.x+sin(s)*q.z,q.y,-sin(s)*q.x+cos(s)*q.z);
    float f=fbm(vec3(w.x*1.6,w.y*7.,w.z*1.6)+vec3(0.,0.,uTime*.01));
    float band=.5+.5*sin(w.y*10.+f*4.2);
    vec3 deep=vec3(.13,.08,.42),mid=vec3(.43,.27,.98),light=vec3(.8,.69,1.),pink=vec3(1.,.62,.86);
    vec3 c=mix(deep,mid,band);
    c=mix(c,light,smoothstep(.55,.9,f)*.55);
    // Une tempête rose et sa traîne, comme les joues de la mascotte.
    float d=length(w-normalize(vec3(.55,-.32,.77)));
    c=mix(c,pink,smoothstep(.22,.0,d+f*.08)*.7);
    float lit=smoothstep(-.18,.65,dot(n,L));
    c*=.06+1.12*lit;
    c+=pow(max(dot(reflect(-L,n),vec3(0,0,1)),0.),14.)*.18*lit;
    // L'atmosphère au bord du disque.
    c+=vec3(.55,.45,1.)*pow(1.-z,2.6)*(.25+.9*lit);
    float edge=smoothstep(1.,1.-1.6/radius,r);
    col=mix(col,c,edge);
    alpha=mix(alpha,1.,edge);
  }
  if(ringFront>0.||r>=1.){
    vec3 rc=vec3(.78,.7,1.)*(.25+.75*smoothstep(-1.,1.,dot(normalize(vec3(p,rz)),L)));
    col=col*(1.-ring)+rc*ring;
    alpha=alpha+ring*(1.-alpha);
  }
  float fade=smoothstep(0.,.45,uIntro);
  gl_FragColor=vec4(col*fade,alpha*fade);
}`;

/** La durée de l'arrivée, la même que l'animation CSS de l'image fixe. */
const INTRO_MS = 2600;

export function Planet() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const sky = canvas?.parentElement;
    const poster = sky?.querySelector<HTMLElement>('.sky__poster');
    if (!canvas || !sky || !poster) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let stopped = false;
    let raf = 0;
    let cleanup = () => {};

    const start = () => {
      if (stopped) return;
      const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return;
      const shader = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
      };
      const vs = shader(gl.VERTEX_SHADER, VERTEX);
      const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
      if (!vs || !fs) return;
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      // Un seul triangle qui couvre tout l'écran.
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'a');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = (name: string) => gl.getUniformLocation(program, name);
      const uCenter = u('uCenter');
      const uRadius = u('uRadius');
      const uTime = u('uTime');
      const uIntro = u('uIntro');

      // La planète prend la place exacte de l'image fixe (sans son animation d'arrivée).
      let scale = 1;
      const measure = () => {
        const small = sky.clientWidth < 760;
        // Sur téléphone, un peu moins de pixels : la différence ne se voit pas, la batterie si.
        scale = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
        canvas.width = Math.round(sky.clientWidth * scale);
        canvas.height = Math.round(sky.clientHeight * scale);
        gl.viewport(0, 0, canvas.width, canvas.height);
        const radius = (poster.offsetWidth / 2) * scale;
        const cx = (poster.offsetLeft + poster.offsetWidth / 2) * scale;
        const cy = canvas.height - (poster.offsetTop + poster.offsetHeight / 2) * scale;
        gl.uniform2f(uCenter, cx, cy);
        gl.uniform1f(uRadius, radius);
      };
      measure();
      const resize = new ResizeObserver(() => measure());
      resize.observe(sky);

      let visible = true;
      const seen = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) loop();
      });
      seen.observe(sky);
      const onVisibility = () => !document.hidden && loop();
      document.addEventListener('visibilitychange', onVisibility);

      let shown = false;
      let last = 0;
      // L'horloge part de l'ouverture de la page, comme l'animation CSS : les deux restent synchronisées.
      const frame = (now: number) => {
        raf = 0;
        if (stopped || !visible || document.hidden) return;
        // Après l'arrivée, la rotation est lente : 30 images par seconde suffisent et ménagent la batterie.
        if (now > INTRO_MS && now - last < 30) return loop();
        last = now;
        gl.uniform1f(uTime, now / 1000);
        gl.uniform1f(uIntro, Math.min(now / INTRO_MS, 1));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!shown) {
          shown = true;
          sky.classList.add('is-live');
        }
        loop();
      };
      const loop = () => {
        if (!raf && !stopped) raf = requestAnimationFrame(frame);
      };
      loop();

      cleanup = () => {
        resize.disconnect();
        seen.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        if (raf) cancelAnimationFrame(raf);
      };
    };

    // Après l'affichage et le reste de la page : la planète ne retarde ni le texte ni la recherche.
    const idle = typeof requestIdleCallback === 'function';
    const handle = idle ? requestIdleCallback(start, { timeout: 700 }) : setTimeout(start, 200);
    return () => {
      stopped = true;
      if (idle) cancelIdleCallback(handle as number);
      else clearTimeout(handle);
      cleanup();
    };
  }, []);

  return <canvas ref={ref} className="sky__canvas" aria-hidden="true" />;
}
