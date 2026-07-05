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

// Bracket sayarak DICT objesinin gercek kapanisini bul
let depth = 1;
let i = bodyStart;
for (; i < content.length; i++) {
  if (content[i] === '{') depth++;
  else if (content[i] === '}') {
    depth--;
    if (depth === 0) break;
  }
}
const bodyEnd = i; // '}' karakterinin indexi
const dictBody = content.substring(bodyStart, bodyEnd);

const knownCodes = ['tr', 'en', 'fr', 'de', 'es', 'it', 'ru', 'pt', 'pl', 'zh', 'ar'];
const blocks = {};

for (const code of knownCodes) {
  const regex = new RegExp(`\\n  ${code}: \\{[\\s\\S]*?\\n  \\}`);
  const match = dictBody.match(regex);
  if (match) {
    blocks[code] = match[0].replace(/^\n/, ''); // basdaki \n'i kaldir, biz kendimiz ekleyecegiz
  } else {
    console.error(`UYARI: ${code} bloğu bulunamadı, atlanıyor.`);
  }
}

const orderedCodes = knownCodes.filter((c) => blocks[c]);
const newDictBody = '\n' + orderedCodes.map((c) => blocks[c]).join(',\n') + '\n';

const newContent = content.substring(0, bodyStart) + newDictBody + content.substring(bodyEnd);
fs.writeFileSync(filePath, newContent, 'utf8');

console.log(`Tamamlandi. DICT temizlendi. Bulunan diller: ${orderedCodes.join(', ')} (toplam ${orderedCodes.length})`);
