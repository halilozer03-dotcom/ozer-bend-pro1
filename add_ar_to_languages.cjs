const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /(\{ code: "zh", flag: "[^"]*", label: "中文" \})\n\];/;
if (regex.test(content)) {
  content = content.replace(regex, `$1,\n  { code: "ar", flag: "🇸🇦", label: "Arabic" }\n];`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi. Arapca LANGUAGES dizisine eklendi.');
} else {
  console.error('UYARI: zh sonrasi hala bulunamadi.');
}
