// fix_pdf_final.cjs
const fs = require("fs");
const FILE = "/sdcard/Download/OZER_BEND_PRO_MASTER_DEEP_FIXED/src/pdf/pdf.js";
let src = fs.readFileSync(FILE, "utf8");
fs.writeFileSync(FILE + ".bak_final", src);

// DÜZELTME: Genel profil çizim kutusunu daralt, label'lar için kenar boşluğu bırak
// Eski: (realPts, 30, 62, 237, 95) — şekil kutuyu tamamen dolduruyor, labellar binişiyor
// Yeni: (realPts, 55, 68, 187, 82) — daha küçük kutu, her yönde ~20mm label alanı kalıyor
const OLD = `    const pts = scalePointsToBoxPdf(realPts, 30, 62, 237, 95);`;
const NEW = `    const pts = scalePointsToBoxPdf(realPts, 55, 68, 187, 82);`;

if (src.includes(OLD)) {
  src = src.replace(OLD, NEW);
  fs.writeFileSync(FILE, src);
  console.log("✅ Düzeltme uygulandı — çizim kutusu daraltıldı, label boşluğu açıldı");
} else {
  console.log("❌ Eşleşmedi. Mevcut satır:");
  const i = src.indexOf("scalePointsToBoxPdf(realPts,");
  console.log(src.slice(i - 10, i + 60));
}
