// cleanup_and_bump_version_v2.cjs
// Kendisi haric projedeki tum .cjs patch dosyalarini siler (hepsi zaten
// kullanildi ve git gecmisinde duruyor) ve versiyon numarasini V127 -> V128
// yapar (tum dil bloklarinda + package.json).

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MAIN_JSX = path.join(ROOT, "src", "main.jsx");
const PACKAGE_JSON = path.join(ROOT, "package.json");

const files = fs.readdirSync(ROOT);
let deletedCount = 0;
for (const f of files) {
  if (f.endsWith(".cjs") && f !== "cleanup_and_bump_version_v2.cjs") {
    fs.unlinkSync(path.join(ROOT, f));
    console.log(`[SILINDI] ${f}`);
    deletedCount++;
  }
}
console.log(`\n[OK] ${deletedCount} adet eski patch dosyasi silindi.\n`);

let mainContent = fs.readFileSync(MAIN_JSX, "utf8");
const before = mainContent.split("ÖZER BEND PRO V127").length - 1;
if (before === 0) {
  throw new Error("[HATA] main.jsx icinde 'ÖZER BEND PRO V127' bulunamadi.");
}
mainContent = mainContent.split("ÖZER BEND PRO V127").join("ÖZER BEND PRO V1");
fs.writeFileSync(MAIN_JSX, mainContent, "utf8");
console.log(`[OK] main.jsx icinde ${before} yerde versiyon V127 -> V1 yapildi.`);

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
const oldPkgVersion = pkg.version;
pkg.version = "1.0.0";
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`[OK] package.json versiyonu ${oldPkgVersion} -> ${pkg.version} yapildi.`);

console.log("\n✅ TEMIZLIK VE VERSIYON GUNCELLEMESI TAMAMLANDI.");
console.log("Simdi: git add -A && git commit -m \"Eski patch dosyalari temizlendi, versiyon V1 (ilk resmi surum) olarak sifirlandi\" && git push -u origin main");
