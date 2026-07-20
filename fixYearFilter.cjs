const fs = require('fs');
const path = require('path');

const dirs = [
  'src/pages/Dashboard'
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    if (f.endsWith('.tsx')) {
      const p = path.join(dir, f);
      let content = fs.readFileSync(p, 'utf8');
      
      const idx = content.indexOf('<div className="flex items-center gap-2"');
      if (idx !== -1 && content.includes('Year Filter:</label>')) {
        const start = idx;
        const endStr = '/>\n          </div>';
        const end = content.indexOf(endStr, start);
        if (end !== -1) {
          const toReplace = content.substring(start, end + endStr.length);
          if (toReplace.includes('Year Filter')) {
            content = content.replace(toReplace, '<YearSelector year={year} setYear={setYear} />');
            fs.writeFileSync(p, content);
            console.log('Replaced Year Filter in ' + p);
          }
        } else {
           // Maybe it's formatted differently
           const endStr2 = '/>\r\n          </div>';
           const end2 = content.indexOf(endStr2, start);
           if (end2 !== -1) {
             const toReplace = content.substring(start, end2 + endStr2.length);
             content = content.replace(toReplace, '<YearSelector year={year} setYear={setYear} />');
             fs.writeFileSync(p, content);
             console.log('Replaced Year Filter in ' + p);
           } else {
             // Fallback regex
             const regex = /<div className="flex items-center gap-2">[\s\S]*?<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Filter:<\/label>[\s\S]*?<input[\s\S]*?\/>\s*<\/div>/g;
             content = content.replace(regex, '<YearSelector year={year} setYear={setYear} />');
             fs.writeFileSync(p, content);
             console.log('Regex Replaced Year Filter in ' + p);
           }
        }
      }
    }
  });
});
