const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\{ code: "ar", flag: "🇸🇦", label: "Arabic" \}/;
if (regex.test(content)) {
  content = content.replace(regex, '{ code: "ar", flag: "🇩🇿", label: "Cezayir" }');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi. Arapca dili artik Cezayir bayragi ve etiketiyle gosteriliyor.');
} else {
  console.error('UYARI: hedef bulunamadi, mevcut hali kontrol et.');
}
