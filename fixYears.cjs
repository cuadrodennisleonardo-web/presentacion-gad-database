const fs = require('fs');
const path = require('path');

const dirs = [
  'src/pages/Dashboard',
  'src/pages/DataEntry'
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    if (f.endsWith('.tsx')) {
      const p = path.join(dir, f);
      let content = fs.readFileSync(p, 'utf8');
      
      let changed = false;
      if (content.includes('useState(new Date().getFullYear())')) {
        content = content.replace(/useState\(new Date\(\)\.getFullYear\(\)\)/g, 'useState(getDefaultYear())');
        
        // Add import { getDefaultYear } from '@/utils/yearUtils';
        if (!content.includes('getDefaultYear')) {
          content = "import { getDefaultYear } from '@/utils/yearUtils';\n" + content;
        }
        changed = true;
      }
      
      // Also for Dashboards, replace the hardcoded Year Filter with YearSelector
      if (dir === 'src/pages/Dashboard' && content.includes('<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Filter:</label>')) {
        content = content.replace(/<div className="flex items-center gap-2">\s*<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Filter:<\/label>\s*<input[^>]+>\s*<\/div>/g, '<YearSelector year={year} setYear={setYear} />');
        if (!content.includes('YearSelector')) {
          content = "import YearSelector from '@/components/common/YearSelector';\n" + content;
        }
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(p, content);
        console.log('Updated ' + p);
      }
    }
  });
});
