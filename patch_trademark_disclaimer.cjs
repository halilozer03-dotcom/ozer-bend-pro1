// patch_trademark_disclaimer.cjs
// Ayarlar paneline (Firma Adi alaninin altina) marka feragatnamesi
// (trademark disclaimer) ekler.

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
  `            <label>Firma Adı (PDF başlığında görünür)
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ÖZER BEND PRO"
              />
            </label>`,
  `            <label>Firma Adı (PDF başlığında görünür)
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ÖZER BEND PRO"
              />
            </label>
            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              DURMA, Hardox ve uygulama içinde geçen diğer ürün/marka adları ilgili sahiplerinin
              ticari markalarıdır. Bu uygulama bu firmalarla bağlantılı değildir ve onlar
              tarafından onaylanmamıştır; bu isimler yalnızca uyumluluk/tanımlama amacıyla
              kullanılmaktadır.
            </p>`,
  "Marka feragatnamesi Ayarlar paneline eklendi"
);

console.log("\n✅ MARKA FERAGATNAMESI BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Ayarlar: marka feragatnamesi eklendi\" && git push -u origin main");
