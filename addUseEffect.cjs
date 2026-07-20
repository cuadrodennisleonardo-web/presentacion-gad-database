const fs = require('fs');
const path = require('path');
const entryDir = 'src/pages/DataEntry';
const entryFiles = fs.readdirSync(entryDir);
entryFiles.forEach(f => {
  if (f.endsWith('.tsx')) {
    const p = path.join(entryDir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Extract module name
    const moduleMatch = content.match(/moduleName="([^"]+)"/);
    if (moduleMatch && content.includes('activeTab')) {
       const moduleName = moduleMatch[1];
       
       if (!content.includes('useEffect(() => {\\n    setYear(getDefaultYear')) {
         const lines = content.split('\n');
         const out = [];
         let inserted = false;
         for (let i = 0; i < lines.length; i++) {
           out.push(lines[i]);
           if (lines[i].includes('const [year, setYear] = useState(') && !inserted) {
             out.push('');
             out.push('  useEffect(() => {');
             out.push(`    setYear(getDefaultYear('${moduleName}_' + activeTab));`);
             out.push('  }, [activeTab]);');
             inserted = true;
           }
         }
         content = out.join('\n');
         fs.writeFileSync(p, content);
         console.log('Updated ' + p);
       }
    }
  }
});
