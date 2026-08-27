const fs = require('fs');
const path = require('path');

// تأكد من اسم الملف الصحيح
const fontPath = path.join(__dirname, '../public/fonts/NotoSansArabic-Regular.ttf'); // ✅ صحيح
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

console.log(fontBase64);