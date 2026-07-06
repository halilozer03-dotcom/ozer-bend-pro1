// patch_add_materials_weightcalc.cjs
// Agirlik Hesapla malzeme listesine Pirinc, Bronz, Bakir ekler.

const fs = require("fs");
const path = require("path");

const WEIGHTCALC_JSX = path.join(process.cwd(), "src", "weightcalc.jsx");

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

replaceOnce(
  WEIGHTCALC_JSX,
  `  { code: "Hardox", label: "Hardox", density: 7.85 }
];`,
  `  { code: "Hardox", label: "Hardox", density: 7.85 },
  { code: "Pirinc", label: "Pirinç", density: 8.50 },
  { code: "Bronz", label: "Bronz", density: 8.80 },
  { code: "Bakir", label: "Bakır", density: 8.96 }
];`,
  "Pirinc, Bronz, Bakir Agirlik Hesapla listesine eklendi"
);

console.log("\n✅ YENI MALZEMELER BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Agirlik Hesapla: Pirinc, Bronz, Bakir eklendi\" && git push -u origin main");
