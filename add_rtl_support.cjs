const fs = require('fs');
const filePath = 'src/main.jsx';
const cssPath = 'src/style.css';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

const mainTagTarget = '<main className="app">';
const mainTagReplacement = '<main className="app" dir={lang === "ar" ? "rtl" : "ltr"}>';

if (content.includes(mainTagTarget)) {
  content = content.replace(mainTagTarget, mainTagReplacement);
  changed++;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Tamamlandi. ${changed}/1 blok degistirildi (main.jsx dir eklendi).`);
} else {
  console.error('UYARI: main.app etiketi bulunamadi, RTL dir eklenemedi.');
}

const rtlCss = `

/* ==== RTL (Cezayir/Arapca) destegi ==== */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .grid,
[dir="rtl"] .actions,
[dir="rtl"] .actionsSingle,
[dir="rtl"] .segmentRow,
[dir="rtl"] .segmentButtons,
[dir="rtl"] .favRow,
[dir="rtl"] .favWrap,
[dir="rtl"] .topButtons,
[dir="rtl"] .brand,
[dir="rtl"] .profileChoice,
[dir="rtl"] .langMenuWrap,
[dir="rtl"] .dimsHeaderRow {
  direction: rtl;
}

[dir="rtl"] input,
[dir="rtl"] select,
[dir="rtl"] label {
  text-align: right;
}

[dir="rtl"] .langMenu {
  right: auto;
  left: 0;
  text-align: right;
}

[dir="rtl"] .resultItem,
[dir="rtl"] .infoStrip div {
  flex-direction: row-reverse;
}
`;

fs.appendFileSync(cssPath, rtlCss);
console.log('RTL CSS eklendi (src/style.css).');
