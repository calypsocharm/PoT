const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const regex = /<!-- ─────────────── \w+.*?TAB ─────────── -->\s*<section class="tab-panel.*?" id="tab-.*?">[\s\S]*?<\/section>/g;

const matches = [];
let match;
while ((match = regex.exec(indexHtml)) !== null) {
  matches.push({
    full: match[0],
    id: match[0].match(/id="(tab-[^"]+)"/)[1]
  });
}

if (!fs.existsSync('src')) fs.mkdirSync('src');
if (!fs.existsSync('src/views')) fs.mkdirSync('src/views');

let newLayout = indexHtml;

matches.forEach(m => {
  const name = m.id.replace('tab-', '');
  fs.writeFileSync(`src/views/${name}.html`, m.full, 'utf8');
  newLayout = newLayout.replace(m.full, `<!-- __INCLUDE_${name.toUpperCase()}__ -->`);
  console.log(`Extracted: ${name}`);
});

fs.writeFileSync('src/layout.html', newLayout, 'utf8');
console.log('Done splitting! Run node scripts/build.js to compile.');
