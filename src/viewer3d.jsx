import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Bir merkez çizgi (polyline) noktalarını, verilen kalınlıkta kapalı bir
// şerit (ribbon) çokgenine çevirir. Köşelerde miter (gönye) birleşim
// kullanılır, böylece kalınlık her yerde sabit kalır.
function buildRibbonShape(points, thickness) {
  const n = points.length;
  if (n < 2) return [];
  const half = thickness / 2;
  const segDirs = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy) || 1;
    segDirs.push({ x: dx / len, y: dy / len });
  }
  const normals = segDirs.map((d) => ({ x: -d.y, y: d.x }));
  const vNormals = [];
  for (let i = 0; i < n; i++) {
    let nx, ny;
    if (i === 0) {
      nx = normals[0].x;
      ny = normals[0].y;
    } else if (i === n - 1) {
      nx = normals[n - 2].x;
      ny = normals[n - 2].y;
    } else {
      nx = normals[i - 1].x + normals[i].x;
      ny = normals[i - 1].y + normals[i].y;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      const cosHalf = normals[i - 1].x * nx + normals[i - 1].y * ny;
      const miterScale = Math.abs(cosHalf) > 0.2 ? 1 / cosHalf : 1;
      nx *= miterScale;
      ny *= miterScale;
    }
    vNormals.push({ x: nx, y: ny });
  }
  const outer = points.map((p, i) => ({ x: p.x + vNormals[i].x * half, y: p.y + vNormals[i].y * half }));
  const inner = points.map((p, i) => ({ x: p.x - vNormals[i].x * half, y: p.y - vNormals[i].y * half }));
  return [...outer, ...inner.reverse()];
}

function buildExtrudedMesh(points, thickness, depth) {
  const half = thickness / 2;
  const ribbon = buildRibbonShape(points, thickness);
  if (ribbon.length < 3) return null;
  // Cok uzun parcalarda buku (fold) bolgesi ekranda kucuk/duz bir cizgiye
  // donusmesin diye, uzunlugu kesit boyutuna gore sinirliyoruz (gercek olcek
  // degil, gorsel netlik icin "sahne uzunlugu"). Kesit orantilari (A/B/C/D)
  // gercek degerlerle ayni kalir, sadece cok uzun parcalarda boy kisaltilir.
  const ribbonXs = ribbon.map((p) => p.x);
  const ribbonYs = ribbon.map((p) => p.y);
  const approxCrossSpan = Math.max(
    Math.max(...ribbonXs) - Math.min(...ribbonXs),
    Math.max(...ribbonYs) - Math.min(...ribbonYs),
    10
  );
  const MAX_DEPTH_RATIO = 6;
  const workingDepth = depth > approxCrossSpan * MAX_DEPTH_RATIO ? approxCrossSpan * MAX_DEPTH_RATIO : depth;
  const shape = new THREE.Shape();
  shape.moveTo(ribbon[0].x, ribbon[0].y);
  for (let i = 1; i < ribbon.length; i++) shape.lineTo(ribbon[i].x, ribbon[i].y);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: workingDepth,
    bevelEnabled: true,
    bevelThickness: Math.min(half * 0.35, 0.6),
    bevelSize: Math.min(half * 0.3, 0.5),
    bevelSegments: 2,
    steps: 1
  });
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc4cad2,
    metalness: 0.5,
    roughness: 0.6,
    clearcoat: 0.1,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.5
  });
  const mesh = new THREE.Mesh(geometry, material);
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const radius = Math.max(size.x, size.y, size.z, 10) / 2;
  // Kesit (fold) boyutu genelde uzunluktan (derinlik) çok küçüktür; kamerayı
  // kesit şekline göre çerçeveleyip uzunluğu perspektifle geriye ittiriyoruz,
  // böylece bükümler ekranda küçük/görünmez kalmaz.
  const crossSpan = Math.max(size.x, size.y, 10);
  return { mesh, radius, crossSpan, depthSize: size.z };
}

function ThreeDCanvas({ points, thickness, depth }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d12);

    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 0.6);
    scene.add(hemi);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.15);
    dir1.position.set(-1, 1.4, 1.2);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffe9b0, 0.55);
    dir2.position.set(1, -0.6, -1);
    scene.add(dir2);

    const built = buildExtrudedMesh(points, thickness, depth);
    let mesh = null;
    if (built) {
      mesh = built.mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const groundSize = built.radius * 12;
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(groundSize, groundSize),
        new THREE.ShadowMaterial({ opacity: 0.32 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = mesh.geometry.boundingBox.min.y;
      ground.receiveShadow = true;
      scene.add(ground);

      dir1.castShadow = true;
      dir1.shadow.mapSize.set(1024, 1024);
      dir1.shadow.camera.near = 0.1;
      dir1.shadow.camera.far = built.radius * 20;
      dir1.shadow.camera.left = -built.radius * 2;
      dir1.shadow.camera.right = built.radius * 2;
      dir1.shadow.camera.top = built.radius * 2;
      dir1.shadow.camera.bottom = -built.radius * 2;
      dir1.shadow.camera.updateProjectionMatrix();
      dir1.position.set(built.radius * -1.2, built.radius * 1.6, built.radius * 1.4);

      // Ortografik (paralel izdüşüm) kamera: uzun parçalarda perspektif
      // nedeniyle yakın uç büyük, uzak uç küçük GÖRÜNMEZ — her iki köşe de
      // ekranda aynı boyutta olur (yakınlaştırmakla değişmeyen gerçek çözüm).
      const viewHalf = built.crossSpan * 1.9;
      camera.left = -viewHalf * aspect;
      camera.right = viewHalf * aspect;
      camera.top = viewHalf;
      camera.bottom = -viewHalf;
      camera.near = 0.1;
      camera.far = (built.crossSpan + built.depthSize) * 20;

      const camDist = (built.crossSpan + built.depthSize) * 1.2;
      camera.position.set(camDist * -0.9, camDist * 0.85, camDist * 0.85);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.9;
    controls.minZoom = 0.35;
    controls.maxZoom = 8;

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      controls.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [points, thickness, depth]);

  return <div ref={mountRef} className="threeMount" />;
}

// Basit dokunmatik yakınlaştırma/kaydırma (pinch-zoom + pan) — 2D moda özel.
function useTouchZoomPan() {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const stateRef = useRef({});

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      stateRef.current = { mode: "pan", lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      stateRef.current = { mode: "pinch", startDist: dist, startScale: transform.scale };
    }
  };
  const onTouchMove = (e) => {
    const st = stateRef.current;
    if (st.mode === "pan" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - st.lastX;
      const dy = e.touches[0].clientY - st.lastY;
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
      st.lastX = e.touches[0].clientX;
      st.lastY = e.touches[0].clientY;
    } else if (st.mode === "pinch" && e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const newScale = Math.min(6, Math.max(0.5, st.startScale * (dist / st.startDist)));
      setTransform((t) => ({ ...t, scale: newScale }));
    }
  };
  const onTouchEnd = () => {
    stateRef.current = {};
  };
  const reset = () => setTransform({ x: 0, y: 0, scale: 1 });

  return { transform, onTouchStart, onTouchMove, onTouchEnd, reset };
}

export default function FullscreenViewer({ points, thickness, depth, svgContent, labels, onClose }) {
  const [mode, setMode] = useState("2d");
  const zp = useTouchZoomPan();

  return (
    <div className="fsViewer">
      <div className="fsTopBar">
        <div className="fsTabs">
          <button className={mode === "2d" ? "active" : ""} onClick={() => setMode("2d")}>2D</button>
          <button className={mode === "3d" ? "active" : ""} onClick={() => setMode("3d")}>3D</button>
        </div>
        <div className="fsRightBtns">
          {mode === "2d" && <button className="fsClose" onClick={zp.reset} title="Sıfırla">⟲</button>}
          <button className="fsClose" onClick={onClose}>✕</button>
        </div>
      </div>

      {mode === "2d" && (
        <div
          className="fsCanvas2d"
          onTouchStart={zp.onTouchStart}
          onTouchMove={zp.onTouchMove}
          onTouchEnd={zp.onTouchEnd}
          onDoubleClick={zp.reset}
        >
          <div
            className="fsZoomWrap"
            style={{ transform: `translate(${zp.transform.x}px, ${zp.transform.y}px) scale(${zp.transform.scale})` }}
          >
            {svgContent}
          </div>
          <div className="fsHint">İki parmakla yakınlaştır • Sürükle • Çift dokun: sıfırla</div>
        </div>
      )}

      {mode === "3d" && (
        <div className="fsCanvas3d">
          <ThreeDCanvas points={points} thickness={thickness} depth={depth} />
          <div className="fsHint">Sürükle: döndür • İki parmak: yakınlaştır</div>
        </div>
      )}
    </div>
  );
}
