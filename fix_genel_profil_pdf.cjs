// fix_genel_profil_pdf.cjs
// Genel Profil PDF'de çizim boş görünüyor — segment çizgileri çizilmiyor.
// Sorun: scalePointsToBoxPdf fonksiyonu boxH hesabında sayfa dışına çıkıyor.
// Düzeltme: çizim kutusunu genişlet + ölçü etiketlerini çizgiden uzaklaştır.

const fs = require("fs");
const FILE = "/sdcard/Download/OZER_BEND_PRO_MASTER_DEEP_FIXED/src/pdf/pdf.js";

let src = fs.readFileSync(FILE, "utf8");
fs.writeFileSync(FILE + ".bak2", src);
console.log("Yedek: " + FILE + ".bak2");

// ── Genel Profil çizim alanını genişlet
// Eski: scalePointsToBoxPdf(realPts, 20, 58, 257, 108)
// Yeni: daha geniş kutu, ölçü etiketlerine yer açmak için küçülttük
src = src.replace(
  "const pts = scalePointsToBoxPdf(realPts, 20, 58, 257, 108);",
  "const pts = scalePointsToBoxPdf(realPts, 30, 62, 237, 95);"
);

// ── Etiket offset'ini artır — çizginin üstüne binmesin
// Eski: const offset = 7;
// Yeni: const offset = 12;
src = src.replace(
  "const offset = 7;",
  "const offset = 12;"
);

fs.writeFileSync(FILE, src);
console.log("✅ Tamam. Şimdi: git add -A && git commit -m 'fix: Genel Profil PDF çizim alanı ve etiket offset düzeltildi' && git push");
