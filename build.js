const fs = require('fs');
const path = require('path');

let indexHtml = fs.readFileSync('src/layout.html', 'utf8');

const views = fs.readdirSync('src/views');

views.forEach(view => {
    if (view.endsWith('.html')) {
        const name = view.replace('.html', '').toUpperCase();
        const content = fs.readFileSync(path.join('src/views', view), 'utf8');
        indexHtml = indexHtml.replace(`<!-- __INCLUDE_${name}__ -->`, content);
        console.log(`Injected: ${view}`);
    }
});

const minify = require('html-minifier').minify;

// Minify the final injected HTML
const minifiedHtml = minify(indexHtml, {
    removeAttributeQuotes: false,
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
});

const originalSize = Buffer.byteLength(indexHtml, 'utf8');
const newSize = Buffer.byteLength(minifiedHtml, 'utf8');

fs.writeFileSync('index.html', minifiedHtml, 'utf8');

console.log(`Build complete: index.html optimized!`);
console.log(`Size reduced from ${(originalSize/1024).toFixed(2)}KB to ${(newSize/1024).toFixed(2)}KB.`);
