// patch_orthographic_camera_fix.cjs
// Onceki patch_orthographic_camera.cjs yarim kaldi (kamera turu zaten
// degisti ama cerceveleme kismi eslesmedi, cunku dosyada hala eski
// "+ built.depthSize * 0.12" asimetrik kaydirmasi vardi). Bu script
// kalan iki adimi, dosyanin GERCEK mevcut haline gore tamamliyor.

const fs = require("fs");
const path = require("path");

const VIEWER_JSX = path.join(process.cwd(), "src", "viewer3d.jsx");

function replaceOnce(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, "utf8");
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    console.log(`[ATLANDI] Zaten uygulanmis ya da eslesme yok: ${label}`);
    return;
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eslesme bulundu (${count}): ${label}`);
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[OK] ${label}`);
}

/* 1) Kamera cerceveleme: eski asimetrik + depthSize*0.12 kaydirmali versiyon */
replaceOnce(
  VIEWER_JSX,
  `      // Kamerayı kesit (fold) boyutuna göre çerçevele, uzunluk perspektifle
      // geriye gitsin — bükümler ekranda küçük/görünmez kalmasın.
      const camDist = built.crossSpan * 3.4;
      camera.position.set(camDist * 0.85, camDist * 0.65, camDist * 0.55 + built.depthSize * 0.12);
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
  "Kamera cerceveleme ortografik frustum'a gore guncellendi (duzeltilmis)"
);

/* 2) OrbitControls: mesafe yerine zoom sinirlari */
replaceOnce(
  VIEWER_JSX,
  `controls.minDistance = built ? built.crossSpan * 0.6 : 10;
    controls.maxDistance = built ? built.radius * 15 : 1000;`,
  `controls.minZoom = 0.35;
    controls.maxZoom = 8;`,
  "OrbitControls zoom sinirlari ortografik kameraya gore ayarlandi"
);

console.log("\n✅ TAMAMLAYICI PATCH BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"3D: ortografik kamera cerceveleme duzeltmesi\" && git push -u origin main");
