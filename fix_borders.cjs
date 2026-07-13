const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/DataEntry';
const files = fs.readdirSync(dir).filter(f => f.endsWith('DataEntry.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/dark:border-gray-700/g, 'dark:border-gray-800');
  fs.writeFileSync(p, content);
}

// Also in dynamic grid
const p2 = 'c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/components/common/DynamicDataEntryGrid.tsx';
let content2 = fs.readFileSync(p2, 'utf8');
content2 = content2.replace(/dark:border-gray-700/g, 'dark:border-gray-800');
fs.writeFileSync(p2, content2);

console.log('Fixed border colors');
