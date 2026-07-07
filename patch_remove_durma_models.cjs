// patch_remove_durma_models.cjs
// Makine listesinden "DURMA Easy" disindaki tum DURMA modellerini kaldirir.
// Diger markalar (Baykal, Ermaksan, Amada, Trumpf, SafanDarley, LVD,
// Gasparini) oldugu gibi kalir.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

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

const OLD_MACHINES = `const machines = [
  "DURMA Easy",
  "DURMA AD-S 30175",
  "DURMA AD-S 30220",
  "DURMA AD-S 37220",
  "DURMA AD-R 30135",
  "DURMA AD-R 30175",
  "DURMA HAP 30120",
  "DURMA HAP 30200",
  "Baykal APHS",
  "Ermaksan Speed-Bend",
  "Amada HFE",
  "Trumpf TruBend",
  "SafanDarley E-Brake",
  "LVD PPEB",
  "Gasparini PBS"
];`;

const NEW_MACHINES = `const machines = [
  "DURMA Easy",
  "Baykal APHS",
  "Ermaksan Speed-Bend",
  "Amada HFE",
  "Trumpf TruBend",
  "SafanDarley E-Brake",
  "LVD PPEB",
  "Gasparini PBS",
  "Bystronic Xpert",
  "Prima Power BCe",
  "Cincinnati Autoform",
  "HACO Synchro",
  "Adira PA",
  "Estun E21",
  "Boschert Compact"
];`;

replaceOnce(MAIN_JSX, OLD_MACHINES, NEW_MACHINES, "Makine listesinden DURMA Easy disindaki DURMA modelleri kaldirildi");

console.log("\n✅ MAKINE LISTESI GUNCELLENDI.");
console.log("Simdi: git add -A && git commit -m \"Makine listesi: sadece DURMA Easy birakildi\" && git push -u origin main");
