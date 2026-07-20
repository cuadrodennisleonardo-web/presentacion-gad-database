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
      if (content.includes('getDefaultYear') && !content.includes('@/utils/yearUtils')) {
        content = "import { getDefaultYear } from '@/utils/yearUtils';\n" + content;
        changed = true;
      }
      if (content.includes('<YearSelector') && !content.includes('@/components/common/YearSelector')) {
        content = "import YearSelector from '@/components/common/YearSelector';\n" + content;
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(p, content);
        console.log('Fixed imports in ' + p);
      }
    }
  });
});
