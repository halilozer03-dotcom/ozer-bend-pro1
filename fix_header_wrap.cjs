const fs = require('fs');
const filePath = 'src/style.css';
let content = fs.readFileSync(filePath, 'utf8');

const target = `.dimsHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}`;

const replacement = `.dimsHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  row-gap: 10px;
}

.dimsHeaderRow h2 {
  flex: 1 1 auto;
  min-width: 0;
}

.favWrap {
  flex: 0 0 auto;
}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Tamamlandi. dimsHeaderRow artik satir sarabiliyor, tasma engellendi.');
} else {
  console.error('UYARI: hedef CSS blogu bulunamadi.');
}
