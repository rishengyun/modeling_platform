const fs = require('fs');
const path = require('path');

const extensions = ['.vue', '.css', '.html', '.ts', '.js', '.scss'];
const excludeDirs = ['node_modules', 'dist', '.git'];

function replaceInFile(filePath) {
    const ext = path.extname(filePath);
    if (!extensions.includes(ext)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content
        .replace(/#4c75a3/ig, '#4c75a3')
        .replace(/#1a2942/ig, '#1a2942')
        .replace(/#2a476e/ig, '#2a476e')
        .replace(/#1a2942/ig, '#1a2942');
        
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (excludeDirs.includes(file)) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

walkDir(__dirname);
console.log('Replacement complete.');
