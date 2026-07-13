import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
renderer.toneMappingExposure = 1.3;

scene.add(new THREE.HemisphereLight(0xb0c0ff, 0x060810, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(3, 7, 7);
scene.add(key);
const rim = new THREE.DirectionalLight(0x7799ff, 0.7);
rim.position.set(-5, 2, -3);
scene.add(rim);
const phoneLight = new THREE.PointLight(0x99aaff, 2, 14);
phoneLight.position.set(2, 1, 3);
scene.add(phoneLight);
const frontLight = new THREE.DirectionalLight(0xffffff, 0.9);
frontLight.position.set(0, 2, 8);
scene.add(frontLight);

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

// ─── iPhone 17 Pro — Natural Titanium ───────────────────────────────
const titanium = new THREE.MeshStandardMaterial({ color: 0xa9a49c, metalness: 0.98, roughness: 0.1 });
const titaniumEdge = new THREE.MeshStandardMaterial({ color: 0xc8c2ba, metalness: 0.99, roughness: 0.06 });
const titaniumDark = new THREE.MeshStandardMaterial({ color: 0x6e6a64, metalness: 0.96, roughness: 0.14 });
const btnMat = new THREE.MeshStandardMaterial({ color: 0x7a756e, metalness: 0.92, roughness: 0.18 });
const lensMat = new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.97, roughness: 0.03 });
const blackBezel = new THREE.MeshStandardMaterial({ color: 0x020203, metalness: 0.3, roughness: 0.5 });

const screenCanvas = document.createElement('canvas');
screenCanvas.width = 520;
screenCanvas.height = 1120;
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.minFilter = THREE.LinearFilter;
screenCanvas.getContext('2d').fillStyle = '#0b0d18';
screenCanvas.getContext('2d').fillRect(0, 0, screenCanvas.width, screenCanvas.height);

function makeIPhone17Pro() {
    const g = new THREE.Group();
    const W = 0.73, H = 1.57, D = 0.076, R = 0.042;

    g.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, R), titanium));

    const edgeFront = new THREE.Mesh(new RoundedBoxGeometry(W + 0.002, H + 0.002, D - 0.01, 2, R), titaniumEdge);
    edgeFront.position.z = 0.002;
    g.add(edgeFront);

    const action = new THREE.Mesh(new RoundedBoxGeometry(0.006, 0.048, 0.028, 1, 0.002), btnMat);
    action.position.set(W / 2 + 0.001, 0.32, 0);
    g.add(action);

    const pwr = new THREE.Mesh(new RoundedBoxGeometry(0.006, 0.085, 0.026, 1, 0.002), btnMat);
    pwr.position.set(-W / 2 - 0.001, 0.18, 0);
    g.add(pwr);
    [0.04, -0.1].forEach((y) => {
        const v = new THREE.Mesh(new RoundedBoxGeometry(0.006, 0.05, 0.026, 1, 0.002), btnMat);
        v.position.set(-W / 2 - 0.001, y, 0);
        g.add(v);
    });

    const usbc = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.006, 0.018, 1, 0.002), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 }));
    usbc.position.set(0, -H / 2 + 0.02, D / 2 - 0.01);
    g.add(usbc);

    const camGrp = new THREE.Group();
    camGrp.position.set(0, H / 2 - 0.17, -D / 2 - 0.005);
    camGrp.add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.24, 0.024, 3, 0.05), titaniumDark));
    const plateauRim = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.22, 0.006, 2, 0.04), new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.7, roughness: 0.25 }));
    plateauRim.position.z = -0.014;
    camGrp.add(plateauRim);

    [
        { x: -0.13, y: 0.04, r: 0.05, peri: false },
        { x: 0.13, y: 0.04, r: 0.05, peri: false },
        { x: 0, y: -0.05, r: 0.058, peri: true },
    ].forEach(({ x, y, r, peri }) => {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, peri ? 0.018 : 0.015, 24), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x, y, -0.02);
        camGrp.add(lens);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, 0.003, 8, 28), titanium);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y, -0.022);
        camGrp.add(ring);
    });
    const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 12), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 }));
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(0.17, -0.06, -0.017);
    camGrp.add(lidar);
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.007, 12), new THREE.MeshStandardMaterial({ color: 0xfffff0, emissive: 0x443322, emissiveIntensity: 0.4 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(-0.17, -0.06, -0.017);
    camGrp.add(flash);
    g.add(camGrp);

    const screenW = W - 0.048, screenH = H - 0.078;
    g.userData.screenW = screenW;

    const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - 0.012, H - 0.012, D - 0.01, 3, 0.038), blackBezel);
    bezel.position.z = 0.003;
    g.add(bezel);

    const screen = new THREE.Mesh(
        new RoundedBoxGeometry(screenW, screenH, 0.003, 4, 0.014),
        new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screen.position.z = D / 2 - 0.002;
    g.add(screen);

    const island = new THREE.Mesh(
        new RoundedBoxGeometry(0.24, 0.03, 0.004, 2, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.8, roughness: 0.1 })
    );
    island.position.set(0, H / 2 - 0.072, D / 2 + 0.001);
    g.add(island);

    const glass = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.02, H - 0.02, 0.001, 2, 0.035),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 })
    );
    glass.position.z = D / 2 + 0.002;
    g.add(glass);

    return g;
}

const world = new THREE.Group();
scene.add(world);

const mainPhone = makeIPhone17Pro();
world.add(mainPhone);

// Skriveni mirror → texture SAMO na ekranu telefona (bez duplog prikaza)
const captureViewport = document.getElementById('phone-capture-viewport');
const captureContent = document.getElementById('phone-capture-content');
let capturing = false;
let captureTimer = null;
let lastCapY = -1;

function buildCaptureMirror() {
    const src = document.querySelector('.scroll-container');
    if (!src || !captureContent) return;
    const clone = src.cloneNode(true);
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('iframe').forEach((f) => f.remove());
    clone.style.width = '260px';
    clone.querySelectorAll('a').forEach((a) => { a.setAttribute('tabindex', '-1'); });
    captureContent.setAttribute('aria-hidden', 'true');
    captureContent.innerHTML = '';
    captureContent.appendChild(clone);
}

async function updateScreenTexture() {
    if (capturing || !captureViewport) return;
    const sy = Math.round(lenis.scroll);
    if (Math.abs(sy - lastCapY) < 15 && lastCapY >= 0) return;

    capturing = true;
    captureContent.style.transform = `translateY(${-sy * 0.46}px)`;

    const ctx = screenCanvas.getContext('2d');
    const w = screenCanvas.width, h = screenCanvas.height;

    if (typeof html2canvas !== 'undefined') {
        try {
            const shot = await html2canvas(captureViewport, {
                width: 260, height: 562, scale: lowPower ? 1 : 1.5,
                backgroundColor: '#0b0d18', logging: false, useCORS: true,
            });
            ctx.drawImage(shot, 0, 0, w, h);
            screenTex.needsUpdate = true;
            lastCapY = sy;
            capturing = false;
            return;
        } catch (_) { /* fallback */ }
    }

    // Fallback — crta mini sajt na canvas
    ctx.fillStyle = '#0b0d18';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.65, h * 0.12, 0, w * 0.65, h * 0.12, w);
    g.addColorStop(0, 'rgba(110,140,255,0.3)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const off = sy * 0.55;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 90, 36 - off, 180, 26, 13);
    ctx.fill();
    ctx.fillStyle = '#e8eeff';
    ctx.font = 'bold 34px Syne, sans-serif';
    ctx.fillText('Vaš telefon', 36, 120 - off);
    ctx.fillStyle = '#c4a8ff';
    ctx.font = 'bold 26px Syne, sans-serif';
    ctx.fillText('u sigurnim rukama.', 36, 162 - off);
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText('B & D Mobile — Loznica', 36, 210 - off);
    screenTex.needsUpdate = true;
    lastCapY = sy;
    capturing = false;
}

function scheduleCapture() {
    clearTimeout(captureTimer);
    captureTimer = setTimeout(updateScreenTexture, lowPower ? 200 : 120);
}

buildCaptureMirror();
updateScreenTexture();
window.addEventListener('load', () => setTimeout(updateScreenTexture, 400));
lenis.on('scroll', scheduleCapture);

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

// ─── Animacija ──────────────────────────────────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const clock = new THREE.Clock();
let tick = 0;

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
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    lastCapY = -1;
    scheduleCapture();
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
