const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

// 1) autoBdValue fonksiyonunun tamamini (imzadan kapanis suslu parantezine kadar) regex ile yakala
const funcRegex = /function autoBdValue\(\{ material, thickness, lowerDie, upperDie \}\) \{[\s\S]*?return Number\(\(t \* vFactor \* matFactor\)\.toFixed\(2\)\);\s*\}/;

const funcReplacement = `function autoBdValue({ material, thickness, bendAngle, insideR }) {
  // K-faktor tabanli, aciya duyarli buku payi (bend deduction) hesabi.
  // Referans (dogrulanmis makine verisi): DURMA Easy + M460 V16 + P97.75.R08
  // + DKP 2mm + R=2.42mm + 90 derece => BD = 3.30 mm / bukum.
  // Bu referanstan K faktoru geriye hesaplanmistir: K(DKP) = 0.5535
  const T = Number(thickness) || 2;
  const R = Number(insideR) || 2.42;
  const angleDeg = Number(bendAngle) || 90;
  const angleRad = (angleDeg * Math.PI) / 180;

  // NOT: Sadece DKP degeri gercek makine verisiyle dogrulanmistir.
  // Diger malzemeler icin K faktoru, ayni oranli tahminle olceklenmistir;
  // gercek buku testi yapmadan guvenme, "Manuel BD" ile olcup gir.
  const kBase = 0.5535;
  const matFactor = material === "Hardox" ? 1.18 : material.includes("INOX") ? 1.10 : material.includes("Alüminyum") ? 0.92 : material === "Galvaniz" ? 1.02 : 1.00;
  const K = kBase * matFactor;

  const setback = Math.tan(angleRad / 2) * (R + T);
  const bendAllowance = angleRad * (R + K * T);
  const bd = 2 * setback - bendAllowance;
  return Number(bd.toFixed(2));
}`;

if (funcRegex.test(content)) {
  content = content.replace(funcRegex, funcReplacement);
  changed++;
} else {
  console.error('UYARI: autoBdValue regex eslesmedi.');
}

// 2) computedBd cagrisini regex ile guncelle
const callRegex = /const computedBd = useMemo\(\(\) => autoBdValue\(\{ material, thickness, lowerDie, upperDie \}\), \[material, thickness, lowerDie, upperDie\]\);/;
const callReplacement = `const computedBd = useMemo(() => autoBdValue({ material, thickness, bendAngle, insideR }), [material, thickness, bendAngle, insideR]);`;

if (callRegex.test(content)) {
  content = content.replace(callRegex, callReplacement);
  changed++;
} else {
  console.error('UYARI: computedBd cagrisi regex eslesmedi.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed}/2 blok degistirildi.`);
