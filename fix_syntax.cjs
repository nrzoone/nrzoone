const fs = require('fs');
const path = require('path');
const srcDir = path.join(process.cwd(), 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
    const p = path.join(srcDir, f);
    let c = fs.readFileSync(p, 'utf8');
    
    // Fix );); or ); \n } or any similar stray characters
    const regex1 = /\}\)\.catch\(err => console\.error\("Sheets Sync Error:", err\)\);\s*\);\s*\}/g;
    const rep1 = '}).catch(err => console.error("Sheets Sync Error:", err));\n            }';
    let nc = c.replace(regex1, rep1);

    // Some might have ).catch(e => console.error(e)); );
    const regex2 = /\}\)\.catch\(err => console\.error\("Sheets Sync Error:", err\)\);\s*catch\([^\)]+\);\);?/g;
    const rep2 = '}).catch(err => console.error("Sheets Sync Error:", err));';
    nc = nc.replace(regex2, rep2);

    // Let's just fix anything that starts with err)); and has trailing garbage before }
    const regex3 = /err\)\)\;\s*\)\;/g;
    const rep3 = 'err));';
    nc = nc.replace(regex3, rep3);

    // Let's also check for addDoc(collection... that got merged or mangled
    // We can just rely on regex3 first.

    if (c !== nc) {
        fs.writeFileSync(p, nc);
        console.log('Fixed ' + f);
    }
});
