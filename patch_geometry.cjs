const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

// ---- UZUNLUK ETIKETLERI: disari dogru offset ----
const lengthTarget = `      {genelPointsSvg.slice(0, -1).map((p, i) => {
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
        );
      })}`;

const lengthReplacement = `      {(() => {
        const cx = genelPointsSvg.reduce((s, pt) => s + pt.x, 0) / genelPointsSvg.length;
        const cy = genelPointsSvg.reduce((s, pt) => s + pt.y, 0) / genelPointsSvg.length;
        return genelPointsSvg.slice(0, -1).map((p, i) => {
          const p2 = genelPointsSvg[i + 1];
          const midX = (p.x + p2.x) / 2;
          const midY = (p.y + p2.y) / 2;
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          let nx = -dy / len;
          let ny = dx / len;
          if (nx * (midX - cx) + ny * (midY - cy) < 0) {
            nx = -nx;
            ny = -ny;
          }
          const offset = 30;
          const labelX = midX + nx * offset;
          const labelY = midY + ny * offset;
          const lengthValue = Math.round(segments[i].length * 100) / 100;
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
          );
        });
      })()}`;

if (content.includes(lengthTarget)) {
  content = content.replace(lengthTarget, lengthReplacement);
  changed++;
} else {
  console.error('UYARI: uzunluk blogu bulunamadi.');
}

// ---- ACI ETIKETLERI: tekil 90 derece + kose isareti ----
const angleTarget = `      {genelPointsSvg.slice(1, -1).map((p, i) => {
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

const angleReplacement = `      {(() => {
        const cx = genelPointsSvg.reduce((s, pt) => s + pt.x, 0) / genelPointsSvg.length;
        const cy = genelPointsSvg.reduce((s, pt) => s + pt.y, 0) / genelPointsSvg.length;
        const allRightAngles = segments.every((seg) => (seg.angle ?? 90) === 90);
        const elements = [];

        genelPointsSvg.slice(1, -1).forEach((p, i) => {
          const prev = genelPointsSvg[i];
          const next = genelPointsSvg[i + 2];
          const dx1 = p.x - prev.x;
          const dy1 = p.y - prev.y;
          const dx2 = next.x - p.x;
          const dy2 = next.y - p.y;
          const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
          const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
          const ux1 = dx1 / len1;
          const uy1 = dy1 / len1;
          const ux2 = dx2 / len2;
          const uy2 = dy2 / len2;
          const angleValue = segments[i].angle ?? 90;
          const isRight = angleValue === 90;

          if (isRight) {
            const tickSize = 14;
            const c1x = p.x - ux1 * tickSize;
            const c1y = p.y - uy1 * tickSize;
            const c2x = p.x + ux2 * tickSize;
            const c2y = p.y + uy2 * tickSize;
            const cornerX = c1x + ux2 * tickSize;
            const cornerY = c1y + uy2 * tickSize;
            elements.push(
              <polyline
                key={"tick" + i}
                points={\`\${c1x},\${c1y} \${cornerX},\${cornerY} \${c2x},\${c2y}\`}
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            );
          } else {
            let bx = -ux1 + ux2;
            let by = -uy1 + uy2;
            const blen = Math.sqrt(bx * bx + by * by) || 1;
            bx /= blen;
            by /= blen;
            if (bx * (cx - p.x) + by * (cy - p.y) < 0) {
              bx = -bx;
              by = -by;
            }
            const offset = 26;
            const labelX = p.x + bx * offset;
            const labelY = p.y + by * offset;
            elements.push(
              <text key={"ang" + i} x={labelX} y={labelY} className="angle">
                {angleValue}°
              </text>
            );
          }
        });

        if (allRightAngles) {
          elements.push(
            <text key="ang-single" x={cx} y={cy} className="angle" textAnchor="middle">
              90°
            </text>
          );
        }

        return elements;
      })()}`;

if (content.includes(angleTarget)) {
  content = content.replace(angleTarget, angleReplacement);
  changed++;
} else {
  console.error('UYARI: aci blogu bulunamadi.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed}/2 blok degistirildi.`);
