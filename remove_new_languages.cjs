const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const dictStartMarker = 'const DICT = {';
const startIdx = content.indexOf(dictStartMarker);
if (startIdx === -1) {
  console.error('HATA: const DICT = { bulunamadi.');
  process.exit(1);
}
const bodyStart = startIdx + dictStartMarker.length;

let depth = 1;
let i = bodyStart;
for (; i < content.length; i++) {
  if (content[i] === '{') depth++;
  else if (content[i] === '}') {
    depth--;
    if (depth === 0) break;
  }
}
const bodyEnd = i;
const dictBody = content.substring(bodyStart, bodyEnd);

const keepCodes = ['tr', 'en', 'fr', 'de'];
const blocks = {};

for (const code of keepCodes) {
  const regex = new RegExp(`\\n  ${code}: \\{[\\s\\S]*?\\n  \\}`);
  const match = dictBody.match(regex);
  if (match) {
    blocks[code] = match[0].replace(/^\n/, '');
  } else {
    console.error(`UYARI: ${code} bloğu bulunamadı.`);
  }
}

const orderedCodes = keepCodes.filter((c) => blocks[c]);
const newDictBody = '\n' + orderedCodes.map((c) => blocks[c]).join(',\n') + '\n';
content = content.substring(0, bodyStart) + newDictBody + content.substring(bodyEnd);

const langArrRegex = /const LANGUAGES = \[[\s\S]*?\];/;
const newLangArr = `const LANGUAGES = [
  { code: "tr", flag: "TR", label: "Türkçe" },
  { code: "en", flag: "GB", label: "English" },
  { code: "fr", flag: "FR", label: "Français" },
  { code: "de", flag: "DE", label: "Deutsch" }
];`;

if (langArrRegex.test(content)) {
  content = content.replace(langArrRegex, newLangArr);
} else {
  console.error('UYARI: LANGUAGES dizisi bulunamadi, elle kontrol et.');
}

const mainTagRegex = /<main className="app" dir=\{lang === "ar" \? "rtl" : "ltr"\}>/;
if (mainTagRegex.test(content)) {
  content = content.replace(mainTagRegex, '<main className="app">');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. Sadece 4 dil kaldi: ${orderedCodes.join(', ')}. RTL dir kaldirildi.`);
