const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const flagMap = {
  tr: '🇹🇷',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
  ru: '🇷🇺',
  pt: '🇵🇹',
  pl: '🇵🇱',
  zh: '🇨🇳',
  ar: '🇸🇦',
};

let changed = 0;
for (const [code, emoji] of Object.entries(flagMap)) {
  const regex = new RegExp(`(\\{ code: "${code}", flag: ")[^"]*(")`);
  if (regex.test(content)) {
    content = content.replace(regex, `$1${emoji}$2`);
    changed++;
  } else {
    console.error(`UYARI: ${code} icin flag alani bulunamadi.`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed} dilin bayragi emoji ile guncellendi.`);
