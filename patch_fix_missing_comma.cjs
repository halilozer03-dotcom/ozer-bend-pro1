// patch_fix_missing_comma.cjs
// weightCalcBtn satirinin sonunda virgul eksikti, hemen ardindan
// trademarkDisclaimer geldigi icin (11 dilin hepsinde) sozdizimi hatasi
// olusmustu. Bu regex, tum 11 dildeki eksik virgulu tek seferde duzeltir.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

let content = fs.readFileSync(MAIN_JSX, "utf8");
const before = content;

const regex = /(weightCalcBtn: "(?:[^"\\]|\\.)*")\n(\s*trademarkDisclaimer:)/g;
const matchCount = (content.match(regex) || []).length;

if (matchCount === 0) {
  throw new Error("[HATA] Duzeltilecek eksik virgul deseni bulunamadi - dosya beklenenden farkli olabilir");
}

content = content.replace(regex, "$1,\n$2");

if (content === before) {
  throw new Error("[HATA] Degisiklik yapilamadi");
}

fs.writeFileSync(MAIN_JSX, content, "utf8");
console.log(`[OK] ${matchCount} yerde eksik virgul duzeltildi (weightCalcBtn -> trademarkDisclaimer arasi)`);

console.log("\n✅ SOZDIZIMI HATASI DUZELTILDI.");
console.log("Simdi: git add -A && git commit -m \"Sozdizimi hatasi duzeltildi (eksik virgul)\" && git push -u origin main");
