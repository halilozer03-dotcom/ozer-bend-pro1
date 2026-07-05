const fs = require('fs');
const filePath = 'src/pdf/pdf.js';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /for \(let i = 0; i < pts\.length - 1; i\+\+\) \{\s*const midX = \(pts\[i\]\.x \+ pts\[i \+ 1\]\.x\) \/ 2;\s*const midY = \(pts\[i\]\.y \+ pts\[i \+ 1\]\.y\) \/ 2;\s*doc\.text\(`\$\{fmt\(segs\[i\]\?\.length\)\} mm`, midX, midY - 4, \{ align: "center" \}\);\s*\}/;

const replacement = `for (let i = 0; i < pts.length - 1; i++) {
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
          const offset = 7;
          const labelX = midX + nx * offset;
          const labelY = midY + ny * offset;
          let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angleDeg > 90) angleDeg -= 180;
          if (angleDeg < -90) angleDeg += 180;
          doc.text(\`\${fmt(segs[i]?.length)} mm\`, labelX, labelY, { align: "center", angle: angleDeg });
        }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi: PDF genel profil mm etiketleri offsetli ve dondurulmus.');
} else {
  console.error('UYARI: regex hala eslesmedi.');
}
