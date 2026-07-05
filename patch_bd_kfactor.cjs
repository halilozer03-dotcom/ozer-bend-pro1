const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const funcTarget = `function autoBdValue({ material, thickness, lowerDie, upperDie }) {
  const t = Number(thickness) || 2;
  // Doğrulanmış makine değeri: DURMA Easy + M460 V16 + P97.75.R08 + DKP 2 mm = 3.30 mm / büküm
  if (lowerDie === "M.460.R/F V16" && upperDie === "P.97.75.R08/F" && material === "DKP" && t === 2) {
    return 3.30;
  }

  // V115 başlangıç katsayıları: gerçek üretim verileri geldikçe güncellenecek.
  // NOT: Hardox faktörü DOĞRULANMAMIŞ bir tahmindir (yüksek mukavemet nedeniyle
  // INOX'tan biraz yüksek varsayıldı). Gerçek test büküm yapmadan güvenme,
  // "Manuel BD" ile ölçtüğün değeri gir.
  const matFactor = material === "Hardox" ? 1.18 : material.includes("INOX") ? 1.10 : material.includes("Alüminyum") ? 0.92 : material === "Galvaniz" ? 1.02 : 1.00;
  const vFactor = lowerDie.includes("V12") ? 1.05 : lowerDie.includes("V16") ? 1.65 : lowerDie.includes("V22") ? 1.85 : lowerDie.includes("V35") ? 2.10 : lowerDie.includes("V50") ? 2.35 : 2.65;
  return Number((t * vFactor * matFactor).toFixed(2));
}`;

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

if (content.includes(funcTarget)) {
  content = content.replace(funcTarget, funcReplacement);
} else {
  console.error('UYARI: autoBdValue fonksiyonu tam eslesmedi, degistirilmedi.');
  process.exit(1);
}

const callTarget = `const computedBd = useMemo(() => autoBdValue({ material, thickness, lowerDie, upperDie }), [material, thickness, lowerDie, upperDie]);`;
const callReplacement = `const computedBd = useMemo(() => autoBdValue({ material, thickness, bendAngle, insideR }), [material, thickness, bendAngle, insideR]);`;

if (content.includes(callTarget)) {
  content = content.replace(callTarget, callReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi: BD hesabi K-faktor tabanli ve aciya duyarli hale getirildi.');
} else {
  console.error('UYARI: computedBd cagrisi tam eslesmedi, sadece fonksiyon degisti.');
  fs.writeFileSync(filePath, content, 'utf8');
}
