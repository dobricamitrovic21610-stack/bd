import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const NAV_OFFSET = 90;
const isMobile = window.innerWidth < 768;
let visible = true;

// ─── Lenis ──────────────────────────────────────────────────────────
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Canvas 3D Scene ────────────────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 0, 7);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1 : 1.3));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(innerWidth, innerHeight);
cssRenderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1';
document.body.appendChild(cssRenderer.domElement);

scene.add(new THREE.HemisphereLight(0x99aaff, 0x0a0c18, 0.55));
scene.add(new THREE.AmbientLight(0x8899cc, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 6, 8);
scene.add(key);
const rim = new THREE.DirectionalLight(0x6688ff, 1.1);
rim.position.set(-6, 1, -4);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xaabbff, 0.5);
fill.position.set(0, -2, 5);
scene.add(fill);
const phoneLight = new THREE.PointLight(0x4466ff, 1.8, 12);
phoneLight.position.set(2, 1, 3);
scene.add(phoneLight);

// Aurora shader pozadina u canvasu
const auroraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) } },
    vertexShader: `
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: `
        varying vec2 vUv;
        uniform float uTime, uScroll;
        uniform vec2 uMouse;
        void main(){
            vec2 uv = vUv;
            vec2 m = uMouse * 0.08;
            float w1 = sin(uv.x * 4.0 + uTime * 0.35 + uScroll * 3.0 + m.x) * 0.5 + 0.5;
            float w2 = sin(uv.y * 3.0 - uTime * 0.25 + m.y) * 0.5 + 0.5;
            float w3 = sin((uv.x + uv.y) * 2.5 + uTime * 0.15) * 0.5 + 0.5;
            vec3 base = vec3(0.06, 0.08, 0.18);
            vec3 blue = vec3(0.18, 0.28, 0.72) * w1 * 0.55;
            vec3 purple = vec3(0.42, 0.22, 0.62) * w2 * 0.35;
            vec3 warm = vec3(0.55, 0.35, 0.22) * w3 * 0.12;
            float vig = smoothstep(1.2, 0.2, length(uv - 0.5));
            gl_FragColor = vec4((base + blue + purple + warm) * vig, 0.72);
        }`,
    depthWrite: false,
    transparent: true,
});
const aurora = new THREE.Mesh(new THREE.PlaneGeometry(32, 22), auroraMat);
aurora.position.z = -8;
aurora.renderOrder = -1;
scene.add(aurora);

// Čestice
const pCount = isMobile ? 60 : 120;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
}
const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3)),
    new THREE.PointsMaterial({ color: 0x8899ff, size: 0.04, transparent: true, opacity: 0.5, sizeAttenuation: true })
);
scene.add(particles);

// Telefoni — realističan model
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e323c, metalness: 0.93, roughness: 0.08 });
const btnMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.85, roughness: 0.15 });
const SW = 300, SH = 640;

function makePhone(scale, detail) {
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    const W = 0.74, H = 1.54, D = 0.088, R = 0.052, seg = detail ? 4 : 2;

    const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, seg, R), bodyMat);
    g.add(body);

    if (detail) {
        // Bočne tipke
        const pwr = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.1, 0.025, 1, 0.003), btnMat);
        pwr.position.set(W / 2 + 0.002, 0.15, 0);
        g.add(pwr);
        [-0.12, 0.02].forEach((y) => {
            const vol = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.06, 0.025, 1, 0.003), btnMat);
            vol.position.set(-W / 2 - 0.002, y, 0);
            g.add(vol);
        });

        // Kamera modul (pozadina)
        const camGrp = new THREE.Group();
        camGrp.position.set(-0.18, H / 2 - 0.22, -D / 2 - 0.008);
        const bump = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.32, 0.018, 2, 0.04), bodyMat);
        camGrp.add(bump);
        [[-0.08, 0.08], [0.08, 0.08], [0, -0.08]].forEach(([x, y], i) => {
            const lens = new THREE.Mesh(
                new THREE.CylinderGeometry(i === 2 ? 0.045 : 0.038, 0.038, 0.012, 16),
                new THREE.MeshStandardMaterial({ color: 0x0a0c14, metalness: 0.9, roughness: 0.05 })
            );
            lens.rotation.x = Math.PI / 2;
            lens.position.set(x, y, -0.012);
            camGrp.add(lens);
        });
        g.add(camGrp);

        // Bezel
        const bezel = new THREE.Mesh(
            new RoundedBoxGeometry(W - 0.025, H - 0.025, D - 0.015, 3, 0.038),
            new THREE.MeshStandardMaterial({ color: 0x08090e, metalness: 0.4, roughness: 0.5 })
        );
        bezel.position.z = 0.004;
        g.add(bezel);

        // Ekran — CSS3D live sajt
        const screenW = W - 0.075, screenH = H - 0.115;
        const screenPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(screenW, screenH),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
        );
        screenPlane.position.z = D / 2 - 0.001;
        g.add(screenPlane);
        g.userData.screenPlane = screenPlane;
        g.userData.screenW = screenW;
        g.userData.screenH = screenH;

        // Dynamic Island
        const island = new THREE.Mesh(
            new RoundedBoxGeometry(0.2, 0.032, 0.006, 2, 0.01),
            new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.6, roughness: 0.2 })
        );
        island.position.set(0, H / 2 - 0.1, D / 2 + 0.002);
        g.add(island);

        // Stakleni overlay — suptilan
        const glass = new THREE.Mesh(
            new RoundedBoxGeometry(W - 0.07, H - 0.11, 0.002, 3, 0.01),
            new THREE.MeshPhysicalMaterial({
                color: 0xffffff, metalness: 0, roughness: 0.02,
                transmission: 0.85, thickness: 0.2, transparent: true, opacity: 0.08,
            })
        );
        glass.position.z = D / 2 + 0.004;
        g.add(glass);

        g.userData.screen = screenPlane;
    } else {
        const sm = new THREE.MeshStandardMaterial({ color: 0x101828, emissive: 0x334466, emissiveIntensity: 0.8, metalness: 0.1, roughness: 0.15 });
        const scr = new THREE.Mesh(new RoundedBoxGeometry(W - 0.08, H - 0.1, 0.005, seg, 0.012), sm);
        scr.position.z = D / 2 - 0.004;
        g.add(scr);
        g.userData.sm = sm;
    }
    return g;
}

const world = new THREE.Group();
scene.add(world);

const mainPhone = makePhone(1, true);
world.add(mainPhone);

// Live HTML ekran na telefonu
const screenEl = document.createElement('div');
screenEl.className = 'phone-screen-live';
const screenInner = document.createElement('div');
screenInner.className = 'phone-screen-inner';
screenEl.appendChild(screenInner);

function buildPhoneScreen() {
    const src = document.querySelector('.scroll-container');
    if (!src) return;
    const clone = src.cloneNode(true);
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('iframe').forEach((f) => f.remove());
    clone.style.width = `${SW}px`;
    clone.querySelectorAll('.section').forEach((s) => { s.style.minHeight = 'auto'; });
    screenInner.innerHTML = '';
    screenInner.appendChild(clone);
}

buildPhoneScreen();

const cssScreen = new CSS3DObject(screenEl);
const screenScale = (mainPhone.userData.screenW || 0.665) / SW;
cssScreen.scale.set(screenScale, screenScale, 1);
cssScreen.position.z = 0.043;
mainPhone.add(cssScreen);

const sats = [];
[0xcc5566, 0x55aa88, 0x7788dd].forEach((c, i) => {
    const p = makePhone(0.28, false);
    p.userData.a = (i / 3) * Math.PI * 2;
    if (p.userData.sm) p.userData.sm.emissive.setHex(c);
    world.add(p);
    sats.push(p);
});

// Orbital prstenovi — Opus stil
const rings = [];
[2.2, 2.8, 3.4].forEach((r, i) => {
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.004, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0x6e8cff, transparent: true, opacity: 0.12 - i * 0.03 })
    );
    ring.rotation.x = Math.PI / 2 + i * 0.15;
    world.add(ring);
    rings.push(ring);
});

// Kamera putanja
const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, 0, 7),
    new THREE.Vector3(-1.5, 0.5, 5.5),
    new THREE.Vector3(0.5, -0.3, 6),
    new THREE.Vector3(1.8, 0, 8),
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
function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    auroraMat.uniforms.uTime.value = t;
    auroraMat.uniforms.uScroll.value = scroll.p;
    auroraMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    const camT = Math.min(scroll.p * 1.05, 0.99);
    const cp = camPath.getPoint(camT);
    camera.position.lerp(new THREE.Vector3(cp.x + mouse.x * 0.2, cp.y - mouse.y * 0.15, cp.z), 0.06);

    const hx = THREE.MathUtils.lerp(1.6, 0.5, scroll.hero);
    const hy = THREE.MathUtils.lerp(0, -0.2, scroll.p);
    const hry = THREE.MathUtils.lerp(-0.4, 0.3, scroll.hero) + scroll.hero * Math.PI * 2 + scroll.p * 3;

    mainPhone.position.lerp(new THREE.Vector3(hx, hy, 0), 0.07);
    mainPhone.rotation.x = THREE.MathUtils.lerp(mainPhone.rotation.x, 0.12 + scroll.p * 0.25, 0.07);
    mainPhone.rotation.y = THREE.MathUtils.lerp(mainPhone.rotation.y, hry, 0.07);
    phoneLight.position.lerp(new THREE.Vector3(mainPhone.position.x + 0.5, mainPhone.position.y + 0.3, 2), 0.08);

    camera.lookAt(mainPhone.position.x * 0.4, mainPhone.position.y * 0.3, 0);

    const orbitR = 2.8 + scroll.p;
    sats.forEach((p, i) => {
        const a = p.userData.a + t * 0.2;
        p.position.set(
            mainPhone.position.x + Math.cos(a) * orbitR,
            mainPhone.position.y + Math.sin(t * 0.4 + i) * 0.3,
            Math.sin(a) * orbitR * 0.3
        );
        p.rotation.y = a;
    });

    rings.forEach((ring, i) => {
        ring.position.copy(mainPhone.position);
        ring.rotation.z = t * (0.08 + i * 0.03) + scroll.p * 0.5;
    });

    particles.rotation.y = t * 0.02;

    const sy = lenis?.scroll ?? window.scrollY;
    screenInner.style.transform = `translateY(${-sy * 0.48}px)`;

    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
animate();

lenis.on('scroll', () => {
    const sy = lenis.scroll;
    screenInner.style.transform = `translateY(${-sy * 0.48}px)`;
});

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    cssRenderer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── Split text — po rečima ─────────────────────────────────────────
document.querySelectorAll('[data-split]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(' ').map((word) =>
        `<span class="word">${word}</span>`
    ).join(' ');
});

// ─── Navigacija ─────────────────────────────────────────────────────
function scrollTo(hash) {
    const el = document.querySelector(hash);
    if (el) lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.2 });
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

// ─── GSAP Scroll — Opus stil ────────────────────────────────────────
const bar = document.querySelector('.scroll-progress-bar');
const nav = document.getElementById('nav');

ScrollTrigger.create({
    trigger: '.scroll-container', start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => { scroll.p = s.progress; bar.style.width = `${s.progress * 100}%`; },
});

ScrollTrigger.create({ start: 60, onUpdate: (s) => nav?.classList.toggle('scrolled', s.scroll() > 60) });

// Hero pinned scrub (jedini pin — performantnije)
gsap.timeline({ delay: 0.15 })
    .from('.label', { opacity: 0, y: 20, duration: 0.6 })
    .from('.hero-title .word', { opacity: 0, y: 40, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, '-=0.3')
    .from('.hero-desc', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
    .from('.hero-actions', { opacity: 0, y: 15, duration: 0.4 }, '-=0.1');

gsap.timeline({
    scrollTrigger: {
        trigger: '.section-hero', start: 'top top', end: '+=100%',
        pin: true, scrub: 0.5, anticipatePin: 1,
        onUpdate: (s) => { scroll.hero = s.progress; },
    },
}).to('.hero-content', { y: -60, opacity: 0.15, filter: 'blur(6px)', ease: 'power2.in' }, 0.5);

// Liquid glass — sekcije dolaze i odlaze
document.querySelectorAll('[data-glass]').forEach((panel) => {
    const section = panel.closest('.section');
    if (!section || section.id === 'hero') return;

    gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 92%',
            end: 'bottom 8%',
            scrub: 0.8,
        },
    })
        .fromTo(panel,
            { y: 100, opacity: 0, scale: 0.9, filter: 'blur(20px)' },
            { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'none', duration: 0.45 },
            0
        )
        .to(panel,
            { y: -70, opacity: 0.25, scale: 1.03, filter: 'blur(12px)', ease: 'none', duration: 0.55 },
            0.45
        );
});

// Service kartice — stagger liquid ulazak
gsap.utils.toArray('.service-card').forEach((card, i) => {
    gsap.fromTo(card,
        { y: 60, opacity: 0, scale: 0.92, filter: 'blur(10px)' },
        {
            scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
            y: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
            duration: 0.7, delay: (i % 3) * 0.08, ease: 'power3.out',
        }
    );
});

// Kontakt kartice
gsap.utils.toArray('.contact-card, .map-wrap').forEach((el, i) => {
    gsap.fromTo(el,
        { x: i % 2 ? 40 : -40, opacity: 0, filter: 'blur(8px)' },
        {
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
            x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out',
        }
    );
});

gsap.to('.scroll-line', { scaleY: 0.4, transformOrigin: 'top', duration: 1.2, repeat: -1, yoyo: true, ease: 'power1.inOut' });

['.section-about', '.section-services', '.section-contact'].forEach((sel) => {
    gsap.from(`${sel} .section-head, ${sel} .display-title, ${sel} .body-text`, {
        scrollTrigger: { trigger: sel, start: 'top 78%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 30, duration: 0.6, stagger: 0.08, ease: 'power3.out',
    });
});

ScrollTrigger.create({
    trigger: '.stats-row', start: 'top 85%', once: true,
    onEnter: () => {
        gsap.from('.stat', { opacity: 0, y: 20, stagger: 0.1, duration: 0.5 });
        document.querySelectorAll('.stat-num').forEach((el) => {
            const n = parseInt(el.dataset.count, 10);
            gsap.to({ v: 0 }, { v: n, duration: 1.5, ease: 'power2.out',
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
