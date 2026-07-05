// cleanup_and_bump_version.cjs
// 1) Kullanilmis tek seferlik .cjs patch dosyalarini siler (git gecmisinde zaten duruyorlar)
// 2) Versiyon numarasini V126 -> V127 yapar (tum dil bloklarinda + package.json)

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MAIN_JSX = path.join(ROOT, "src", "main.jsx");
const PACKAGE_JSON = path.join(ROOT, "package.json");

// Bu script'in kendisi haric, projenin kok dizinindeki TUM .cjs dosyalarini sil
const files = fs.readdirSync(ROOT);
let deletedCount = 0;
for (const f of files) {
  if (f.endsWith(".cjs") && f !== "cleanup_and_bump_version.cjs") {
    fs.unlinkSync(path.join(ROOT, f));
    console.log(`[SILINDI] ${f}`);
    deletedCount++;
  }
}
console.log(`\n[OK] ${deletedCount} adet eski patch dosyasi silindi.\n`);

// main.jsx icinde versiyon numarasini guncelle
let mainContent = fs.readFileSync(MAIN_JSX, "utf8");
const before = mainContent.split("ÖZER BEND PRO V126").length - 1;
if (before === 0) {
  throw new Error("[HATA] main.jsx icinde 'ÖZER BEND PRO V126' bulunamadi.");
}
mainContent = mainContent.split("ÖZER BEND PRO V126").join("ÖZER BEND PRO V127");
fs.writeFileSync(MAIN_JSX, mainContent, "utf8");
console.log(`[OK] main.jsx icinde ${before} yerde versiyon V126 -> V127 yapildi.`);

// package.json versiyonunu guncelle
let pkgContent = fs.readFileSync(PACKAGE_JSON, "utf8");
const pkg = JSON.parse(pkgContent);
const oldPkgVersion = pkg.version;
pkg.version = "1.1.0";
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`[OK] package.json versiyonu ${oldPkgVersion} -> ${pkg.version} yapildi.`);

console.log("\n✅ TEMIZLIK VE VERSIYON GUNCELLEMESI TAMAMLANDI.");
console.log("Simdi: git add -A && git commit -m \"Eski patch dosyalari temizlendi, versiyon V127\" && git push -u origin main");
