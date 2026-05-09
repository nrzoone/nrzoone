const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src');
const files = [
    'MaCollection.jsx',
    'MaBoroMeyeCollection.jsx',
    'KidsCollection.jsx',
    'HijabCollection.jsx',
    'FaizaCollection.jsx',
    'ClassicCollection.jsx',
    'BoroBonCollection.jsx'
];

files.forEach(f => {
    const p = path.join(srcDir, f);
    if (!fs.existsSync(p)) return;

    let c = fs.readFileSync(p, 'utf8');

    // Fix the broken RefreshCw import (missing comma)
    // We look for any word followed by whitespace and RefreshCw
    c = c.replace(/(\w+)\s+RefreshCw/, '$1,\n    RefreshCw');

    fs.writeFileSync(p, c);
    console.log('Fixed ' + f);
});
