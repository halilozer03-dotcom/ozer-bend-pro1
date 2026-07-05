const fs = require('fs');
const filePath = 'src/main.jsx';
const cssPath = 'src/style.css';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

// 1) DICT icindeki 'ar' blogunu kaldir
const arBlockRegex = /,\n  ar: \{[\s\S]*?\n  \}/;
if (arBlockRegex.test(content)) {
  content = content.replace(arBlockRegex, '');
  changed++;
  console.log('ar dil blogu DICT icinden kaldirildi.');
} else {
  console.log('ar dil blogu bulunamadi (zaten yok).');
}

// 2) LANGUAGES dizisinden ar girisini kaldir
const langArrRegex = /,\n  \{ code: "ar"[^}]*\}/;
if (langArrRegex.test(content)) {
  content = content.replace(langArrRegex, '');
  changed++;
  console.log('ar girisi LANGUAGES dizisinden kaldirildi.');
} else {
  console.log('ar girisi LANGUAGES dizisinde bulunamadi (zaten yok).');
}

// 3) main etiketindeki dir attribute'unu kaldir
const dirTagRegex = /<main className="app" dir=\{lang === "ar" \? "rtl" : "ltr"\}>/;
if (dirTagRegex.test(content)) {
  content = content.replace(dirTagRegex, '<main className="app">');
  changed++;
  console.log('main etiketindeki RTL dir kaldirildi.');
} else {
  console.log('main etiketinde RTL dir bulunamadi (zaten yok).');
}

fs.writeFileSync(filePath, content, 'utf8');

// 4) style.css'teki RTL blogunu kaldir
let cssContent = fs.readFileSync(cssPath, 'utf8');
const cssBlockRegex = /\n\n\/\* ==== RTL \(Cezayir\/Arapca\) destegi ==== \*\/[\s\S]*$/;
if (cssBlockRegex.test(cssContent)) {
  cssContent = cssContent.replace(cssBlockRegex, '\n');
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('RTL CSS blogu style.css icinden kaldirildi.');
} else {
  console.log('RTL CSS blogu bulunamadi (zaten yok).');
}

console.log(`\nTamamlandi. main.jsx icinde ${changed} degisiklik geri alindi.`);
