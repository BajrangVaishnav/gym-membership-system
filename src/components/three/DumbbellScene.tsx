import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DumbbellSceneProps {
  scrollProgress?: number;
  className?: string;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

function createKnurlTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) {
      for (let x = 0; x < 256; x += 8) {
        ctx.fillStyle = (x + y) % 16 === 0 ? '#c8c8c8' : '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 8, y + 4);
        ctx.lineTo(x + 4, y + 8);
        ctx.lineTo(x, y + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 3);
  return tex;
}

function createStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#090B10');

  // Overhead softbox
  const softboxGeo = new THREE.PlaneGeometry(14, 6);
  const softboxMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.4, 2.6), side: THREE.DoubleSide });
  const softbox = new THREE.Mesh(softboxGeo, softboxMat);
  softbox.position.set(0, 8, 2);
  softbox.rotation.x = Math.PI / 2;
  envScene.add(softbox);

  // Warm orange key strip
  const warmGeo = new THREE.PlaneGeometry(4, 10);
  const warmMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.85, 0.35), side: THREE.DoubleSide });
  const warmStrip = new THREE.Mesh(warmGeo, warmMat);
  warmStrip.position.set(7, 2, 4);
  warmStrip.lookAt(0, 0, 0);
  envScene.add(warmStrip);

  // Cool rim strip
  const coolGeo = new THREE.PlaneGeometry(4, 10);
  const coolMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.8, 1.35), side: THREE.DoubleSide });
  const coolStrip = new THREE.Mesh(coolGeo, coolMat);
  coolStrip.position.set(-7, 1.5, -4);
  coolStrip.lookAt(0, 0, 0);
  envScene.add(coolStrip);

  const target = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  softboxGeo.dispose();
  softboxMat.dispose();
  warmGeo.dispose();
  warmMat.dispose();
  coolGeo.dispose();
  coolMat.dispose();
  return target.texture;
}

export function DumbbellScene({ scrollProgress = 0, className = '' }: DumbbellSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 100);
    camera.position.set(0, 0.65, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const envMap = createStudioEnvMap(renderer);
    scene.environment = envMap;

    // Studio 3-point lighting
    const keyLight = new THREE.DirectionalLight('#FFF4EB', 2.6);
    keyLight.position.set(4.5, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const orangeRim = new THREE.PointLight('#FF642D', 14, 14);
    orangeRim.position.set(3.2, -1.2, 2.8);
    scene.add(orangeRim);

    const limeRim = new THREE.PointLight('#C5F36B', 7, 14);
    limeRim.position.set(-3.8, 2.2, -2.5);
    scene.add(limeRim);

    // Materials
    const knurlTex = createKnurlTexture();
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#D8DCE6',
      metalness: 0.94,
      roughness: 0.22,
      bumpMap: knurlTex,
      bumpScale: 0.018,
    });
    const smoothSteelMat = new THREE.MeshStandardMaterial({
      color: '#C7CCD8',
      metalness: 0.96,
      roughness: 0.14,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: '#181C24',
      metalness: 0.15,
      roughness: 0.58,
    });
    const orangeAccentMat = new THREE.MeshStandardMaterial({
      color: '#FF642D',
      metalness: 0.72,
      roughness: 0.24,
      emissive: '#FF642D',
      emissiveIntensity: 0.12,
    });
    const darkPlateMat = new THREE.MeshStandardMaterial({
      color: '#131720',
      metalness: 0.55,
      roughness: 0.36,
    });

    // Main Dumbbell Assembly
    const dumbbell = new THREE.Group();

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.145, 0.145, 2.35, 32);
    handleGeo.rotateZ(Math.PI / 2);
    const handleMesh = new THREE.Mesh(handleGeo, chromeMat);
    handleMesh.castShadow = true;
    dumbbell.add(handleMesh);

    // Collars
    const collarGeo = new THREE.CylinderGeometry(0.22, 0.19, 0.18, 32);
    collarGeo.rotateZ(Math.PI / 2);
    [-0.95, 0.95].forEach((x) => {
      const collar = new THREE.Mesh(collarGeo, smoothSteelMat);
      collar.position.x = x;
      collar.rotation.z = x < 0 ? Math.PI : 0;
      dumbbell.add(collar);
    });

    // Hex Heads (left & right)
    const hexOuterGeo = new THREE.CylinderGeometry(0.76, 0.82, 0.56, 6);
    hexOuterGeo.rotateZ(Math.PI / 2);
    const hexCapGeo = new THREE.CylinderGeometry(0.62, 0.76, 0.12, 6);
    hexCapGeo.rotateZ(Math.PI / 2);
    const ringGeo = new THREE.TorusGeometry(0.46, 0.032, 16, 48);
    ringGeo.rotateY(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 24);
    hubGeo.rotateZ(Math.PI / 2);

    [-1, 1].forEach((dir) => {
      const headGroup = new THREE.Group();
      headGroup.position.x = dir * 1.32;

      const body = new THREE.Mesh(hexOuterGeo, rubberMat);
      body.castShadow = true;
      body.receiveShadow = true;
      headGroup.add(body);

      const innerCap = new THREE.Mesh(hexCapGeo, rubberMat);
      innerCap.position.x = -dir * 0.34;
      if (dir > 0) innerCap.rotation.y = Math.PI;
      headGroup.add(innerCap);

      const outerCap = new THREE.Mesh(hexCapGeo, rubberMat);
      outerCap.position.x = dir * 0.34;
      if (dir < 0) outerCap.rotation.y = Math.PI;
      headGroup.add(outerCap);

      const accentRing = new THREE.Mesh(ringGeo, orangeAccentMat);
      accentRing.position.x = dir * 0.39;
      headGroup.add(accentRing);

      const hub = new THREE.Mesh(hubGeo, smoothSteelMat);
      hub.position.x = dir * 0.4;
      headGroup.add(hub);

      dumbbell.add(headGroup);
    });

    dumbbell.rotation.set(0.28, -0.45, 0.18);
    scene.add(dumbbell);

    // Secondary Calibrated Olympic Weight Plate in background depth plane
    const plateGroup = new THREE.Group();
    const plateGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.16, 48);
    plateGeo.rotateX(Math.PI / 2);
    const plateMesh = new THREE.Mesh(plateGeo, darkPlateMat);
    plateGroup.add(plateMesh);

    const plateRimGeo = new THREE.TorusGeometry(0.95, 0.025, 12, 48);
    const plateRim = new THREE.Mesh(plateRimGeo, orangeAccentMat);
    plateRim.position.z = 0.085;
    plateGroup.add(plateRim);

    const boreGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 32);
    const bore = new THREE.Mesh(boreGeo, smoothSteelMat);
    bore.position.z = 0.08;
    plateGroup.add(bore);

    plateGroup.position.set(1.85, -0.85, -1.9);
    plateGroup.rotation.set(-0.25, -0.55, 0.12);
    scene.add(plateGroup);

    // Pointer parallax state
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetPointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let animId = 0;
    const clock = new THREE.Clock();

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      currentPointerX += (targetPointerX - currentPointerX) * 0.05;
      currentPointerY += (targetPointerY - currentPointerY) * 0.05;

      const scrollAngle = scrollRef.current * Math.PI * 1.35;
      const floatY = prefersReduced ? 0 : Math.sin(t * 1.15) * 0.09;

      dumbbell.position.y = floatY;
      dumbbell.rotation.x = 0.28 + currentPointerY * 0.14 + scrollRef.current * 0.25;
      dumbbell.rotation.y = -0.45 + currentPointerX * 0.28 + scrollAngle + (prefersReduced ? 0 : t * 0.14);
      dumbbell.rotation.z = 0.18 + Math.sin(t * 0.6) * (prefersReduced ? 0 : 0.03);

      plateGroup.position.y = -0.85 - floatY * 0.6;
      plateGroup.rotation.y = -0.55 - scrollAngle * 0.45 + currentPointerX * 0.12;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      envMap.dispose();
      knurlTex.dispose();
      [handleGeo, collarGeo, hexOuterGeo, hexCapGeo, ringGeo, hubGeo, plateGeo, plateRimGeo, boreGeo].forEach((g) =>
        g.dispose()
      );
      [chromeMat, smoothSteelMat, rubberMat, orangeAccentMat, darkPlateMat].forEach((m) => m.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative flex h-72 w-full max-w-md items-center justify-center rounded-3xl border border-white/[0.09] bg-[#11151D] p-8">
          <svg viewBox="0 0 320 140" className="h-auto w-full drop-shadow-2xl" aria-label="FitDesk 3D Dumbbell Visual">
            <defs>
              <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5F6FA" />
                <stop offset="50%" stopColor="#8E96A8" />
                <stop offset="100%" stopColor="#3B4252" />
              </linearGradient>
            </defs>
            <rect x="82" y="61" width="156" height="18" rx="4" fill="url(#steel)" />
            <rect x="44" y="24" width="42" height="92" rx="10" fill="#171D28" stroke="#2D3546" strokeWidth="2" />
            <rect x="234" y="24" width="42" height="92" rx="10" fill="#171D28" stroke="#2D3546" strokeWidth="2" />
            <rect x="40" y="38" width="6" height="64" rx="3" fill="#FF642D" />
            <rect x="274" y="38" width="6" height="64" rx="3" fill="#FF642D" />
          </svg>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={`h-full w-full ${className}`} aria-hidden="true" />;
}
