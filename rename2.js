const fs = require('fs');
const path = require('path');

const directory = __dirname;

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'artifacts') {
      continue;
    }
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (['.html', '.js', '.css', '.md', '.sol', '.json'].includes(path.extname(dirFile))) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync(directory);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/isActivated/g, "isActivated");
  content = content.replace(/botcy-activated/g, "botcy-activated");
  content = content.replace(/Activated/g, "Activated");
  content = content.replace(/isActivated/g, "isActivated");
  content = content.replace(/Activate BOTCY/g, "Activate BOTCY");
  content = content.replace(/botcy-protocol/g, "botcy-protocol");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
}
