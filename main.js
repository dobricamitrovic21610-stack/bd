import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const NAV_OFFSET = 80;
const isMobile = window.innerWidth < 768;
const lowPower = isMobile || (navigator.hardwareConcurrency || 8) <= 4;
let visible = true;

// ─── Lenis ──────────────────────────────────────────────────────────
const lenis = new Lenis({ lerp: lowPower ? 0.14 : 0.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Three.js tech shop scene ───────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 9);

const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: !lowPower, powerPreference: 'high-performance',
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.4));
renderer.setClearColor(0x000000, 0);

scene.add(new THREE.AmbientLight(0x102018, 0.55));
const key = new THREE.DirectionalLight(0x00f5c4, 1.1);
key.position.set(4, 6, 5);
scene.add(key);
const blue = new THREE.PointLight(0x3d7bff, 1.6, 30);
blue.position.set(-4, 2, 3);
scene.add(blue);
const pink = new THREE.PointLight(0xff2d95, 1.1, 24);
pink.position.set(5, -1, 2);
scene.add(pink);

// Cyber grid floor
const grid = new THREE.GridHelper(40, 40, 0x00f5c4, 0x123028);
grid.position.y = -3.2;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

// Neon energy rings
const rings = [];
[1.6, 2.4, 3.3].forEach((r, i) => {
    const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.02, 8, lowPower ? 48 : 96),
        new THREE.MeshBasicMaterial({
            color: i === 1 ? 0x3d7bff : i === 2 ? 0xff2d95 : 0x00f5c4,
            transparent: true,
            opacity: 0.55 - i * 0.1,
        })
    );
    mesh.rotation.x = Math.PI / 2.4;
    mesh.position.set(2.4, 0.3, -1);
    scene.add(mesh);
    rings.push(mesh);
});

// Floating phone slabs (neon tech parts)
const phones = [];
const phoneMat = [
    new THREE.MeshStandardMaterial({ color: 0x0a1210, emissive: 0x00f5c4, emissiveIntensity: 0.35, metalness: 0.8, roughness: 0.25 }),
    new THREE.MeshStandardMaterial({ color: 0x0a0e18, emissive: 0x3d7bff, emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x120810, emissive: 0xff2d95, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.22 }),
];
const phoneCount = lowPower ? 4 : 7;
for (let i = 0; i < phoneCount; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.55, 1.1, 0.07, 2, 0.04), phoneMat[i % 3]);
    g.add(body);
    const screen = new THREE.Mesh(
        new RoundedBoxGeometry(0.46, 0.95, 0.01, 2, 0.02),
        new THREE.MeshBasicMaterial({ color: phoneMat[i % 3].emissive, transparent: true, opacity: 0.35 })
    );
    screen.position.z = 0.04;
    g.add(screen);
    g.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        -2 - Math.random() * 4
    );
    g.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.4);
    g.userData.spin = 0.2 + Math.random() * 0.4;
    g.userData.bob = Math.random() * Math.PI * 2;
    scene.add(g);
    phones.push(g);
}

// Tech particle network
const pCount = lowPower ? 180 : 450;
const pPos = new Float32Array(pCount * 3);
const pBase = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
    const x = (Math.random() - 0.5) * 18;
    const y = (Math.random() - 0.5) * 12;
    const z = (Math.random() - 0.5) * 10 - 2;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    pBase[i * 3] = x; pBase[i * 3 + 1] = y; pBase[i * 3 + 2] = z;
}
const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3)),
    new THREE.PointsMaterial({
        color: 0x00f5c4, size: lowPower ? 0.04 : 0.03,
        transparent: true, opacity: 0.65, sizeAttenuation: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
    })
);
scene.add(particles);

// Connection lines (sparse)
const lineCount = lowPower ? 20 : 40;
const linePos = new Float32Array(lineCount * 6);
for (let i = 0; i < lineCount; i++) {
    const a = Math.floor(Math.random() * pCount);
    const b = Math.floor(Math.random() * pCount);
    linePos[i * 6] = pBase[a * 3];
    linePos[i * 6 + 1] = pBase[a * 3 + 1];
    linePos[i * 6 + 2] = pBase[a * 3 + 2];
    linePos[i * 6 + 3] = pBase[b * 3];
    linePos[i * 6 + 4] = pBase[b * 3 + 1];
    linePos[i * 6 + 5] = pBase[b * 3 + 2];
}
const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(linePos, 3)),
    new THREE.LineBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0.18 })
);
scene.add(lines);

// Central neon core
const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, lowPower ? 0 : 1),
    new THREE.MeshStandardMaterial({
        color: 0x04120e, emissive: 0x00f5c4, emissiveIntensity: 0.9,
        metalness: 0.6, roughness: 0.25, wireframe: true,
    })
);
core.position.set(2.4, 0.3, -1);
scene.add(core);

const scroll = { p: 0, section: 0 };
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const sectionColors = [
    new THREE.Color(0x00f5c4),
    new THREE.Color(0x3d7bff),
    new THREE.Color(0xff2d95),
    new THREE.Color(0xffc14a),
];

addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const clock = new THREE.Clock();
const posAttr = particles.geometry.getAttribute('position');
let tick = 0;

function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    tick++;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    const p = scroll.p;
    const sec = scroll.section;
    const cA = sectionColors[sec];
    const cB = sectionColors[Math.min(sec + 1, 3)];
    particles.material.color.lerpColors(cA, cB, p * 4 - sec);

    // Particle swirl
    for (let i = 0; i < pCount; i++) {
        const bx = pBase[i * 3], by = pBase[i * 3 + 1], bz = pBase[i * 3 + 2];
        const wave = Math.sin(t * 0.8 + bx * 0.3 + p * 4) * 0.25;
        posAttr.array[i * 3] = bx + Math.sin(t * 0.4 + i) * 0.08 + mouse.x * 0.15;
        posAttr.array[i * 3 + 1] = by + wave - mouse.y * 0.12;
        posAttr.array[i * 3 + 2] = bz + Math.cos(t * 0.35 + i * 0.1) * 0.1;
    }
    posAttr.needsUpdate = true;

    // Rings + core follow section
    const targetX = THREE.MathUtils.lerp(2.6, -1.5, p);
    const targetY = THREE.MathUtils.lerp(0.4, 0.9, Math.sin(p * Math.PI));
    core.position.x += (targetX - core.position.x) * 0.05;
    core.position.y += (targetY - core.position.y) * 0.05;
    core.rotation.x = t * 0.35 + p;
    core.rotation.y = t * 0.55 + p * 2;
    core.material.emissive.copy(particles.material.color);
    core.material.emissiveIntensity = 0.7 + p * 0.5;

    rings.forEach((ring, i) => {
        ring.position.x = core.position.x;
        ring.position.y = core.position.y;
        ring.rotation.z = t * (0.15 + i * 0.05) + p * (1 + i * 0.3);
        ring.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.2 + i) * 0.15 + p * 0.4;
        ring.material.color.copy(particles.material.color);
    });

    phones.forEach((ph, i) => {
        ph.rotation.y += 0.004 * ph.userData.spin;
        ph.rotation.x = Math.sin(t * 0.5 + ph.userData.bob) * 0.15 + p * 0.2;
        ph.position.y += Math.sin(t * 0.7 + ph.userData.bob) * 0.002;
        ph.position.x += Math.sin(p * Math.PI + i) * 0.0015;
    });

    grid.position.z = ((t * 0.4 + p * 4) % 2) - 1;
    grid.material.opacity = 0.25 + p * 0.2;

    blue.intensity = 1.2 + Math.sin(t + p) * 0.4 + sec * 0.15;
    pink.intensity = 0.8 + Math.cos(t * 0.8) * 0.3 + (sec === 2 ? 0.6 : 0);
    key.color.copy(particles.material.color);

    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (0.3 - mouse.y * 0.35 - camera.position.y) * 0.04;
    camera.position.z = THREE.MathUtils.lerp(9, 7.2, p);
    camera.lookAt(core.position.x * 0.35, core.position.y * 0.2, 0);

    lines.rotation.y = t * 0.03 + p * 0.4;

    if (lowPower && tick % 2) return;
    renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── Navigation ─────────────────────────────────────────────────────
function goTo(hash) {
    const el = document.querySelector(hash);
    if (el) lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.1 });
    document.getElementById('nav-drawer')?.classList.remove('open');
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const h = a.getAttribute('href');
        if (!h || h === '#') return;
        e.preventDefault();
        goTo(h);
    });
});

document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-drawer')?.classList.toggle('open');
});

// ─── GSAP ───────────────────────────────────────────────────────────
const bar = document.querySelector('.scroll-progress-bar');
const nav = document.getElementById('nav');

ScrollTrigger.create({
    trigger: '.page',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
        scroll.p = self.progress;
        if (bar) bar.style.width = `${self.progress * 100}%`;
    },
});

ScrollTrigger.create({
    start: 40,
    onUpdate: (self) => nav?.classList.toggle('scrolled', self.scroll() > 40),
});

['hero', 'about', 'services', 'contact'].forEach((id, i) => {
    ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => { scroll.section = i; setNav(id); },
        onEnterBack: () => { scroll.section = i; setNav(id); },
    });
});

function setNav(id) {
    document.querySelectorAll('.nav-link, .nav-drawer-link').forEach((l) => {
        l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
    });
}

gsap.timeline({ delay: 0.1 })
    .from('.chip', { opacity: 0, y: 16, duration: 0.45 })
    .from('.hero-title', { opacity: 0, y: 36, duration: 0.65, ease: 'power3.out' }, '-=0.2')
    .from('.hero-lead', { opacity: 0, y: 18, duration: 0.45 }, '-=0.25')
    .from('.hero-cta', { opacity: 0, y: 14, duration: 0.4 }, '-=0.2')
    .from('.hero-tags span', { opacity: 0, y: 10, stagger: 0.05, duration: 0.35 }, '-=0.15');

gsap.to('.scroll-cue i', {
    scaleY: 0.35, transformOrigin: 'top', duration: 1.1, repeat: -1, yoyo: true, ease: 'power1.inOut',
});

gsap.utils.toArray('.panel').forEach((panel) => {
    if (panel.closest('#hero')) return;
    gsap.from(panel, {
        scrollTrigger: { trigger: panel, start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 48, duration: 0.75, ease: 'power3.out',
    });
});

gsap.utils.toArray('.service-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 32, duration: 0.5, delay: (i % 3) * 0.06, ease: 'power2.out',
    });
});

gsap.utils.toArray('.contact-card, .map-wrap').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 24, duration: 0.45, delay: i * 0.05, ease: 'power2.out',
    });
});

ScrollTrigger.create({
    trigger: '.stats',
    start: 'top 85%',
    once: true,
    onEnter: () => {
        document.querySelectorAll('.stat strong').forEach((el) => {
            const n = parseInt(el.dataset.count, 10);
            gsap.to({ v: 0 }, {
                v: n, duration: 1.3, ease: 'power2.out',
                onUpdate() {
                    el.textContent = Math.round(this.targets()[0].v) + (n === 100 ? '%' : '+');
                },
            });
        });
    },
});
