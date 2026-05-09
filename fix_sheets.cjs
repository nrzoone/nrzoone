const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));
let updatedCount = 0;

files.forEach(f => {
    const p = path.join(srcDir, f);
    let c = fs.readFileSync(p, 'utf8');
    
    const regex = /const params = new URLSearchParams\(sheetData\)(?:\.toString\(\))?;\s*fetch\(`\$\{GOOGLE_SHEET_URL\}\?\$\{params\}`,\s*\{\s*method:\s*'GET',\s*mode:\s*'no-cors'\s*\}\)(?:\s*\.catch\([^\)]+\);?)?/g;
    
    const rep = `fetch(GOOGLE_SHEET_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sheetData)
                }).catch(err => console.error("Sheets Sync Error:", err));`;
                
    const newC = c.replace(regex, rep);
    if (c !== newC) {
        fs.writeFileSync(p, newC);
        console.log('Updated ' + f);
        updatedCount++;
    }
});

console.log("Total updated:", updatedCount);
