// fix_pdf_v5.cjs — Genel Profil label binişmesi kesin çözüm
const fs = require("fs");
const FILE = "/sdcard/Download/OZER_BEND_PRO_MASTER_DEEP_FIXED/src/pdf/pdf.js";
let src = fs.readFileSync(FILE, "utf8");
fs.writeFileSync(FILE + ".bak_v5", src);

// Mevcut kutunun ne olduğunu bul
const match = src.match(/scalePointsToBoxPdf\(realPts,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\)/);
if (match) console.log("Mevcut:", match[0]);

// Tüm olası box değerlerini tek regex ile değiştir
src = src.replace(
  /scalePointsToBoxPdf\(realPts,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\)/,
  "scalePointsToBoxPdf(realPts, 48, 72, 200, 83)"
);

// offset değerini 20 yap
src = src.replace(
  /const offset = \d+;/,
  "const offset = 20;"
);

fs.writeFileSync(FILE, src);

// Doğrula
const m1 = src.match(/scalePointsToBoxPdf\(realPts,[^)]+\)/);
const m2 = src.match(/const offset = \d+/);
console.log("Yeni kutu:", m1?.[0]);
console.log("Yeni offset:", m2?.[0]);
console.log("✅ Tamam");
