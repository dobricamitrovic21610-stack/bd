import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const NAV_OFFSET = 90;
const isMobile = window.innerWidth < 768;
const lowPower = isMobile || (navigator.hardwareConcurrency || 8) <= 4;
let visible = true;

// ─── Lenis ──────────────────────────────────────────────────────────
const lenis = new Lenis({ lerp: lowPower ? 0.12 : 0.09, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Scene ──────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0.2, 0.1, 6.5);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lowPower, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.5));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

// Lighting — product showcase
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
scene.add(new THREE.HemisphereLight(0xffe8d6, 0x1a2030, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 6, 8);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 1.2);
rim.position.set(-6, 2, -4);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffccaa, 0.6);
fill.position.set(0, -3, 4);
scene.add(fill);

// Opus aurora
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
            float b=sin(uv.y*2.4-uTime*.18)*.5+.5;
            vec3 col=vec3(.05,.07,.14)+vec3(.2,.18,.55)*a*.4+vec3(.55,.25,.15)*b*.18;
            float vig=smoothstep(1.2,.2,length(uv-.5));
            gl_FragColor=vec4(col*vig,.7);
        }`,
    transparent: true, depthWrite: false,
});
const aurora = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), auroraMat);
aurora.position.z = -7;
scene.add(aurora);

// Soft stage ring
const stage = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.55, 64),
    new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
);
stage.rotation.x = -Math.PI / 2;
stage.position.set(1.3, -1.15, 0);
scene.add(stage);

const pCount = lowPower ? 30 : 70;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
}
const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3)),
    new THREE.PointsMaterial({ color: 0xffb088, size: 0.03, transparent: true, opacity: 0.45 })
);
scene.add(particles);

// ─── Screen canvas — always draws B&D site UI ───────────────────────
const SW = 540, SH = 1170;
const screenCanvas = document.createElement('canvas');
screenCanvas.width = SW;
screenCanvas.height = SH;
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawSiteScreen(progress = 0) {
    const ctx = sctx;
    const w = SW, h = SH;
    const scrollY = progress * (h * 1.8);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#12162a');
    bg.addColorStop(0.5, '#0b0d18');
    bg.addColorStop(1, '#15102a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Glow blobs
    const blob = ctx.createRadialGradient(w * 0.75, 180 - scrollY * 0.3, 0, w * 0.75, 180 - scrollY * 0.3, 280);
    blob.addColorStop(0, 'rgba(110,140,255,0.35)');
    blob.addColorStop(1, 'transparent');
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, w, h);

    const blob2 = ctx.createRadialGradient(80, 700 - scrollY * 0.3, 0, 80, 700 - scrollY * 0.3, 220);
    blob2.addColorStop(0, 'rgba(255,138,76,0.2)');
    blob2.addColorStop(1, 'transparent');
    ctx.fillStyle = blob2;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(0, -scrollY);

    // Status bar
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 18px Inter, sans-serif';
    ctx.fillText('9:41', 28, 42);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('5G  ██', w - 90, 42);

    // Nav pill
    roundRect(ctx, 40, 64, w - 80, 52, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Syne, sans-serif';
    ctx.fillText('B & D', 62, 96);
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillText('Početna  O nama  Usluge', 150, 96);

    // Hero
    ctx.fillStyle = '#6e8cff';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('LOZNICA · SERVIS & PRODAJA', 40, 180);
    ctx.fillStyle = '#f2f0eb';
    ctx.font = '800 48px Syne, sans-serif';
    ctx.fillText('Vaš telefon', 40, 250);
    const grad = ctx.createLinearGradient(40, 270, 360, 320);
    grad.addColorStop(0, '#9eb4ff');
    grad.addColorStop(0.5, '#c9a8ff');
    grad.addColorStop(1, '#ffb07a');
    ctx.fillStyle = grad;
    ctx.font = '800 40px Syne, sans-serif';
    ctx.fillText('u sigurnim rukama.', 40, 305);

    ctx.fillStyle = '#8b8fa8';
    ctx.font = '400 18px Inter, sans-serif';
    wrapText(ctx, 'Profesionalni servis mobilnih telefona, prodaja opreme i polovnih uređaja.', 40, 350, w - 80, 26);

    // CTA buttons
    roundRect(ctx, 40, 420, 200, 48, 24);
    ctx.fillStyle = '#f2f0eb';
    ctx.fill();
    ctx.fillStyle = '#0b0d18';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText('Pogledaj usluge', 68, 450);

    roundRect(ctx, 256, 420, 140, 48, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f2f0eb';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText('Kontakt', 290, 450);

    // About
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('01  O NAMA', 40, 560);
    ctx.fillStyle = '#f2f0eb';
    ctx.font = '700 36px Syne, sans-serif';
    ctx.fillText('Tehnologija kojoj', 40, 620);
    ctx.fillStyle = grad;
    ctx.fillText('možete verovati', 40, 665);
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '400 17px Inter, sans-serif';
    wrapText(ctx, 'B & D Mobile — zamena ekrana, baterije, maskice, satovi i polovni telefoni.', 40, 710, w - 80, 24);

    // Stats
    [['6+', 'Usluga'], ['2', 'Telefona'], ['100%', 'Posvećenost']].forEach(([n, l], i) => {
        const x = 40 + i * 150;
        ctx.fillStyle = '#f2f0eb';
        ctx.font = '800 36px Syne, sans-serif';
        ctx.fillText(n, x, 820);
        ctx.fillStyle = '#8b8fa8';
        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillText(l, x, 848);
    });

    // Services
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('02  USLUGE', 40, 940);
    ctx.fillStyle = '#f2f0eb';
    ctx.font = '700 34px Syne, sans-serif';
    ctx.fillText('Sve za vaš mobilni', 40, 995);

    const services = [
        ['01', 'Servis ekrana'],
        ['02', 'Prateća oprema'],
        ['03', 'Maskice'],
        ['04', 'Zamena baterija'],
        ['05', 'Prodaja telefona'],
        ['06', 'Smart satovi'],
    ];
    services.forEach(([num, title], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 40 + col * 230;
        const y = 1040 + row * 120;
        roundRect(ctx, x, y, 210, 100, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();
        ctx.fillStyle = '#6e8cff';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillText(num, x + 16, y + 30);
        ctx.fillStyle = '#f2f0eb';
        ctx.font = '700 18px Syne, sans-serif';
        ctx.fillText(title, x + 16, y + 60);
    });

    // Contact
    const cy = 1440;
    ctx.fillStyle = '#8b8fa8';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('03  KONTAKT', 40, cy);
    ctx.fillStyle = '#f2f0eb';
    ctx.font = '700 34px Syne, sans-serif';
    ctx.fillText('Posetite nas', 40, cy + 55);
    ctx.fillStyle = grad;
    ctx.fillText('u Loznici', 40, cy + 100);

    [
        ['Lokacija', 'Žikice Jovanovića 2'],
        ['Telefon', '015 873 210'],
        ['Instagram', '@bdmobil'],
        ['Facebook', 'B & D Mobile'],
    ].forEach(([lab, val], i) => {
        const y = cy + 140 + i * 90;
        roundRect(ctx, 40, y, w - 80, 72, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();
        ctx.fillStyle = '#8b8fa8';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText(lab.toUpperCase(), 60, y + 28);
        ctx.fillStyle = '#f2f0eb';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.fillText(val, 60, y + 52);
    });

    ctx.restore();

    // Dynamic Island overlay on top of screen content
    roundRect(ctx, w / 2 - 72, 18, 144, 34, 17);
    ctx.fillStyle = '#000';
    ctx.fill();

    screenTex.needsUpdate = true;
}

function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (let n = 0; n < words.length; n++) {
        const test = `${line}${words[n]} `;
        if (ctx.measureText(test).width > maxW && n > 0) {
            ctx.fillText(line, x, yy);
            line = `${words[n]} `;
            yy += lineH;
        } else line = test;
    }
    ctx.fillText(line, x, yy);
}

drawSiteScreen(0);

// ─── iPhone 17 Pro — Cosmic Orange aluminum + camera plateau ────────
// Real design: full-width horizontal plateau, triangle cameras left, flash/LiDAR right
const alu = new THREE.MeshStandardMaterial({ color: 0xe07a45, metalness: 0.85, roughness: 0.22 });
const aluBright = new THREE.MeshStandardMaterial({ color: 0xf0a070, metalness: 0.9, roughness: 0.15 });
const aluDark = new THREE.MeshStandardMaterial({ color: 0xb85a30, metalness: 0.88, roughness: 0.2 });
const blackGlass = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.6, roughness: 0.15 });
const lensBlack = new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.95, roughness: 0.05 });
const sideBtn = new THREE.MeshStandardMaterial({ color: 0xc86a38, metalness: 0.9, roughness: 0.18 });

function makeLens(r, depth = 0.02) {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(r, r, depth, 32), aluBright);
    outer.rotation.x = Math.PI / 2;
    g.add(outer);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r * 0.72, depth + 0.004, 32), lensBlack);
    glass.rotation.x = Math.PI / 2;
    glass.position.z = -0.002;
    g.add(glass);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, 0.004, 8, 32), alu);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -depth / 2;
    g.add(ring);
    return g;
}

function makeIPhone17Pro() {
    const g = new THREE.Group();
    // Pro proportions ~ 71.9 × 150 × 8.75 mm scaled
    const W = 0.78, H = 1.62, D = 0.088, R = 0.05;

    // Aluminum unibody
    g.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, R), alu));

    // Slightly brighter side chamfer look
    const frame = new THREE.Mesh(new RoundedBoxGeometry(W + 0.004, H + 0.004, D - 0.02, 2, R), aluBright);
    frame.position.z = 0;
    g.add(frame);

    // Ceramic Shield rear glass cutout (lower back for MagSafe)
    const backGlass = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.06, H * 0.42, 0.004, 2, 0.03),
        blackGlass
    );
    backGlass.position.set(0, -H * 0.22, -D / 2 - 0.001);
    g.add(backGlass);

    // Action button (right)
    const action = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.05, 0.03, 1, 0.003), sideBtn);
    action.position.set(W / 2 + 0.002, 0.35, 0);
    g.add(action);

    // Volume + power (left)
    const pwr = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.09, 0.028, 1, 0.003), sideBtn);
    pwr.position.set(-W / 2 - 0.002, 0.22, 0);
    g.add(pwr);
    [0.06, -0.08].forEach((y) => {
        const v = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.052, 0.028, 1, 0.003), sideBtn);
        v.position.set(-W / 2 - 0.002, y, 0);
        g.add(v);
    });

    // USB-C
    const port = new THREE.Mesh(
        new RoundedBoxGeometry(0.11, 0.008, 0.02, 1, 0.003),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.35 })
    );
    port.position.set(0, -H / 2 + 0.018, 0);
    g.add(port);

    // ── Camera PLATEAU — signature iPhone 17 Pro full-width bar ──
    const plateau = new THREE.Group();
    plateau.position.set(0, H / 2 - 0.18, -D / 2 - 0.016);
    const bar = new THREE.Mesh(new RoundedBoxGeometry(W - 0.02, 0.36, 0.038, 3, 0.06), aluDark);
    plateau.add(bar);
    const barTop = new THREE.Mesh(new RoundedBoxGeometry(W - 0.04, 0.32, 0.01, 2, 0.05), alu);
    barTop.position.z = -0.02;
    plateau.add(barTop);

    // Triangle of 3 cameras on LEFT of plateau
    const l1 = makeLens(0.06, 0.024);
    l1.position.set(-0.22, 0.055, -0.026);
    plateau.add(l1);
    const l2 = makeLens(0.06, 0.024);
    l2.position.set(-0.08, 0.055, -0.026);
    plateau.add(l2);
    const l3 = makeLens(0.068, 0.028); // telephoto larger
    l3.position.set(-0.15, -0.075, -0.028);
    plateau.add(l3);

    // Flash + LiDAR on RIGHT
    const flash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.012, 16),
        new THREE.MeshStandardMaterial({ color: 0xfff8e8, emissive: 0xffaa66, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.2 })
    );
    flash.rotation.x = Math.PI / 2;
    flash.position.set(0.22, 0.055, -0.026);
    plateau.add(flash);

    const lidar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0x111114, metalness: 0.85, roughness: 0.2 })
    );
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(0.22, -0.07, -0.026);
    plateau.add(lidar);

    const mic = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.008, 12),
        new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.5, roughness: 0.4 })
    );
    mic.rotation.x = Math.PI / 2;
    mic.position.set(0.08, 0.0, -0.022);
    plateau.add(mic);

    g.add(plateau);

    // Front bezel — thinner like real Pro
    const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - 0.012, H - 0.012, D - 0.012, 3, 0.044), blackGlass);
    bezel.position.z = 0.004;
    g.add(bezel);

    // SCREEN with site texture — larger
    const screenW = W - 0.038;
    const screenH = H - 0.06;
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screen = new THREE.Mesh(new RoundedBoxGeometry(screenW, screenH, 0.004, 4, 0.016), screenMat);
    screen.position.z = D / 2 - 0.001;
    g.add(screen);

    // Dynamic Island (in front of screen)
    const island = new THREE.Mesh(
        new RoundedBoxGeometry(0.26, 0.032, 0.005, 2, 0.012),
        new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.85, roughness: 0.1 })
    );
    island.position.set(0, H / 2 - 0.075, D / 2 + 0.003);
    g.add(island);

    // Subtle glass reflection
    const glass = new THREE.Mesh(
        new RoundedBoxGeometry(W - 0.03, H - 0.03, 0.001, 2, 0.038),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 })
    );
    glass.position.z = D / 2 + 0.004;
    g.add(glass);

    g.userData.screen = screen;
    return g;
}

const world = new THREE.Group();
scene.add(world);

const phone = makeIPhone17Pro();
phone.position.set(1.4, 0, 0);
phone.rotation.set(0.12, -0.45, 0.05);
world.add(phone);

// Soft orbit ring
const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.004, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0.15 })
);
orbit.rotation.x = Math.PI / 2.2;
world.add(orbit);

const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, 0.15, 6.5),
    new THREE.Vector3(-1.2, 0.4, 5.2),
    new THREE.Vector3(0.8, -0.2, 5.8),
    new THREE.Vector3(1.6, 0.1, 7.2),
]);

const scroll = { p: 0, hero: 0 };
let lastScreenP = -1;

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
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    auroraMat.uniforms.uTime.value = t;
    auroraMat.uniforms.uScroll.value = scroll.p;
    auroraMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Camera path
    const cp = camPath.getPoint(Math.min(scroll.p * 1.05, 0.99));
    camera.position.lerp(new THREE.Vector3(
        cp.x + mouse.x * 0.25,
        cp.y - mouse.y * 0.15,
        cp.z
    ), 0.08);

    // ── CLEAR ROTATION (Opus product tumble) ──
    // Front with site → turn to show camera plateau → continue
    const targetX = 0.08 + scroll.hero * 0.25 + scroll.p * 0.25;
    const targetY = -0.4 + scroll.hero * Math.PI * 1.35 + scroll.p * Math.PI * 0.85;
    const targetZ = 0.04 + Math.sin(scroll.hero * Math.PI) * 0.1;
    const targetPx = THREE.MathUtils.lerp(1.35, 0.15, Math.min(scroll.hero * 1.1 + scroll.p * 0.4, 1));
    const targetPy = THREE.MathUtils.lerp(0, -0.2, scroll.p);

    phone.rotation.x += (targetX - phone.rotation.x) * 0.12;
    phone.rotation.y += (targetY - phone.rotation.y) * 0.12;
    phone.rotation.z += (targetZ - phone.rotation.z) * 0.12;
    phone.position.x += (targetPx - phone.position.x) * 0.1;
    phone.position.y += (targetPy - phone.position.y) * 0.1;

    // Idle float when not scrolling much
    phone.position.y += Math.sin(t * 1.2) * 0.0008;

    stage.position.x = phone.position.x;
    orbit.position.copy(phone.position);
    orbit.rotation.z = t * 0.12 + scroll.p;

    camera.lookAt(phone.position.x * 0.5, phone.position.y * 0.3, 0);

    // Update screen content with scroll
    const sp = Math.round(scroll.p * 40) / 40;
    if (sp !== lastScreenP) {
        lastScreenP = sp;
        drawSiteScreen(scroll.p);
    }

    if (tick % 4 === 0) particles.rotation.y = t * 0.02;

    if (lowPower && tick % 2) return;
    renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ─── UI / GSAP ──────────────────────────────────────────────────────
document.querySelectorAll('[data-split]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');
});

function goTo(hash) {
    const el = document.querySelector(hash);
    if (el) lenis.scrollTo(el, { offset: -NAV_OFFSET, duration: 1.1 });
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

const bar = document.querySelector('.scroll-progress-bar');
const nav = document.getElementById('nav');

ScrollTrigger.create({
    trigger: '.scroll-container', start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => {
        scroll.p = s.progress;
        bar.style.width = `${s.progress * 100}%`;
    },
});
ScrollTrigger.create({
    start: 60,
    onUpdate: (s) => nav?.classList.toggle('scrolled', s.scroll() > 60),
});

gsap.timeline({ delay: 0.1 })
    .from('.label', { opacity: 0, y: 16, duration: 0.5 })
    .from('.hero-title .word', { opacity: 0, y: 36, duration: 0.65, stagger: 0.07, ease: 'power3.out' }, '-=0.25')
    .from('.hero-desc', { opacity: 0, y: 16, duration: 0.4 }, '-=0.15')
    .from('.hero-actions', { opacity: 0, y: 12, duration: 0.35 }, '-=0.1');

// Longer pin so rotation is obvious
gsap.timeline({
    scrollTrigger: {
        trigger: '.section-hero',
        start: 'top top',
        end: '+=120%',
        pin: true,
        scrub: 0.45,
        anticipatePin: 1,
        onUpdate: (s) => { scroll.hero = s.progress; },
    },
}).to('.hero-content', { y: -70, opacity: 0.08, ease: 'power2.in' }, 0.5);

document.querySelectorAll('[data-glass]').forEach((panel) => {
    const section = panel.closest('.section');
    if (!section || section.id === 'hero') return;
    gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 90%', end: 'bottom 10%', scrub: 0.55 },
    })
        .fromTo(panel, { y: 70, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, ease: 'none', duration: 0.45 }, 0)
        .to(panel, { y: -40, opacity: 0.35, scale: 1.02, ease: 'none', duration: 0.55 }, 0.45);
});

gsap.utils.toArray('.service-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 36, duration: 0.5, delay: (i % 3) * 0.05, ease: 'power2.out',
    });
});

gsap.utils.toArray('.contact-card, .map-wrap').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
        opacity: 0, x: i % 2 ? 24 : -24, duration: 0.45, ease: 'power2.out',
    });
});

gsap.to('.scroll-line', { scaleY: 0.4, transformOrigin: 'top', duration: 1.2, repeat: -1, yoyo: true, ease: 'power1.inOut' });

['.section-about', '.section-services', '.section-contact'].forEach((sel) => {
    gsap.from(`${sel} .section-head, ${sel} .display-title, ${sel} .body-text`, {
        scrollTrigger: { trigger: sel, start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 24, duration: 0.5, stagger: 0.06, ease: 'power3.out',
    });
});

ScrollTrigger.create({
    trigger: '.stats-row', start: 'top 85%', once: true,
    onEnter: () => {
        gsap.from('.stat', { opacity: 0, y: 16, stagger: 0.08, duration: 0.4 });
        document.querySelectorAll('.stat-num').forEach((el) => {
            const n = parseInt(el.dataset.count, 10);
            gsap.to({ v: 0 }, {
                v: n, duration: 1.2, ease: 'power2.out',
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
