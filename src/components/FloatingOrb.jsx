import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FloatingOrb({ size = 420, style = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 4.8;

    // ── Outer icosahedron wireframe ────────────────────────────────────────
    const icoGeo = new THREE.IcosahedronGeometry(1.45, 1);
    const icoMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.22 });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // ── Inner glowing sphere ──────────────────────────────────────────────
    const sGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const sMat = new THREE.MeshPhongMaterial({
      color: 0x06060f, emissive: 0x10103a, transparent: true, opacity: 0.95, shininess: 120,
    });
    const sphere = new THREE.Mesh(sGeo, sMat);
    scene.add(sphere);

    // ── Orbit ring 1 ──────────────────────────────────────────────────────
    const r1Geo = new THREE.TorusGeometry(1.85, 0.013, 2, 120);
    const r1Mat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.65 });
    const ring1 = new THREE.Mesh(r1Geo, r1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    // ── Orbit ring 2 ──────────────────────────────────────────────────────
    const r2Geo = new THREE.TorusGeometry(2.05, 0.008, 2, 120);
    const r2Mat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.35 });
    const ring2 = new THREE.Mesh(r2Geo, r2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // ── Surface nodes + connection lines ─────────────────────────────────
    const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
    const dotGroup = new THREE.Group();
    const dotPositions = [];

    for (let i = 0; i < 28; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      const phi   = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      dot.position.setFromSphericalCoords(1.1, phi, theta);
      dotPositions.push(dot.position.clone());
      dotGroup.add(dot);
    }
    scene.add(dotGroup);

    const connPts = [];
    for (let i = 0; i < dotPositions.length; i++) {
      for (let j = i + 1; j < dotPositions.length; j++) {
        if (dotPositions[i].distanceTo(dotPositions[j]) < 0.95) {
          connPts.push(dotPositions[i].x, dotPositions[i].y, dotPositions[i].z,
                       dotPositions[j].x, dotPositions[j].y, dotPositions[j].z);
        }
      }
    }
    const connGeo = new THREE.BufferGeometry();
    connGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connPts), 3));
    const connMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.28 });
    const connLines = new THREE.LineSegments(connGeo, connMat);
    scene.add(connLines);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const pl1 = new THREE.PointLight(0x6366f1, 4, 10);
    pl1.position.set(3, 3, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x818cf8, 2, 8);
    pl2.position.set(-3, -2, 1);
    scene.add(pl2);

    // ── Animation ─────────────────────────────────────────────────────────
    let raf, t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.007;
      ico.rotation.y      += 0.0028;
      ico.rotation.x      += 0.0009;
      sphere.rotation.y   += 0.0008;
      ring1.rotation.z    += 0.0055;
      ring2.rotation.y    += 0.0042;
      dotGroup.rotation.y += 0.0028;
      dotGroup.rotation.x += 0.0009;
      connLines.rotation.y += 0.0028;
      connLines.rotation.x += 0.0009;
      const floatY = Math.sin(t * 0.55) * 0.1;
      ico.position.y    = floatY;
      sphere.position.y = floatY;
      dotGroup.position.y = floatY;
      connLines.position.y = floatY;
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      renderer.setSize(size, size);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      [icoGeo, icoMat, sGeo, sMat, r1Geo, r1Mat, r2Geo, r2Mat, dotGeo, dotMat, connGeo, connMat]
        .forEach(o => o.dispose?.());
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size, ...style }} />;
}
