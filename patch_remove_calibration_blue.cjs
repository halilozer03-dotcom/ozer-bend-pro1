// patch_remove_calibration_blue.cjs
// "Konsept A - Kalibrasyon Mavisi" tasarim blogunu (dosyanin sonuna
// eklenmisti) style.css'ten tamamen kaldirir. Uygulama, bu blok
// eklenmeden onceki (yesil "dijital kumpas" veya orijinal) goruntusune
// doner.

const fs = require("fs");
const path = require("path");

const STYLE_CSS = path.join(process.cwd(), "src", "style.css");

const BLOCK_TO_REMOVE = `

/* ===================================================================
   TASARIM ONERISI v2 - Konsept A: Kalibrasyon Mavisi
   (patch_design_calibration_blue.cjs ile eklendi - geri almak icin bu
   blogu silin, bir onceki/yesil goruntuye doner)
=================================================================== */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

.panel h2 {
  font-family: 'IBM Plex Sans', sans-serif !important;
  letter-spacing: 1px !important;
  color: #9CC4F2 !important;
}

.resultItem {
  background: #101B2B !important;
  border: 1px solid #223247 !important;
}
.resultItem::before {
  display: none !important;
}
.resultItem span {
  font-family: 'IBM Plex Sans', sans-serif !important;
  letter-spacing: 1px !important;
  text-transform: uppercase !important;
  color: #5C7691 !important;
  font-size: 12.5px !important;
}
.resultItem b {
  font-family: 'IBM Plex Mono', monospace !important;
  color: #E8EDF2 !important;
  text-shadow: none !important;
  font-variant-numeric: tabular-nums;
}

.bdCard b, .infoStrip b {
  font-family: 'IBM Plex Mono', monospace !important;
  color: #E8EDF2 !important;
  font-variant-numeric: tabular-nums;
}

.profileChoice button.active {
  background: #142338 !important;
  border: 1px solid #4A90E2 !important;
  color: #9CC4F2 !important;
  box-shadow: none !important;
}

.top button, .actions button {
  border: 1px solid #2A3D54 !important;
}
.top button:active, .actions button:active {
  border-color: #4A90E2 !important;
}
`;

let content = fs.readFileSync(STYLE_CSS, "utf8");
const count = content.split(BLOCK_TO_REMOVE).length - 1;

if (count === 0) {
  throw new Error("[HATA] Kalibrasyon Mavisi blogu bulunamadi - zaten kaldirilmis olabilir");
}
if (count > 1) {
  throw new Error(`[HATA] Birden fazla eslesme bulundu (${count})`);
}

content = content.replace(BLOCK_TO_REMOVE, "");
fs.writeFileSync(STYLE_CSS, content, "utf8");

console.log("[OK] Kalibrasyon Mavisi tasarim blogu style.css'ten kaldirildi");
console.log("\n✅ MAVI TEMA BASARIYLA KALDIRILDI.");
console.log("Simdi: git add -A && git commit -m \"Kalibrasyon Mavisi tasarimi kaldirildi\" && git push -u origin main");
