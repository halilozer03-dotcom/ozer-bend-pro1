// patch_pdf_label_distance.cjs
// Genel Profil PDF'sindeki uzunluk etiketlerinin (mm yazilari) sekle olan
// mesafesini azaltir (offset 20 -> 14).

const fs = require("fs");
const path = require("path");

const PDF_JS = path.join(process.cwd(), "src", "pdf", "pdf.js");

let content = fs.readFileSync(PDF_JS, "utf8");
const before = content;

const offsetRegex = /const offset = 20;/;
if (!offsetRegex.test(content)) {
  throw new Error("[HATA] 'const offset = 20;' bulunamadi");
}
content = content.replace(offsetRegex, "const offset = 14;");

if (content === before) {
  throw new Error("[HATA] Dosyada degisiklik yapilamadi");
}

fs.writeFileSync(PDF_JS, content, "utf8");
console.log("[OK] Uzunluk etiketi mesafesi azaltildi (offset 20 -> 14)");
console.log("\n✅ PDF ETIKET MESAFESI DUZELTILDI.");
console.log("Simdi: git add -A && git commit -m \"PDF: uzunluk etiketleri sekle yaklastirildi\" && git push -u origin main");
