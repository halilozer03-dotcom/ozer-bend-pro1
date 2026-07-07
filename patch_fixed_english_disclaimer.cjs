// patch_fixed_english_disclaimer.cjs
// {t.trademarkDisclaimer} (dile gore degisen, sorunlu) yerine HER ZAMAN
// sabit Ingilizce bir telif/marka bildirimi gosterir - dil sistemine hic
// bagli degil, her zaman ayni metin.

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

replaceOnce(
  MAIN_JSX,
  `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              {t.trademarkDisclaimer}
            </p>`,
  `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              © {new Date().getFullYear()} ÖZER BEND PRO. All rights reserved. DURMA, Hardox and other
              product/brand names mentioned in this app are trademarks of their respective owners.
              This app is not affiliated with or endorsed by these companies; these names are used
              solely for compatibility/identification purposes.
            </p>`,
  "Marka bildirimi sabit Ingilizce metne cevrildi (dilden bagimsiz)"
);

console.log("\n✅ SABIT INGILIZCE TELIF/MARKA BILDIRIMI EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Marka bildirimi sabit Ingilizce metne cevrildi\" && git push -u origin main");
