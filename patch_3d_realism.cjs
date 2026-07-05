// patch_3d_realism.cjs
// 1) Cok uzun parcalarda buku (fold) bolgesinin ekranda kaybolmamasi icin
//    "gorsel uzunluk" sinirlamasi (kesit / uzunluk orani sabit tavan) ekler.
// 2) Extrude kenarlarina hafif bevel (gercek sac bukumu gibi yuvarlatilmis kenar).
// 3) Malzemeyi MeshPhysicalMaterial + gercekci ortam yansimasi (RoomEnvironment) ile degistirir.
// 4) Yumusak golge (PCFSoftShadowMap) + zemin duzlemi ekler.

const fs = require("fs");
const path = require("path");

const VIEWER_JSX = path.join(process.cwd(), "src", "viewer3d.jsx");

function replaceOnce(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, "utf8");
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[HATA] Eslesme bulunamadi: ${label}`);
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eslesme bulundu (${count}): ${label}`);
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[OK] ${label}`);
}

/* 1) RoomEnvironment import */
replaceOnce(
  VIEWER_JSX,
  `import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";`,
  `import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";`,
  "RoomEnvironment import eklendi"
);

/* 2) buildExtrudedMesh: gorsel uzunluk sinirlamasi (workingDepth) */
replaceOnce(
  VIEWER_JSX,
  `function buildExtrudedMesh(points, thickness, depth) {
  const ribbon = buildRibbonShape(points, thickness);
  if (ribbon.length < 3) return null;`,
  `function buildExtrudedMesh(points, thickness, depth) {
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
  const workingDepth = depth > approxCrossSpan * MAX_DEPTH_RATIO ? approxCrossSpan * MAX_DEPTH_RATIO : depth;`,
  "Gorsel uzunluk sinirlamasi (workingDepth) eklendi"
);

/* 3) Extrude geometry: bevel + workingDepth kullan */
replaceOnce(
  VIEWER_JSX,
  `const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });`,
  `const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: workingDepth,
    bevelEnabled: true,
    bevelThickness: Math.min(half * 0.35, 0.6),
    bevelSize: Math.min(half * 0.3, 0.5),
    bevelSegments: 2,
    steps: 1
  });`,
  "Extrude'a bevel (yuvarlatilmis buku kenari) eklendi"
);

/* 4) Bounding box'i translate SONRASI yeniden hesapla (zemin konumu icin) */
replaceOnce(
  VIEWER_JSX,
  `geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeVertexNormals();`,
  `geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();`,
  "BoundingBox translate sonrasi yeniden hesaplaniyor"
);

/* 5) Malzeme: gercekci metal (MeshPhysicalMaterial + clearcoat) */
replaceOnce(
  VIEWER_JSX,
  `const material = new THREE.MeshStandardMaterial({ color: 0xc4cad2, metalness: 0.55, roughness: 0.42 });`,
  `const material = new THREE.MeshPhysicalMaterial({
    color: 0xc4cad2,
    metalness: 0.75,
    roughness: 0.28,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.15
  });`,
  "Malzeme MeshPhysicalMaterial (gercekci metal) ile degistirildi"
);

/* 6) Renderer: golge haritasi + ton eslemesi + ortam isigi (PMREM) */
replaceOnce(
  VIEWER_JSX,
  `const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);`,
  `const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;`,
  "Golge haritasi + gercekci ortam yansimasi (PMREM) eklendi"
);

/* 7) Mesh eklenince: golge + zemin duzlemi + isik golge ayarlari */
replaceOnce(
  VIEWER_JSX,
  `if (built) {
      mesh = built.mesh;
      scene.add(mesh);
      // Kamerayı kesit (fold) boyutuna göre çerçevele, uzunluk perspektifle
      // geriye gitsin — bükümler ekranda küçük/görünmez kalmasın.
      const camDist = built.crossSpan * 3.4;
      camera.position.set(camDist * 0.85, camDist * 0.65, camDist * 0.55 + built.depthSize * 0.12);
      camera.near = Math.max(0.1, built.crossSpan / 100);
      camera.far = (camDist + built.depthSize) * 20;
      camera.updateProjectionMatrix();
    }`,
  `if (built) {
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
      dir1.position.set(built.radius * 1.2, built.radius * 1.6, built.radius * 1.4);

      // Kamerayı kesit (fold) boyutuna göre çerçevele, uzunluk perspektifle
      // geriye gitsin — bükümler ekranda küçük/görünmez kalmasın.
      const camDist = built.crossSpan * 3.4;
      camera.position.set(camDist * 0.85, camDist * 0.65, camDist * 0.55 + built.depthSize * 0.12);
      camera.near = Math.max(0.1, built.crossSpan / 100);
      camera.far = (camDist + built.depthSize) * 20;
      camera.updateProjectionMatrix();
    }`,
  "Golge, zemin duzlemi ve isik-golge ayarlari eklendi"
);

console.log("\n✅ 3D GERCEKCILIK PATCH'I BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"3D gorunum: gercekci metal + golge + buku orani duzeltmesi\" && git push -u origin main");
