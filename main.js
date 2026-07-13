import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const NAV_OFFSET = 90;
const isMobile = window.innerWidth < 768;
const lowPower = isMobile || navigator.hardwareConcurrency <= 4;
let visible = true;

// ─── Lenis (lakši na slabijim uređajima) ────────────────────────────
const lenis = new Lenis({ lerp: lowPower ? 0.14 : 0.1, smoothWheel: !lowPower });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Canvas 3D Scene ────────────────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0.3, 0, 7.2);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.15));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

let cssRenderer = null;
if (!lowPower) {
    cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(innerWidth, innerHeight);
    cssRenderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1';
    document.body.appendChild(cssRenderer.domElement);
}

scene.add(new THREE.HemisphereLight(0xaabbff, 0x080a14, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(3, 7, 7);
scene.add(key);
const rim = new THREE.DirectionalLight(0x7799ff, 0.7);
rim.position.set(-5, 2, -3);
scene.add(rim);
const phoneLight = new THREE.PointLight(0x6688ff, 1.2, 14);
phoneLight.position.set(2, 1, 3);
scene.add(phoneLight);

// Aurora + Opus pozadina
const auroraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
        varying vec2 vUv;
        uniform float uTime,uScroll; uniform vec2 uMouse;
        void main(){
            vec2 uv=vUv; vec2 m=uMouse*0.06;
            float w1=sin(uv.x*3.5+uTime*0.28+uScroll*2.5+m.x)*.5+.5;
            float w2=sin(uv.y*2.8-uTime*0.2+m.y)*.5+.5;
            vec3 base=vec3(0.05,0.07,0.16);
            vec3 blue=vec3(0.14,0.22,0.58)*w1*0.45;
            vec3 purple=vec3(0.35,0.18,0.52)*w2*0.28;
            float vig=smoothstep(1.15,0.25,length(uv-0.5));
            gl_FragColor=vec4((base+blue+purple)*vig,0.68);
        }`,
    depthWrite: false, transparent: true,
});
const aurora = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), auroraMat);
aurora.position.z = -8;
aurora.renderOrder = -1;
scene.add(aurora);

// Opus podijum — mekano svetlo ispod telefona
const podium = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 48),
    new THREE.MeshBasicMaterial({ color: 0x4466ff, transparent: true, opacity: 0.06 })
);
podium.rotation.x = -Math.PI / 2;
podium.position.set(1.2, -1.1, -0.5);
scene.add(podium);

const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 1.85, 64),
    new THREE.MeshBasicMaterial({ color: 0x8899ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.set(1.2, -1.08, -0.3);
scene.add(glowRing);

// Čestice — smanjeno
const pCount = lowPower ? 25 : 50;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
}
const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3)),
    new THREE.PointsMaterial({ color: 0x8899ff, size: 0.035, transparent: true, opacity: 0.4, sizeAttenuation: true })
);
scene.add(particles);

// ─── iPhone 17 Pro model ────────────────────────────────────────────
const titanium = new THREE.MeshStandardMaterial({ color: 0x8e8983, metalness: 0.97, roughness: 0.12 });
const titaniumDark = new THREE.MeshStandardMaterial({ color: 0x5c5854, metalness: 0.95, roughness: 0.18 });
const btnMat = new THREE.MeshStandardMaterial({ color: 0x6a6660, metalness: 0.9, roughness: 0.2 });
const lensMat = new THREE.MeshStandardMaterial({ color: 0x080a10, metalness: 0.95, roughness: 0.04 });
const SW = 280, SH = 606;

function makeIPhone17Pro() {
    const g = new THREE.Group();
    const W = 0.76, H = 1.58, D = 0.082, R = 0.058;

    // Titanium body — ravne ivice
    g.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, R), titanium));

    // Action button (desno)
    const action = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.055, 0.03, 1, 0.003), btnMat);
    action.position.set(W / 2 + 0.001, 0.28, 0);
    g.add(action);

    // Power + volume (levo)
    const pwr = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.09, 0.028, 1, 0.003), btnMat);
    pwr.position.set(-W / 2 - 0.001, 0.2, 0);
    g.add(pwr);
    [0.05, -0.08].forEach((y) => {
        const v = new THREE.Mesh(new RoundedBoxGeometry(0.007, 0.055, 0.028, 1, 0.003), btnMat);
        v.position.set(-W / 2 - 0.001, y, 0);
        g.add(v);
    });

    // Camera plateau — iPhone 17 Pro veliki modul
    const camGrp = new THREE.Group();
    camGrp.position.set(-0.14, H / 2 - 0.2, -D / 2 - 0.006);
    const plateau = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.42, 0.022, 3, 0.06), titaniumDark);
    camGrp.add(plateau);
    const plateauGlass = new THREE.Mesh(
        new RoundedBoxGeometry(0.38, 0.38, 0.004, 2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.6, roughness: 0.3 })
    );
    plateauGlass.position.z = -0.012;
    camGrp.add(plateauGlass);
    // 3 sočiva + LiDAR
    [[-0.1, 0.1], [0.1, 0.1], [0, -0.1]].forEach(([x, y], i) => {
        const r = i === 2 ? 0.052 : 0.048;
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.95, 0.014, 20), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x, y, -0.018);
        camGrp.add(lens);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.85, 0.003, 8, 24), titanium);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y, -0.02);
        camGrp.add(ring);
    });
    // Flash
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12), new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0x332211, emissiveIntensity: 0.3 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(0.14, 0.12, -0.016);
    camGrp.add(flash);
    g.add(camGrp);

    // Bezel — ultra tanki
    const bezel = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.018, H - 0.018, D - 0.012, 3, 0.048),
        new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.5, roughness: 0.4 })
    );
    bezel.position.z = 0.003;
    g.add(bezel);

    const screenW = W - 0.055, screenH = H - 0.09;
    g.userData.screenW = screenW;
    g.userData.screenH = screenH;

    // Dynamic Island — širi pill
    const island = new THREE.Mesh(
        new RoundedBoxGeometry(0.22, 0.034, 0.005, 2, 0.012),
        new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.7, roughness: 0.15 })
    );
    island.position.set(0, H / 2 - 0.085, D / 2 + 0.001);
    g.add(island);

    // Staklo — bez MeshPhysical (perf)
    const glass = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.05, H - 0.085, 0.001, 2, 0.01),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 })
    );
    glass.position.z = D / 2 + 0.003;
    g.add(glass);

    return g;
}

const world = new THREE.Group();
scene.add(world);

const mainPhone = makeIPhone17Pro();
world.add(mainPhone);

// Live sajt na ekranu (CSS3D samo desktop)
let screenInner = null;
let cssScreen = null;

if (cssRenderer) {
    const screenEl = document.createElement('div');
    screenEl.className = 'phone-screen-live';
    screenInner = document.createElement('div');
    screenInner.className = 'phone-screen-inner';
    screenEl.appendChild(screenInner);

    const src = document.querySelector('.scroll-container');
    if (src) {
        const clone = src.cloneNode(true);
        clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
        clone.querySelectorAll('iframe').forEach((f) => f.remove());
        clone.style.width = `${SW}px`;
        clone.querySelectorAll('.section').forEach((s) => { s.style.minHeight = 'auto'; });
        screenInner.appendChild(clone);
    }

    cssScreen = new CSS3DObject(screenEl);
    const scale = mainPhone.userData.screenW / SW;
    cssScreen.scale.set(scale, scale, 1);
    cssScreen.position.z = 0.041;
    mainPhone.add(cssScreen);
} else {
    // Mobile fallback — emissive ekran
    const fb = new THREE.Mesh(
        new RoundedBoxGeometry(0.7, 1.48, 0.003, 2, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x0a1020, emissive: 0x334488, emissiveIntensity: 0.7, metalness: 0.1, roughness: 0.2 })
    );
    fb.position.z = 0.04;
    mainPhone.add(fb);
}

// 1 satelit umesto 3
if (!lowPower) {
    const sat = new THREE.Mesh(
        new RoundedBoxGeometry(0.18, 0.38, 0.04, 2, 0.02),
        titaniumDark
    );
    sat.userData.orbit = 0;
    world.add(sat);
    mainPhone.userData.sat = sat;
}

// 1 orbitalni prsten
const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.003, 6, 80),
    new THREE.MeshBasicMaterial({ color: 0x6e8cff, transparent: true, opacity: 0.1 })
);
orbitRing.rotation.x = Math.PI / 2;
world.add(orbitRing);

const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.4, 0.05, 7.2),
    new THREE.Vector3(-0.8, 0.35, 6),
    new THREE.Vector3(0.6, -0.15, 6.5),
    new THREE.Vector3(1.5, 0, 7.8),
]);

const scroll = { p: 0, hero: 0 };
let lastScreenY = -1;

// ─── Animacija (throttle render) ────────────────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const clock = new THREE.Clock();
let tick = 0;

function syncPhoneScreen() {
    if (!screenInner) return;
    const sy = Math.round(lenis.scroll);
    if (sy === lastScreenY) return;
    lastScreenY = sy;
    screenInner.style.transform = `translateY(${-sy * 0.46}px)`;
}

lenis.on('scroll', syncPhoneScreen);

function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    tick++;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    auroraMat.uniforms.uTime.value = t;
    auroraMat.uniforms.uScroll.value = scroll.p;
    auroraMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    const camT = Math.min(scroll.p * 1.02, 0.98);
    const cp = camPath.getPoint(camT);
    camera.position.lerp(new THREE.Vector3(cp.x + mouse.x * 0.15, cp.y - mouse.y * 0.1, cp.z), 0.05);

    const hx = THREE.MathUtils.lerp(1.45, 0.55, scroll.hero);
    const hy = THREE.MathUtils.lerp(0.05, -0.15, scroll.p);
    const hry = THREE.MathUtils.lerp(-0.35, 0.25, scroll.hero) + scroll.hero * Math.PI * 1.6 + scroll.p * 2.2;

    mainPhone.position.lerp(new THREE.Vector3(hx, hy, 0), 0.06);
    mainPhone.rotation.x = THREE.MathUtils.lerp(mainPhone.rotation.x, 0.08 + scroll.p * 0.18, 0.06);
    mainPhone.rotation.y = THREE.MathUtils.lerp(mainPhone.rotation.y, hry, 0.06);
    phoneLight.position.lerp(new THREE.Vector3(mainPhone.position.x + 0.4, mainPhone.position.y + 0.25, 2), 0.07);

    podium.position.x = mainPhone.position.x;
    glowRing.position.x = mainPhone.position.x;

    camera.lookAt(mainPhone.position.x * 0.35, mainPhone.position.y * 0.25, 0);

    const sat = mainPhone.userData.sat;
    if (sat) {
        const a = sat.userData.orbit + t * 0.15;
        sat.position.set(
            mainPhone.position.x + Math.cos(a) * 2.6,
            mainPhone.position.y + Math.sin(t * 0.3) * 0.2,
            Math.sin(a) * 0.5
        );
        sat.rotation.y = a;
    }

    orbitRing.position.copy(mainPhone.position);
    orbitRing.rotation.z = t * 0.06 + scroll.p * 0.3;

    if (tick % 3 === 0) particles.rotation.y = t * 0.015;

    // Render svaki 2. frame na slabijim mašinama
    if (lowPower && tick % 2 !== 0) return;

    renderer.render(scene, camera);
    if (cssRenderer) cssRenderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    cssRenderer?.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── Split text ─────────────────────────────────────────────────────
document.querySelectorAll('[data-split]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');
});

// ─── Navigacija ─────────────────────────────────────────────────────
function scrollTo(hash) {
    const el = document.querySelector(hash);
    if (el) lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.1 });
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const h = a.getAttribute('href');
        if (!h || h === '#') return;
        e.preventDefault();
        scrollTo(h);
        document.getElementById('nav-mobile')?.classList.remove('open');
    });
});
document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-mobile')?.classList.toggle('open');
});

// ─── GSAP Scroll — bez blur filtera (perf) ─────────────────────────
const bar = document.querySelector('.scroll-progress-bar');
const nav = document.getElementById('nav');

ScrollTrigger.create({
    trigger: '.scroll-container', start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => { scroll.p = s.progress; bar.style.width = `${s.progress * 100}%`; },
});
ScrollTrigger.create({ start: 60, onUpdate: (s) => nav?.classList.toggle('scrolled', s.scroll() > 60) });

gsap.timeline({ delay: 0.12 })
    .from('.label', { opacity: 0, y: 18, duration: 0.5 })
    .from('.hero-title .word', { opacity: 0, y: 35, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, '-=0.25')
    .from('.hero-desc', { opacity: 0, y: 18, duration: 0.45 }, '-=0.15')
    .from('.hero-actions', { opacity: 0, y: 12, duration: 0.35 }, '-=0.1');

gsap.timeline({
    scrollTrigger: {
        trigger: '.section-hero', start: 'top top', end: '+=70%',
        pin: true, scrub: 0.4, anticipatePin: 1,
        onUpdate: (s) => { scroll.hero = s.progress; },
    },
}).to('.hero-content', { y: -50, opacity: 0.12, ease: 'power2.in' }, 0.55);

document.querySelectorAll('[data-glass]').forEach((panel) => {
    const section = panel.closest('.section');
    if (!section || section.id === 'hero') return;
    gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 90%', end: 'bottom 10%', scrub: 0.6 },
    })
        .fromTo(panel, { y: 80, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, ease: 'none', duration: 0.5 }, 0)
        .to(panel, { y: -50, opacity: 0.3, scale: 1.02, ease: 'none', duration: 0.5 }, 0.5);
});

gsap.utils.toArray('.service-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 40, scale: 0.95, duration: 0.55, delay: (i % 3) * 0.06, ease: 'power2.out',
    });
});

gsap.utils.toArray('.contact-card, .map-wrap').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
        opacity: 0, x: i % 2 ? 25 : -25, duration: 0.5, ease: 'power2.out',
    });
});

gsap.to('.scroll-line', { scaleY: 0.4, transformOrigin: 'top', duration: 1.2, repeat: -1, yoyo: true, ease: 'power1.inOut' });

['.section-about', '.section-services', '.section-contact'].forEach((sel) => {
    gsap.from(`${sel} .section-head, ${sel} .display-title, ${sel} .body-text`, {
        scrollTrigger: { trigger: sel, start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 25, duration: 0.5, stagger: 0.07, ease: 'power3.out',
    });
});

ScrollTrigger.create({
    trigger: '.stats-row', start: 'top 85%', once: true,
    onEnter: () => {
        gsap.from('.stat', { opacity: 0, y: 18, stagger: 0.08, duration: 0.45 });
        document.querySelectorAll('.stat-num').forEach((el) => {
            const n = parseInt(el.dataset.count, 10);
            gsap.to({ v: 0 }, { v: n, duration: 1.2, ease: 'power2.out',
                onUpdate() { el.textContent = Math.round(this.targets()[0].v) + (n === 100 ? '%' : '+'); },
            });
        });
    },
});

['hero', 'about', 'services', 'contact'].forEach((id) => {
    ScrollTrigger.create({
        trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
        onEnter: () => setNav(id), onEnterBack: () => setNav(id),
    });
});

function setNav(id) {
    document.querySelectorAll('.nav-link, .nav-mobile-link').forEach((l) => {
        l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
    });
}
