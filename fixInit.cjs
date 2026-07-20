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
    if (moduleMatch) {
       const moduleName = moduleMatch[1];
       
       // Replace the initial useState value to use the moduleName and the first active tab (which is usually what activeTab defaults to)
       // Let's just look at how activeTab is initialized: const [activeTab, setActiveTab] = useState<TabType>('education');
       const tabMatch = content.match(/const \[activeTab, setActiveTab\] = useState(?:<[^>]+>)?\(([^)]+)\)/);
       if (tabMatch) {
         let initTab = tabMatch[1].replace(/['"]/g, '');
         if (initTab.includes('nativeTabs')) initTab = '\${nativeTabs[0].key}'; // if it's nativeTabs[0].key
         
         const yearRegex = /const \[year, setYear\] = useState\([^)]+\);/;
         // We must handle cases where it spans, or just match exactly:
         // Actually, let's just use string replacement for the exact string since we know we wrote it
         const dept = f.replace('DataEntry.tsx', '');
         content = content.replace(`getDefaultYear('${dept}_DataEntry')`, `getDefaultYear(\`${moduleName}_\${${tabMatch[1]}}\`)`);
         content = content.replace(`getDefaultYear('${dept}_' + nativeTabs[0].key)`, `getDefaultYear(\`${moduleName}_\${nativeTabs[0].key}\`)`);
         
         fs.writeFileSync(p, content);
         console.log('Fixed initial state in ' + p);
       }
    }
  }
});
