// patch_pdf_genel_labels_fix.cjs
// Genel Profil PDF cizimindeki iki sorunu duzeltir:
// 1) Uzunluk etiketleri artik segment acisina gore DONDURULMUYOR - her zaman
//    yatay, boylece tum etiketler tutarli bir mesafede/okunakli duruyor.
// 2) 90 derece (aci) etiketleri artik sabit "-8 yukari" kaydirma yerine,
//    o kosedeki iki segmentin gercek disari-donuk bisektor yonune gore
//    konumlaniyor - sekle binmiyor.

const fs = require("fs");
const path = require("path");

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

const OLD_BLOCK = `    for (let i = 0; i < pts.length - 1; i++) {
      const cxAll = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
      const cyAll = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;
      if (nx * (midX - cxAll) + ny * (midY - cyAll) < 0) {
        nx = -nx;
        ny = -ny;
      }
      const offset = 20;
      const labelX = midX + nx * offset;
      const labelY = midY + ny * offset;
      let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      if (angleDeg > 90) angleDeg -= 180;
      if (angleDeg < -90) angleDeg += 180;
      doc.text(\`\${fmt(segs[i]?.length)} mm\`, labelX, labelY, { align: "center", angle: angleDeg });
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    for (let i = 1; i < pts.length - 1; i++) {
      const ang = segs[i - 1]?.angle ?? 90;
      doc.text(\`\${ang}°\`, pts[i].x, pts[i].y - 8, { align: "center" });
    }`;

const NEW_BLOCK = `    const cxAll = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
    const cyAll = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;
      if (nx * (midX - cxAll) + ny * (midY - cyAll) < 0) {
        nx = -nx;
        ny = -ny;
      }
      const offset = 20;
      const labelX = midX + nx * offset;
      const labelY = midY + ny * offset;
      // Etiket artik segment acisina gore dondurulmuyor - her zaman yatay,
      // boylece tum uzunluk etiketleri tutarli/okunakli goruntuleniyor.
      doc.text(\`\${fmt(segs[i]?.length)} mm\`, labelX, labelY, { align: "center" });
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    for (let i = 1; i < pts.length - 1; i++) {
      const ang = segs[i - 1]?.angle ?? 90;
      // Aci etiketini, o kosedeki iki segmentin gercek disari-donuk
      // bisektor yonune gore konumlandir - sekle binmesin.
      const pPrev = pts[i - 1];
      const pCur = pts[i];
      const pNext = pts[i + 1];
      const d1x = pCur.x - pPrev.x;
      const d1y = pCur.y - pPrev.y;
      const l1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
      const d2x = pNext.x - pCur.x;
      const d2y = pNext.y - pCur.y;
      const l2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
      let n1x = -d1y / l1, n1y = d1x / l1;
      let n2x = -d2y / l2, n2y = d2x / l2;
      let bx = n1x + n2x;
      let by = n1y + n2y;
      const bl = Math.sqrt(bx * bx + by * by);
      if (bl > 0.0001) { bx /= bl; by /= bl; } else { bx = n1x; by = n1y; }
      if (bx * (pCur.x - cxAll) + by * (pCur.y - cyAll) < 0) {
        bx = -bx;
        by = -by;
      }
      const angleOffset = 13;
      doc.text(\`\${ang}°\`, pCur.x + bx * angleOffset, pCur.y + by * angleOffset, { align: "center" });
    }`;

replaceOnce(PDF_JS, OLD_BLOCK, NEW_BLOCK, "Genel Profil PDF etiket konumlandirmasi duzeltildi (uzunluk + aci)");

console.log("\n✅ PDF GENEL PROFIL ETIKET DUZELTMESI BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"PDF: Genel Profil olcu/aci etiket konumlandirmasi duzeltildi\" && git push -u origin main");
