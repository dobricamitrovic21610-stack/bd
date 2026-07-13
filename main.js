import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const NAV_OFFSET = 90;
const isMobile = window.innerWidth < 768;
let visible = true;

// ─── Smooth scroll (Lenis + GSAP) ───────────────────────────────────
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Three.js — apstraktna 3D pozadina ──────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance',
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1 : 1.5));
renderer.setClearColor(0x000000, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const key = new THREE.DirectionalLight(0xaabbff, 1.2);
key.position.set(4, 6, 5);
scene.add(key);

// Soft aurora plane
const auroraMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color('#1a2a6c') },
        uColorB: { value: new THREE.Color('#6e8cff') },
        uColorC: { value: new THREE.Color('#a78bfa') },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float uTime, uScroll;
        uniform vec2 uMouse;
        uniform vec3 uColorA, uColorB, uColorC;
        void main() {
            vec2 uv = vUv + uMouse * 0.05;
            float w1 = sin(uv.x * 3.2 + uTime * 0.3 + uScroll * 2.0) * 0.5 + 0.5;
            float w2 = sin(uv.y * 2.6 - uTime * 0.22 + uScroll) * 0.5 + 0.5;
            float w3 = sin((uv.x + uv.y) * 2.0 + uTime * 0.15) * 0.5 + 0.5;
            vec3 col = mix(uColorA, uColorB, w1);
            col = mix(col, uColorC, w2 * 0.45);
            col += uColorB * w3 * 0.12;
            float vig = smoothstep(1.15, 0.25, length(uv - 0.5));
            gl_FragColor = vec4(col * vig, 0.55);
        }
    `,
    transparent: true,
    depthWrite: false,
});
const aurora = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), auroraMat);
aurora.position.z = -6;
scene.add(aurora);

// Fluid particle sphere
const COUNT = isMobile ? 900 : 2200;
const positions = new Float32Array(COUNT * 3);
const basePositions = new Float32Array(COUNT * 3);
const phases = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 2.2 + (Math.random() - 0.5) * 0.35;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
}

const sphereGeo = new THREE.BufferGeometry();
sphereGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const sphereMat = new THREE.PointsMaterial({
    color: 0x8eabff,
    size: isMobile ? 0.035 : 0.028,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});
const particleSphere = new THREE.Points(sphereGeo, sphereMat);
particleSphere.position.set(2.2, 0.2, 0);
scene.add(particleSphere);

// Elegant wave ribbons
const waveGroup = new THREE.Group();
scene.add(waveGroup);
const waves = [];
const waveColors = [0x6e8cff, 0xa78bfa, 0xe8a87c];

for (let w = 0; w < 3; w++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI * 2;
        pts.push(new THREE.Vector3(
            Math.cos(t) * (3.2 + w * 0.35),
            Math.sin(t * 2 + w) * 0.35,
            Math.sin(t) * (3.2 + w * 0.35)
        ));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 120, 0.012, 6, true),
        new THREE.MeshBasicMaterial({
            color: waveColors[w],
            transparent: true,
            opacity: 0.28 - w * 0.05,
        })
    );
    waveGroup.add(tube);
    waves.push(tube);
}
waveGroup.position.set(2.2, 0.2, 0);

// Ambient floating particles
const ambientCount = isMobile ? 40 : 90;
const ambPos = new Float32Array(ambientCount * 3);
for (let i = 0; i < ambientCount; i++) {
    ambPos[i * 3] = (Math.random() - 0.5) * 16;
    ambPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    ambPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
}
const ambient = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(ambPos, 3)),
    new THREE.PointsMaterial({ color: 0xa8b8ff, size: 0.03, transparent: true, opacity: 0.35 })
);
scene.add(ambient);

const scroll = { p: 0 };
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const colorTargets = [
    new THREE.Color('#6e8cff'),
    new THREE.Color('#a78bfa'),
    new THREE.Color('#e8a87c'),
    new THREE.Color('#55c2a8'),
];

addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
});

const clock = new THREE.Clock();
const posAttr = sphereGeo.getAttribute('position');

function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    auroraMat.uniforms.uTime.value = t;
    auroraMat.uniforms.uScroll.value = scroll.p;
    auroraMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Scroll → position / rotation / color
    const sectionT = scroll.p;
    const c1 = colorTargets[Math.floor(sectionT * 3.99) % 4];
    const c2 = colorTargets[Math.min(Math.floor(sectionT * 3.99) + 1, 3)];
    const mix = (sectionT * 3.99) % 1;
    sphereMat.color.lerpColors(c1, c2, mix);

    // Morph particle sphere (fluid breathing)
    for (let i = 0; i < COUNT; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];
        const ph = phases[i];
        const pulse = 1 + Math.sin(t * 1.4 + ph) * 0.06 + scroll.p * 0.12;
        const mx = mouse.x * 0.25;
        const my = -mouse.y * 0.2;
        posAttr.array[i * 3] = bx * pulse + mx * (0.15 + bz * 0.04);
        posAttr.array[i * 3 + 1] = by * pulse + my * (0.15 + bx * 0.03);
        posAttr.array[i * 3 + 2] = bz * pulse;
    }
    posAttr.needsUpdate = true;

    // Sphere follows scroll path + mouse parallax
    const targetX = THREE.MathUtils.lerp(2.2, -1.8, sectionT) + mouse.x * 0.6;
    const targetY = THREE.MathUtils.lerp(0.2, 0.8, Math.sin(sectionT * Math.PI)) - mouse.y * 0.4;
    const targetZ = THREE.MathUtils.lerp(0, -1.5, sectionT);

    particleSphere.position.x += (targetX - particleSphere.position.x) * 0.05;
    particleSphere.position.y += (targetY - particleSphere.position.y) * 0.05;
    particleSphere.position.z += (targetZ - particleSphere.position.z) * 0.05;

    particleSphere.rotation.y = t * 0.12 + sectionT * Math.PI * 1.2 + mouse.x * 0.3;
    particleSphere.rotation.x = Math.sin(t * 0.35) * 0.15 + sectionT * 0.4 + mouse.y * 0.2;

    waveGroup.position.copy(particleSphere.position);
    waveGroup.rotation.y = -t * 0.08 + sectionT * 0.9;
    waveGroup.rotation.z = Math.sin(t * 0.2) * 0.1;
    waves.forEach((wave, i) => {
        wave.material.opacity = 0.18 + Math.sin(t * 0.5 + i) * 0.06 + sectionT * 0.08;
        wave.material.color.copy(sphereMat.color);
    });

    ambient.rotation.y = t * 0.02;
    camera.position.x += (mouse.x * 0.35 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── Split words for hero entrance ──────────────────────────────────
document.querySelectorAll('[data-split]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');
});

// ─── Navigation ─────────────────────────────────────────────────────
function goTo(hash) {
    const el = document.querySelector(hash);
    if (el) lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.15 });
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const h = a.getAttribute('href');
        if (!h || h === '#') return;
        e.preventDefault();
        goTo(h);
        document.getElementById('nav-mobile')?.classList.remove('open');
    });
});

document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-mobile')?.classList.toggle('open');
});

// ─── GSAP ScrollTrigger — cinematic reveals ─────────────────────────
const bar = document.querySelector('.scroll-progress-bar');
const nav = document.getElementById('nav');

ScrollTrigger.create({
    trigger: '.scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
        scroll.p = self.progress;
        if (bar) bar.style.width = `${self.progress * 100}%`;
    },
});

ScrollTrigger.create({
    start: 50,
    onUpdate: (self) => nav?.classList.toggle('scrolled', self.scroll() > 50),
});

// Hero entrance
gsap.timeline({ delay: 0.12 })
    .from('.section-hero .label', { opacity: 0, y: 20, duration: 0.55, ease: 'power2.out' })
    .from('.hero-title .word', {
        opacity: 0, y: 42, duration: 0.7, stagger: 0.07, ease: 'power3.out',
    }, '-=0.25')
    .from('.hero-desc', { opacity: 0, y: 18, duration: 0.45 }, '-=0.2')
    .from('.hero-actions', { opacity: 0, y: 14, duration: 0.4 }, '-=0.15')
    .from('.scroll-indicator', { opacity: 0, duration: 0.4 }, '-=0.1');

gsap.to('.scroll-line', {
    scaleY: 0.35, transformOrigin: 'top', duration: 1.15, repeat: -1, yoyo: true, ease: 'power1.inOut',
});

// Soft hero parallax (no heavy pin — keeps content readable)
gsap.to('.hero-content', {
    scrollTrigger: {
        trigger: '.section-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
    },
    y: -80,
    opacity: 0.25,
    ease: 'none',
});

// Section glass panels — fade + lift
document.querySelectorAll('[data-glass]').forEach((panel) => {
    const section = panel.closest('.section');
    if (!section || section.id === 'hero') return;

    gsap.from(panel, {
        scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 56,
        duration: 0.85,
        ease: 'power3.out',
    });
});

gsap.utils.toArray('.section-head, .display-title, .body-text').forEach((el) => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 28,
        duration: 0.65,
        ease: 'power2.out',
    });
});

gsap.utils.toArray('.service-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        duration: 0.55,
        delay: (i % 3) * 0.06,
        ease: 'power2.out',
    });
});

gsap.utils.toArray('.contact-card, .map-wrap').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.5,
        delay: i * 0.05,
        ease: 'power2.out',
    });
});

ScrollTrigger.create({
    trigger: '.stats-row',
    start: 'top 85%',
    once: true,
    onEnter: () => {
        gsap.from('.stat', { opacity: 0, y: 18, stagger: 0.1, duration: 0.5, ease: 'power2.out' });
        document.querySelectorAll('.stat-num').forEach((el) => {
            const n = parseInt(el.dataset.count, 10);
            gsap.to({ v: 0 }, {
                v: n,
                duration: 1.35,
                ease: 'power2.out',
                onUpdate() {
                    el.textContent = Math.round(this.targets()[0].v) + (n === 100 ? '%' : '+');
                },
            });
        });
    },
});

['hero', 'about', 'services', 'contact'].forEach((id) => {
    ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 45%',
        end: 'bottom 45%',
        onEnter: () => setNav(id),
        onEnterBack: () => setNav(id),
    });
});

function setNav(id) {
    document.querySelectorAll('.nav-link, .nav-mobile-link').forEach((l) => {
        l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
    });
}
