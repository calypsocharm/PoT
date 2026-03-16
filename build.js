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

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Build complete: index.html updated!');
