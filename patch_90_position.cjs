const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        if (allRightAngles) {
          elements.push(
            <text key="ang-single" x={cx} y={cy} className="angle" textAnchor="middle">
              90°
            </text>
          );
        }`;

const replacement = `        if (allRightAngles) {
          const p0 = genelPointsSvg[0];
          const dx0 = cx - p0.x;
          const dy0 = cy - p0.y;
          const len0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
          const cornerOffset = 34;
          const labelX0 = p0.x + (dx0 / len0) * cornerOffset;
          const labelY0 = p0.y + (dy0 / len0) * cornerOffset;
          elements.push(
            <text key="ang-single" x={labelX0} y={labelY0} className="angle" textAnchor="middle">
              90°
            </text>
          );
        }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi: tekil 90 derece etiketi ilk koseye yaklastirildi.');
} else {
  console.error('UYARI: hedef blok tam eslesmedi.');
}
