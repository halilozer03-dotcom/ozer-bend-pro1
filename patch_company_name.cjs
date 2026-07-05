// patch_company_name.cjs
// Ayarlar paneline "Firma Adi" text alani ekler (localStorage'a kaydedilir).
// PDF basliginda, firma adi girilmisse onu (tek renk, ortalanmis) gosterir;
// bos birakilirsa mevcut varsayilan "ÖZER BEND PRO" (renkli) logosu kalir.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");
const PDF_JS = path.join(process.cwd(), "src", "pdf", "pdf.js");

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

/* 1) main.jsx: companyName state + localStorage kalicilik */
replaceOnce(
  MAIN_JSX,
  `const [showSettings, setShowSettings] = useState(false);`,
  `const [showSettings, setShowSettings] = useState(false);
  const [companyName, setCompanyName] = useState(() => {
    try {
      const saved = localStorage.getItem("ozerbend_company");
      if (saved) return saved;
    } catch (e) {}
    return "";
  });
  useEffect(() => {
    try {
      localStorage.setItem("ozerbend_company", companyName);
    } catch (e) {}
  }, [companyName]);`,
  "companyName state + localStorage kaliciligi eklendi"
);

/* 2) main.jsx: Ayarlar panelinde Firma Adi text alani */
replaceOnce(
  MAIN_JSX,
  `          <div className="grid">
            {select(t.machineLabel, machine, setMachine, machines)}`,
  `          <div className="grid">
            <label>Firma Adı (PDF başlığında görünür)
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ÖZER BEND PRO"
              />
            </label>
            {select(t.machineLabel, machine, setMachine, machines)}`,
  "Ayarlar paneline Firma Adi input'u eklendi"
);

/* 3) main.jsx: data objesine companyName ekle (PDF'e gonderilsin diye) */
replaceOnce(
  MAIN_JSX,
  `const data = { profileType, A, B, C, D, EN, H, bd, deduct, material, kalip: lowerDie, upperDie, machine, thickness, aci: bendAngle, icR: insideR, bendCount, segments: isGeneral ? segments : undefined };`,
  `const data = { profileType, A, B, C, D, EN, H, bd, deduct, material, kalip: lowerDie, upperDie, machine, thickness, aci: bendAngle, icR: insideR, bendCount, segments: isGeneral ? segments : undefined, companyName };`,
  "companyName, PDF'e giden data objesine eklendi"
);

/* 4) pdf.js: baslikta firma adi varsa onu goster, yoksa varsayilan logo */
replaceOnce(
  PDF_JS,
  `  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.setTextColor(0, 0, 0);
  doc.text("ÖZER", 96, 18);
  doc.setTextColor(...red);
  doc.text("BEND", 133, 18);
  doc.setTextColor(0, 0, 0);
  doc.text("PRO", 174, 18);
  doc.setFont("helvetica", "normal");`,
  `  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  if (data && data.companyName && data.companyName.trim()) {
    doc.setTextColor(0, 0, 0);
    doc.text(data.companyName.trim(), 148.5, 18, { align: "center" });
  } else {
    doc.setTextColor(0, 0, 0);
    doc.text("ÖZER", 96, 18);
    doc.setTextColor(...red);
    doc.text("BEND", 133, 18);
    doc.setTextColor(0, 0, 0);
    doc.text("PRO", 174, 18);
  }
  doc.setFont("helvetica", "normal");`,
  "PDF basligi firma adina gore kosullu hale getirildi"
);

console.log("\n✅ FIRMA ADI (PDF BASLIGI) OZELLIGI BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Ayarlar: firma adi PDF basligina eklendi\" && git push -u origin main");
