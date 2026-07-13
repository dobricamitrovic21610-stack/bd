import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const isMobile = window.innerWidth < 768;
const lowPower = isMobile || (navigator.hardwareConcurrency || 8) <= 4;
let visible = true;

// Phone screen CSS pixels (must match CSS vars)
const PHONE_CSS_W = 300;
const PHONE_CSS_H = 650;
const SCREEN_WORLD_W = 0.68; // world units for CSS3D scale

// ─── Lenis ──────────────────────────────────────────────────────────
const lenis = new Lenis({ lerp: lowPower ? 0.12 : 0.09, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Scene ──────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 80);
camera.position.set(0, 0.15, 6.2);

const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: !lowPower, powerPreference: 'high-performance',
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.6));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(innerWidth, innerHeight);
cssRenderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;';
document.body.appendChild(cssRenderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
scene.add(new THREE.HemisphereLight(0xffe0c8, 0x101428, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3.5, 5, 7);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 1.1);
rim.position.set(-5, 1, -3);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffb07a, 0.55);
fill.position.set(0, -2, 4);
scene.add(fill);

// Soft aurora
const auroraMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
        varying vec2 vUv; uniform float uTime,uScroll; uniform vec2 uMouse;
        void main(){
            vec2 uv=vUv+uMouse*0.04;
            float a=sin(uv.x*3.+uTime*.25+uScroll*2.)*.5+.5;
            float b=sin(uv.y*2.5-uTime*.2)*.5+.5;
            vec3 col=vec3(.04,.06,.12)+vec3(.18,.2,.5)*a*.4+vec3(.45,.22,.14)*b*.16;
            float vig=smoothstep(1.2,.25,length(uv-.5));
            gl_FragColor=vec4(col*vig,.65);
        }`,
    transparent: true, depthWrite: false,
});
const aurora = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), auroraMat);
aurora.position.z = -6;
scene.add(aurora);

// Stage ring
const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.62, 64),
    new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = -1.25;
scene.add(ring);

const pCount = lowPower ? 35 : 80;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
}
const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3)),
    new THREE.PointsMaterial({ color: 0xffb088, size: 0.028, transparent: true, opacity: 0.4 })
);
scene.add(particles);

// ─── iPhone 17 Pro (Cosmic Orange + camera plateau) ─────────────────
const alu = new THREE.MeshStandardMaterial({ color: 0xe07a45, metalness: 0.88, roughness: 0.2 });
const aluBright = new THREE.MeshStandardMaterial({ color: 0xf0a070, metalness: 0.92, roughness: 0.14 });
const aluDark = new THREE.MeshStandardMaterial({ color: 0xb85a30, metalness: 0.9, roughness: 0.18 });
const black = new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.7, roughness: 0.2 });
const lensMat = new THREE.MeshStandardMaterial({ color: 0x060608, metalness: 0.96, roughness: 0.04 });
const btnMat = new THREE.MeshStandardMaterial({ color: 0xc86a38, metalness: 0.9, roughness: 0.18 });

function makeLens(r, d = 0.02) {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d, 28), aluBright);
    outer.rotation.x = Math.PI / 2;
    g.add(outer);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, d + 0.004, 28), lensMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.z = -0.002;
    g.add(glass);
    return g;
}

function makeIPhone17Pro() {
    const g = new THREE.Group();
    const W = 0.76, H = 1.62, D = 0.086, R = 0.048;

    g.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, R), alu));
    const edge = new THREE.Mesh(new RoundedBoxGeometry(W + 0.003, H + 0.003, D - 0.018, 2, R), aluBright);
    g.add(edge);

    // MagSafe glass cutout (lower back)
    const backGlass = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.05, H * 0.4, 0.004, 2, 0.03),
        black
    );
    backGlass.position.set(0, -H * 0.22, -D / 2 - 0.001);
    g.add(backGlass);

    // Buttons
    const action = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.048, 0.028, 1, 0.002), btnMat);
    action.position.set(W / 2 + 0.002, 0.34, 0);
    g.add(action);
    const pwr = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.088, 0.026, 1, 0.002), btnMat);
    pwr.position.set(-W / 2 - 0.002, 0.2, 0);
    g.add(pwr);
    [0.05, -0.09].forEach((y) => {
        const v = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.05, 0.026, 1, 0.002), btnMat);
        v.position.set(-W / 2 - 0.002, y, 0);
        g.add(v);
    });

    // USB-C
    const port = new THREE.Mesh(
        new RoundedBoxGeometry(0.1, 0.008, 0.018, 1, 0.002),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.35 })
    );
    port.position.set(0, -H / 2 + 0.016, 0);
    g.add(port);

    // Camera plateau — full width
    const plateau = new THREE.Group();
    plateau.position.set(0, H / 2 - 0.18, -D / 2 - 0.014);
    plateau.add(new THREE.Mesh(new RoundedBoxGeometry(W - 0.02, 0.34, 0.034, 3, 0.055), aluDark));
    const top = new THREE.Mesh(new RoundedBoxGeometry(W - 0.04, 0.3, 0.008, 2, 0.045), alu);
    top.position.z = -0.018;
    plateau.add(top);

    const l1 = makeLens(0.058, 0.022); l1.position.set(-0.21, 0.05, -0.024); plateau.add(l1);
    const l2 = makeLens(0.058, 0.022); l2.position.set(-0.07, 0.05, -0.024); plateau.add(l2);
    const l3 = makeLens(0.065, 0.026); l3.position.set(-0.14, -0.07, -0.026); plateau.add(l3);

    const flash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0xfff6e8, emissive: 0xffaa66, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.2 })
    );
    flash.rotation.x = Math.PI / 2;
    flash.position.set(0.21, 0.05, -0.024);
    plateau.add(flash);

    const lidar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16),
        new THREE.MeshStandardMaterial({ color: 0x111114, metalness: 0.85, roughness: 0.2 })
    );
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(0.21, -0.065, -0.024);
    plateau.add(lidar);
    g.add(plateau);

    // Front bezel (hole for CSS3D screen — use dark plane behind HTML)
    const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - 0.014, H - 0.014, D - 0.01, 3, 0.04), black);
    bezel.position.z = 0.003;
    g.add(bezel);

    // Black screen backing (HTML sits slightly in front)
    const screenBack = new THREE.Mesh(
        new RoundedBoxGeometry(SCREEN_WORLD_W, 1.48, 0.002, 3, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x0b0d18 })
    );
    screenBack.position.z = D / 2 - 0.002;
    g.add(screenBack);

    // Dynamic Island (WebGL, in front of CSS3D slightly via position)
    const island = new THREE.Mesh(
        new RoundedBoxGeometry(0.24, 0.03, 0.004, 2, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.85, roughness: 0.1 })
    );
    island.position.set(0, H / 2 - 0.072, D / 2 + 0.006);
    g.add(island);

    g.userData.D = D;
    g.userData.H = H;
    return g;
}

const phone = makeIPhone17Pro();
phone.position.set(0, 0, 0);
phone.rotation.set(0.12, -0.35, 0.04);
scene.add(phone);

// CSS3D — real HTML site glued to screen (drei Html equivalent)
const phoneRoot = document.getElementById('phone-html-root');
const phoneSite = document.getElementById('phone-site');
const phoneViewport = document.getElementById('phone-viewport');
const cssObject = new CSS3DObject(phoneRoot);
const cssScale = SCREEN_WORLD_W / PHONE_CSS_W;
cssObject.scale.set(cssScale, cssScale, cssScale);
cssObject.position.set(0, 0.01, phone.userData.D / 2 + 0.001);
phone.add(cssObject);
phoneRoot.style.left = '0';
phoneRoot.style.top = '0';
phoneRoot.style.position = 'absolute';

// ─── State ──────────────────────────────────────────────────────────
const scroll = { p: 0 };
const view = { index: 0, name: 'hero' };
const views = ['hero', 'about', 'services', 'contact'];
const sectionEls = {
    hero: document.getElementById('ps-hero'),
    about: document.getElementById('ps-about'),
    services: document.getElementById('ps-services'),
    contact: document.getElementById('ps-contact'),
};

const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function scrollPhoneTo(name, smooth = true) {
    const el = sectionEls[name];
    if (!el || !phoneSite) return;
    view.name = name;
    view.index = Math.max(0, views.indexOf(name));
    const y = el.offsetTop - 8;
    if (smooth) {
        gsap.to(phoneSite, { y: -y, duration: 0.7, ease: 'power3.out' });
    } else {
        gsap.set(phoneSite, { y: -y });
    }
    document.querySelectorAll('[data-screen]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.screen === name);
    });
    document.querySelectorAll('.dash-section-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.screen === name);
    });
}

function goStage(name) {
    const stage = document.getElementById(`stage-${name}`);
    if (stage) lenis.scrollTo(stage, { duration: 1.1 });
    scrollPhoneTo(name);
    document.getElementById('dash-mobile')?.classList.remove('open');
}

document.querySelectorAll('[data-screen]').forEach((btn) => {
    btn.addEventListener('click', () => goStage(btn.dataset.screen));
});
document.getElementById('dash-toggle')?.addEventListener('click', () => {
    document.getElementById('dash-mobile')?.classList.toggle('open');
});

// Initial
scrollPhoneTo('hero', false);

// Camera / phone scroll path
const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, 0.2, 6.2),
    new THREE.Vector3(-0.9, 0.35, 4.8),
    new THREE.Vector3(0.6, -0.1, 5.2),
    new THREE.Vector3(0.1, 0.15, 3.6),
]);

const clock = new THREE.Clock();
let tick = 0;

function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    tick++;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    auroraMat.uniforms.uTime.value = t;
    auroraMat.uniforms.uScroll.value = scroll.p;
    auroraMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    const p = scroll.p;
    const cp = camPath.getPoint(Math.min(p * 1.02, 0.99));
    camera.position.lerp(new THREE.Vector3(
        cp.x + mouse.x * 0.2,
        cp.y - mouse.y * 0.12,
        cp.z
    ), 0.08);

    // Phone tumble + zoom feel
    const targetY = -0.35 + p * Math.PI * 1.55;
    const targetX = 0.12 + p * 0.35;
    const targetZ = 0.04 + Math.sin(p * Math.PI) * 0.1;
    phone.rotation.x += (targetX - phone.rotation.x) * 0.1;
    phone.rotation.y += (targetY - phone.rotation.y) * 0.1;
    phone.rotation.z += (targetZ - phone.rotation.z) * 0.1;
    phone.position.y = Math.sin(t * 1.1) * 0.03 - p * 0.08;

    ring.position.x = phone.position.x;
    ring.rotation.z = t * 0.08;

    camera.lookAt(phone.position.x * 0.4, phone.position.y * 0.2, 0);

    // Hide HTML screen when phone back faces camera (CSS3D has no depth occlusion)
    const worldQuat = new THREE.Quaternion();
    phone.getWorldQuaternion(worldQuat);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuat);
    const toCam = new THREE.Vector3().subVectors(camera.position, phone.position).normalize();
    const facing = forward.dot(toCam);
    phoneRoot.style.opacity = facing > 0.15 ? '1' : '0';
    phoneRoot.style.transition = 'opacity .2s linear';

    if (tick % 4 === 0) particles.rotation.y = t * 0.015;

    if (lowPower && tick % 2) {
        // still need CSS3D sync every other frame
    }
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    cssRenderer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── GSAP scroll stages ─────────────────────────────────────────────
const bar = document.querySelector('.scroll-progress-bar');

ScrollTrigger.create({
    trigger: '#scroll-stage',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
        scroll.p = self.progress;
        if (bar) bar.style.width = `${self.progress * 100}%`;

        // Sync phone site content with overall progress
        const idx = Math.min(3, Math.floor(self.progress * 3.999));
        const name = views[idx];
        if (name !== view.name) scrollPhoneTo(name, true);
    },
});

views.forEach((name) => {
    ScrollTrigger.create({
        trigger: `#stage-${name}`,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => scrollPhoneTo(name, true),
        onEnterBack: () => scrollPhoneTo(name, true),
    });
});

gsap.timeline({ delay: 0.15 })
    .from('.dash-nav', { y: -30, opacity: 0, duration: 0.6, ease: 'power3.out' })
    .from('.dash-side-left', { x: -40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.35')
    .from('.dash-side-right', { x: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.55')
    .from('.dash-hint', { opacity: 0, duration: 0.4 }, '-=0.3');

gsap.to('.scroll-line', {
    scaleY: 0.35, transformOrigin: 'top', duration: 1.15, repeat: -1, yoyo: true, ease: 'power1.inOut',
});

// Fade hint after first scroll
ScrollTrigger.create({
    start: 120,
    onUpdate: (self) => {
        const hint = document.querySelector('.dash-hint');
        if (hint) hint.style.opacity = self.scroll() > 120 ? '0' : '1';
    },
});
