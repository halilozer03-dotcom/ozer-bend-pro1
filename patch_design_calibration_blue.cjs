// patch_design_calibration_blue.cjs
// Secilen "Konsept A - Kalibrasyon Mavisi" tasarimini uygulamaya isler.
// Onceki yesil "dijital kumpas" gorunumunun UZERINE yazar (dosyanin en
// sonuna eklenerek - hicbir satir silinmiyor). Geri almak icin: bu
// patch'in ekledigi son bloğu silmek yeterli, bir onceki (yesil) veya
// orijinal (altin) goruntuye geri donulur.

const fs = require("fs");
const path = require("path");

const STYLE_CSS = path.join(process.cwd(), "src", "style.css");

const NEW_CSS = `

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

fs.appendFileSync(STYLE_CSS, NEW_CSS, "utf8");
console.log("[OK] Konsept A (Kalibrasyon Mavisi) style.css dosyasinin sonuna eklendi");

console.log("\n✅ KONSEPT A (KALIBRASYON MAVISI) BASARIYLA UYGULANDI.");
console.log("GERI ALMAK ICIN: style.css dosyasinin en sonundaki");
console.log("'TASARIM ONERISI v2' basliginda baslayan blogu silip tekrar push edebilirsin.");
console.log("Simdi: git add -A && git commit -m \"Tasarim: Konsept A - Kalibrasyon Mavisi uygulandi\" && git push -u origin main");
