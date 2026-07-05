// patch_orthographic_camera.cjs
// Perspektif kamerada uzun parcalarin yakin ucu buyuk, uzak ucu kucuk gorunur
// (optik gercek, hata degil) - yakinlastirmak bunu duzeltmez. Kalici cozum:
// ortografik (paralel izdusum) kamera - CAD/teknik gorunumlerin standardi.
// Boylece parcanin her iki ucu da ekranda AYNI boyutta gorunur.

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

/* 1) Perspektif -> Ortografik kamera */
replaceOnce(
  VIEWER_JSX,
  `const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);`,
  `const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100000);`,
  "Perspektif kamera -> Ortografik kamera"
);

/* 2) Kamera cerceveleme: ortografik frustum, her iki uc esit boyutta */
replaceOnce(
  VIEWER_JSX,
  `      // Kamerayı kesit (fold) boyutuna göre çerçevele, uzunluk perspektifle
      // geriye gitsin — bükümler ekranda küçük/görünmez kalmasın.
      const camDist = built.crossSpan * 3.4;
      camera.position.set(camDist * 0.85, camDist * 0.65, camDist * 0.55);
      camera.near = Math.max(0.1, built.crossSpan / 100);
      camera.far = (camDist + built.depthSize) * 20;
      camera.updateProjectionMatrix();
    }`,
  `      // Ortografik (paralel izdüşüm) kamera: uzun parçalarda perspektif
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
      camera.position.set(camDist * 0.85, camDist * 0.65, camDist * 0.55);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }`,
  "Kamera cerceveleme ortografik frustum'a gore guncellendi"
);

/* 3) OrbitControls: mesafe yerine zoom sinirlari (ortografik kamera icin) */
replaceOnce(
  VIEWER_JSX,
  `controls.minDistance = built ? built.crossSpan * 0.6 : 10;
    controls.maxDistance = built ? built.radius * 15 : 1000;`,
  `controls.minZoom = 0.35;
    controls.maxZoom = 8;`,
  "OrbitControls zoom sinirlari ortografik kameraya gore ayarlandi"
);

console.log("\n✅ ORTOGRAFIK KAMERA PATCH'I BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"3D: ortografik kamera - sag/sol esitsizlik kalici cozuldu\" && git push -u origin main");
