import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 800;
const CONNECTION_DISTANCE = 14;
const MAX_CONNECTIONS = 1800;

export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = mountRef.current;
    let w = container.clientWidth;
    let h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 300);
    camera.position.z = 70;

    // ── Particles ──────────────────────────────────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const pts = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 130;
      const y = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 70;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      pts.push([x, y, z]);
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.55 });
    const particles = new THREE.Points(ptGeo, ptMat);
    scene.add(particles);

    // ── Connection lines (pre-calculated) ──────────────────────────────────
    const pairs = [];
    outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (pairs.length >= MAX_CONNECTIONS) break outer;
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < CONNECTION_DISTANCE) {
          pairs.push(i, j);
        }
      }
    }
    const linePos = new Float32Array(pairs.length * 3);
    for (let k = 0; k < pairs.length; k++) {
      const p = pts[pairs[k]];
      linePos[k * 3] = p[0];
      linePos[k * 3 + 1] = p[1];
      linePos[k * 3 + 2] = p[2];
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ──────────────────────────────────────────────────────
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const onMove = (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 10;
      tmy = -(e.clientY / window.innerHeight - 0.5) * 10;
    };
    window.addEventListener('mousemove', onMove);

    // ── Animation ──────────────────────────────────────────────────────────
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      particles.rotation.y += 0.00018;
      particles.rotation.x += 0.00007;
      lines.rotation.y += 0.00018;
      lines.rotation.x += 0.00007;
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      camera.position.x = mx;
      camera.position.y = my;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      if (!container) return;
      w = container.clientWidth;
      h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      ptGeo.dispose(); ptMat.dispose();
      lineGeo.dispose(); lineMat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
