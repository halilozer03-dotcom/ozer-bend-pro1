const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        const lengthValue = Math.round(segments[i].length * 100) / 100;
        return (
          <text key={"seg" + i} x={labelX} y={labelY} className="txt">
            {lengthValue} mm
          </text>
        );`;

const replacement = `        const lengthValue = Math.round(segments[i].length * 100) / 100;
        let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angleDeg > 90) angleDeg -= 180;
        if (angleDeg < -90) angleDeg += 180;
        return (
          <text
            key={"seg" + i}
            x={labelX}
            y={labelY}
            className="txt"
            textAnchor="middle"
            transform={\`rotate(\${angleDeg} \${labelX} \${labelY})\`}
          >
            {lengthValue} mm
          </text>
        );`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi: uzunluk etiketine dondurme eklendi.');
} else {
  console.error('UYARI: hedef blok tam eslesmedi, degistirilmedi.');
}
