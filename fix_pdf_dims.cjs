// fix_pdf_dims.cjs — PDF ölçü etiket konumlarını düzeltir
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.env.HOME || "/sdcard",
  "../sdcard/Download/OZER_BEND_PRO_MASTER_DEEP_FIXED/src/pdf/pdf.js"
);

let src = fs.readFileSync(filePath, "utf8");
const backup = filePath + ".bak";
fs.writeFileSync(backup, src);
console.log("Yedek oluşturuldu:", backup);

// ── 1. dimH: yatay ölçü çizgisi — tick çubuklarını kısalt, yazıyı çizginin
//    ortasına değil biraz üstüne yaz (daha okunaklı, çizgiye binmez)
src = src.replace(
  /function dimH\(doc, x1, x2, y, text, label = null, labelColor = \[185, 28, 28\]\) \{[\s\S]*?^\}/m,
  `function dimH(doc, x1, x2, y, text, label = null, labelColor = [185, 28, 28]) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.line(x1, y - 3.5, x1, y + 3.5);
  doc.line(x2, y - 3.5, x2, y + 3.5);
  lineArrow(doc, x1, y, x2, y, 2.0);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(text, (x1 + x2) / 2, y - 1.5, { align: "center" });
  if (label) {
    doc.setTextColor(...labelColor);
    doc.setFontSize(11);
    doc.text(label, (x1 + x2) / 2, y + 8, { align: "center" });
  }
}`
);

// ── 2. dimV: dikey ölçü çizgisi — yazı çizgiye paralel ama daha uzakta
src = src.replace(
  /function dimV\(doc, x, y1, y2, valueText, label = null, labelSide = "left", labelColor = \[185, 28, 28\]\) \{[\s\S]*?^\}/m,
  `function dimV(doc, x, y1, y2, valueText, label = null, labelSide = "left", labelColor = [185, 28, 28]) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.line(x - 3.5, y1, x + 3.5, y1);
  doc.line(x - 3.5, y2, x + 3.5, y2);
  lineArrow(doc, x, y1, x, y2, 2.0);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const side = labelSide === "left" ? -1 : 1;
  doc.text(valueText, x + side * 11, (y1 + y2) / 2 + 1.5, { align: "center" });
  if (label) {
    doc.setTextColor(...labelColor);
    doc.setFontSize(12);
    doc.text(label, x + side * 23, (y1 + y2) / 2 + 1.5, { align: "center" });
  }
}`
);

// ── 3. Kapı profili çizim koordinatlarını ve ölçü offset'lerini düzelt.
//    Eski: yTop=86, yBot=141, dimH offset ±14 → çizim dar, ölçüler biniyor
//    Yeni: yTop=78, yBot=148, dimH offset ±16 → daha geniş çizim, ölçüler net dışarıda
src = src.replace(
  `const x1 = 55;
                                        const x2 = 242;
                                        const yTop = 86;
                                        const yBot = 141;
                                        const foot = 23;`,
  `const x1 = 50;
    const x2 = 247;
    const yTop = 78;
    const yBot = 148;
    const foot = 25;`
);

// ── 4. Ölçü çizgilerinin offset'lerini yeni koordinatlara göre güncelle
// üst yatay ölçü (EN): yTop - 14 → yTop - 16
src = src.replace(
  `dimH(doc, x1, x2, yTop - 14, fmt(EN));`,
  `dimH(doc, x1, x2, yTop - 16, fmt(EN));`
);
// alt yatay ölçüler (A, D): yBot + 14 → yBot + 16
src = src.replace(
  `dimH(doc, x1, x1 + foot, yBot + 14, fmt(A), "A", red);`,
  `dimH(doc, x1, x1 + foot, yBot + 16, fmt(A), "A", red);`
);
src = src.replace(
  `dimH(doc, x2 - foot, x2, yBot + 14, fmt(D), "D", red);`,
  `dimH(doc, x2 - foot, x2, yBot + 16, fmt(D), "D", red);`
);
// sol dikey ölçü (B): x1 - 24 → x1 - 26
src = src.replace(
  `dimV(doc, x1 - 24, yTop, yBot, fmt(B), "B", "left", red);`,
  `dimV(doc, x1 - 26, yTop, yBot, fmt(B), "B", "left", red);`
);
// sağ dikey ölçü (C): x2 + 24 → x2 + 26
src = src.replace(
  `dimV(doc, x2 + 24, yTop, yBot, fmt(C), "C", "right", red);`,
  `dimV(doc, x2 + 26, yTop, yBot, fmt(C), "C", "right", red);`
);

fs.writeFileSync(filePath, src);
console.log("✅ pdf.js güncellendi.");
console.log("Değişiklikler:");
console.log("  - Çizim alanı genişletildi (yTop: 86→78, yBot: 141→148)");
console.log("  - Ölçü etiketleri çizimden uzaklaştırıldı (offset artırıldı)");
console.log("  - dimH/dimV tick çubukları kısaltıldı (daha temiz görünüm)");
