import * as THREE from 'three';

/*
  Hero WebGL scene, two layers:
  1. A full-screen fragment shader: fbm noise shaped into slow, smoky fire rising from the bottom.
  2. Thousands of ember particles that rise, drift, cool down, and get pushed away by the cursor.
  Scrolling past the hero dims the fire and speeds the embers up.
*/

const fireFrag = /* glsl */ `
  uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uScroll;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
  void main(){
    vec2 uv = vUv; float aspect = uRes.x / uRes.y;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
    float t = uTime * 0.35;
    vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, -t)), fbm(p * 1.6 + vec2(5.2, -t * 1.2)));
    vec2 r = vec2(fbm(p * 2.2 + q * 2.0 + vec2(1.7, -t * 1.6)), fbm(p * 2.2 + q * 2.0 + vec2(8.3, -t * 1.4)));
    float n = fbm(p * 2.5 + r * 1.8 + vec2(0.0, -t * 2.0));

    // Fire is strongest bottom-right so the headline (bottom-left) stays readable.
    float side = smoothstep(-0.6 * aspect, 0.5 * aspect, p.x);
    float base = smoothstep(0.95, -0.1, uv.y + (n - 0.5) * 0.7);
    vec2 mp = vec2((uMouse.x - 0.5) * aspect, uMouse.y);
    float glow = 0.35 / (1.0 + 18.0 * dot(p - mp, p - mp));
    float heat = base * n * (0.55 + side * 1.1) + glow * n * 0.9;
    heat *= 1.0 - uScroll * 0.8;

    vec3 col = vec3(0.114, 0.078, 0.063);
    col = mix(col, vec3(0.42, 0.09, 0.04), smoothstep(0.08, 0.38, heat));
    col = mix(col, vec3(0.78, 0.33, 0.24), smoothstep(0.32, 0.68, heat));
    col = mix(col, vec3(0.98, 0.62, 0.32), smoothstep(0.62, 1.05, heat));

    col *= smoothstep(1.6, 0.35, length(p - vec2(0.2, 0.25)));   // vignette
    col += (hash(uv * uRes + fract(uTime)) - 0.5) * 0.035;       // film grain
    gl_FragColor = vec4(col, 1.0);
  }
`;

const emberVert = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform vec2 uMouse; uniform vec2 uView; uniform float uScroll;
  attribute vec4 aSeed;
  varying float vLife; varying float vHeat;
  void main(){
    float speed = 0.045 + aSeed.y * 0.08;
    float life = fract(aSeed.x + uTime * speed * (1.0 + uScroll * 4.0));
    float z = (aSeed.w - 0.5) * 9.0;
    float depth = (10.0 - z) / 10.0;
    float x = (pow(aSeed.z, 0.7) - 0.45) * uView.x * depth * 1.1;   // skew towards the right, like the fire
    float y = (-0.6 + life * 1.35) * uView.y * depth;
    x += sin(uTime * 0.7 + aSeed.w * 40.0 + life * 8.0) * 0.6 * life;
    x += sin(uTime * 2.3 + aSeed.x * 20.0) * 0.06;
    vec3 pos = vec3(x, y, z);

    vec2 d = pos.xy - uMouse * depth;
    float dist = length(d);
    pos.xy += normalize(d + 0.0001) * smoothstep(2.8, 0.0, dist) * 1.8;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.25 + aSeed.y * 0.9) / -mv.z;
    vLife = life; vHeat = aSeed.y;
  }
`;

const emberFrag = /* glsl */ `
  varying float vLife; varying float vHeat;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float core = pow(smoothstep(0.5, 0.0, d), 2.2);
    float fade = smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
    vec3 col = mix(vec3(1.0, 0.38, 0.12), vec3(1.0, 0.82, 0.5), vHeat);
    col = mix(col, vec3(0.75, 0.18, 0.06), smoothstep(0.35, 0.95, vLife));   // embers cool as they rise
    gl_FragColor = vec4(col * 1.4, core * fade);
  }
`;

export function initEmbers(canvas: HTMLCanvasElement, reduceMotion: boolean) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove(); // no WebGL: the section's CSS background is the fallback
    return { setScroll() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.autoClear = false;

  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector2(0.7, 0.3) }, uScroll: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: fireFrag,
    depthTest: false,
    depthWrite: false,
  });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 10;

  const count = window.innerWidth < 768 ? 700 : 1800;
  const seeds = new Float32Array(count * 4).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const pMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 90 * renderer.getPixelRatio() },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uView: { value: new THREE.Vector2(1, 1) },
      uScroll: { value: 0 },
    },
    vertexShader: emberVert,
    fragmentShader: emberFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  const viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uRes.value.set(w, h);
    pMat.uniforms.uView.value.set(viewH * camera.aspect, viewH);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Cursor in 0..1 (y up), eased every frame so the fire follows lazily.
  const target = new THREE.Vector2(0.7, 0.3), mouse = target.clone();
  let hasMouse = false;
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    hasMouse = true;
  }, { passive: true });

  const clock = new THREE.Clock();
  let scroll = 0;
  const frame = () => {
    const t = reduceMotion ? 6 : clock.getElapsedTime();
    mouse.lerp(target, 0.06);
    bgMat.uniforms.uTime.value = t;
    bgMat.uniforms.uMouse.value.copy(mouse);
    bgMat.uniforms.uScroll.value = scroll;
    pMat.uniforms.uTime.value = t;
    pMat.uniforms.uScroll.value = scroll;
    const view = pMat.uniforms.uView.value;
    if (hasMouse) pMat.uniforms.uMouse.value.set((mouse.x - 0.5) * view.x, (mouse.y - 0.5) * view.y);
    camera.position.x += ((mouse.x - 0.5) * 0.8 - camera.position.x) * 0.05;
    camera.position.y += ((mouse.y - 0.5) * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render(scene, camera);
  };

  if (reduceMotion) {
    frame();
  } else {
    // Only animate while the hero is on screen.
    new IntersectionObserver(([e]) => renderer.setAnimationLoop(e.isIntersecting ? frame : null)).observe(canvas);
  }

  return { setScroll(p: number) { scroll = p; if (reduceMotion) frame(); } };
}
