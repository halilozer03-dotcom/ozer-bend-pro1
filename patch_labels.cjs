const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

const lengthBlockRegex = /\{genelPointsSvg\.slice\(0,\s*-1\)\.map\(\(p,\s*i\)\s*=>\s*\{[\s\S]*?\}\)\}/;
const lengthBlockReplacement = `{genelPointsSvg.slice(0, -1).map((p, i) => {
        const p2 = genelPointsSvg[i + 1];
        const midX = (p.x + p2.x) / 2;
        const midY = (p.y + p2.y) / 2;
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const offset = 16;
        const labelX = midX + nx * offset;
        const labelY = midY + ny * offset;
        const lengthValue = Math.round(segments[i].length * 100) / 100;
        return (
          <text key={"seg" + i} x={labelX} y={labelY} className="txt">
            {lengthValue} mm
          </text>
        );
      })}`;

if (lengthBlockRegex.test(content)) {
  content = content.replace(lengthBlockRegex, lengthBlockReplacement);
  changed++;
} else {
  console.error('UYARI: uzunluk etiketi blogu bulunamadi, degistirilmedi.');
}

const angleBlockRegex = /\{genelPointsSvg\.slice\(1,\s*-1\)\.map\(\(p,\s*i\)\s*=>\s*\([\s\S]*?\)\)\}/;
const angleBlockReplacement = `{genelPointsSvg.slice(1, -1).map((p, i) => {
        const prev = genelPointsSvg[i];
        const next = genelPointsSvg[i + 2];
        const dx1 = p.x - prev.x;
        const dy1 = p.y - prev.y;
        const dx2 = next.x - p.x;
        const dy2 = next.y - p.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
        const bx = (dx1 / len1) - (dx2 / len2);
        const by = (dy1 / len1) - (dy2 / len2);
        const blen = Math.sqrt(bx * bx + by * by) || 1;
        const offset = 22;
        const labelX = p.x + (bx / blen) * offset;
        const labelY = p.y + (by / blen) * offset;
        return (
          <text key={"ang" + i} x={labelX} y={labelY} className="angle">
            {segments[i].angle ?? 90}°
          </text>
        );
      })}`;

if (angleBlockRegex.test(content)) {
  content = content.replace(angleBlockRegex, angleBlockReplacement);
  changed++;
} else {
  console.error('UYARI: aci etiketi blogu bulunamadi, degistirilmedi.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed}/2 blok degistirildi.`);
