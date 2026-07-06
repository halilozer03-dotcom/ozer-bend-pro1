// patch_pdf_genel_labels_fix_v2.cjs
// Onceki patch tam metin eslestirme kullandigi icin bosluk/girinti farkindan
// dolayi eslesmedi. Bu surum regex ile (bosluklara toleransli) calisir.

const fs = require("fs");
const path = require("path");

const PDF_JS = path.join(process.cwd(), "src", "pdf", "pdf.js");

let content = fs.readFileSync(PDF_JS, "utf8");
const before = content;

/* 1) Uzunluk etiketi dondurmesini kaldir: ", angle: angleDeg" kismini sil */
const rotationRegex = /\{\s*align:\s*"center",\s*angle:\s*angleDeg\s*\}\s*\)/;
if (!rotationRegex.test(content)) {
  throw new Error("[HATA] Uzunluk etiketi dondurme kodu bulunamadi (adim 1)");
}
content = content.replace(rotationRegex, '{ align: "center" })');
console.log("[OK] 1. Uzunluk etiketi dondurmesi kaldirildi");

/* 2) Aci etiketi konumlandirmasini duzelt (bisektor tabanli) */
const angleLoopRegex = /for\s*\(\s*let i = 1;\s*i < pts\.length - 1;\s*i\+\+\s*\)\s*\{\s*const ang = segs\[i - 1\]\?\.angle \?\? 90;\s*doc\.text\(`\$\{ang\}°`,\s*pts\[i\]\.x,\s*pts\[i\]\.y - 8,\s*\{\s*align:\s*"center"\s*\}\s*\);\s*\}/;

if (!angleLoopRegex.test(content)) {
  throw new Error("[HATA] Aci etiketi dongusu bulunamadi (adim 2)");
}

const NEW_ANGLE_LOOP = `for (let i = 1; i < pts.length - 1; i++) {
      const ang = segs[i - 1]?.angle ?? 90;
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
      const gcx = pts.reduce((s, pt) => s + pt.x, 0) / pts.length;
      const gcy = pts.reduce((s, pt) => s + pt.y, 0) / pts.length;
      if (bx * (pCur.x - gcx) + by * (pCur.y - gcy) < 0) {
        bx = -bx;
        by = -by;
      }
      const angleOffset = 13;
      doc.text(\`\${ang}°\`, pCur.x + bx * angleOffset, pCur.y + by * angleOffset, { align: "center" });
    }`;

content = content.replace(angleLoopRegex, NEW_ANGLE_LOOP);
console.log("[OK] 2. Aci etiketi konumlandirmasi bisektor tabanli yapildi");

if (content === before) {
  throw new Error("[HATA] Dosyada hicbir degisiklik yapilmadi - beklenmeyen durum");
}

fs.writeFileSync(PDF_JS, content, "utf8");

console.log("\n✅ PDF GENEL PROFIL ETIKET DUZELTMESI (v2) BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"PDF: Genel Profil olcu/aci etiket konumlandirmasi duzeltildi\" && git push -u origin main");
