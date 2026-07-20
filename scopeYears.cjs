const fs = require('fs');
const path = require('path');

// 1. Update DataEntryLayout.tsx
let layoutContent = fs.readFileSync('src/components/layout/DataEntryLayout.tsx', 'utf8');
// add activeTab to scopeKey in DataEntryLayout
if (!layoutContent.includes('scopeKey={`${moduleName}_${activeTab}`}')) {
  layoutContent = layoutContent.replace(
    '<YearSelector year={year} setYear={setYear} yearOptions={yearOptions} />',
    '<YearSelector year={year} setYear={setYear} yearOptions={yearOptions} scopeKey={`${moduleName}_${activeTab}`} />'
  );
  fs.writeFileSync('src/components/layout/DataEntryLayout.tsx', layoutContent);
}

// 2. Update all Dashboard pages
const dashDir = 'src/pages/Dashboard';
const dashFiles = fs.readdirSync(dashDir);
dashFiles.forEach(f => {
  if (f.endsWith('.tsx')) {
    const p = path.join(dashDir, f);
    let content = fs.readFileSync(p, 'utf8');
    const dept = f.replace('Dashboard.tsx', '');
    
    // Update getDefaultYear() call
    content = content.replace(/getDefaultYear\(\)/g, `getDefaultYear('${dept}_Dashboard')`);
    
    // Update YearSelector
    content = content.replace(/<YearSelector year=\{year\} setYear=\{setYear\} \/>/g, `<YearSelector year={year} setYear={setYear} scopeKey="${dept}_Dashboard" />`);
    
    fs.writeFileSync(p, content);
  }
});

// 3. Update all DataEntry pages
const entryDir = 'src/pages/DataEntry';
const entryFiles = fs.readdirSync(entryDir);
entryFiles.forEach(f => {
  if (f.endsWith('.tsx')) {
    const p = path.join(entryDir, f);
    let content = fs.readFileSync(p, 'utf8');
    const dept = f.replace('DataEntry.tsx', '');
    
    // Most data entry pages have activeTab or nativeTabs.
    // If it has nativeTabs, it sets initial state. We need to pass the active tab.
    // However, the active tab state is defined right above the year state.
    
    // If it's a page with nativeTabs, we should update getDefaultYear to use nativeTabs[0].key
    if (content.includes('nativeTabs[0].key')) {
      content = content.replace(/getDefaultYear\(\)/g, `getDefaultYear('${dept}_' + nativeTabs[0].key)`);
    } else {
      // If it doesn't have nativeTabs (e.g. single tab), maybe it has activeTab?
      // For Demographics, it only has one implicit tab, or no tabs?
      // Let's check DemographicsDataEntry.tsx...
      content = content.replace(/getDefaultYear\(\)/g, `getDefaultYear('${dept}_DataEntry')`);
    }
    
    // We must also add useEffect to update year when activeTab changes, but wait...
    // Does DataEntryLayout handle year state?
    // No, the parent DataEntry page has `const [year, setYear] = useState(...)`.
    // Let's just add a useEffect if there's an activeTab!
    if (content.includes('activeTab') && !content.includes('useEffect(() => {\\n    setYear')) {
       // Need to import useEffect if not there
       if (!content.includes('useEffect')) {
         content = content.replace(/import \{ useState \}/, 'import { useState, useEffect }');
         content = content.replace(/import \{ useState,([^}]+)\}/, 'import { useState, useEffect, $1}');
       }
       
       // insert useEffect after const [year, setYear] = useState(...)
       const yearRegex = /const \[year, setYear\] = useState\([^)]+\);/;
       content = content.replace(yearRegex, match => {
         return match + `\n\n  useEffect(() => {\n    setYear(getDefaultYear('${dept}_' + activeTab));\n  }, [activeTab]);`;
       });
    }

    fs.writeFileSync(p, content);
  }
});
console.log('Update script finished');
