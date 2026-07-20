const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard/InfrastructureDashboard.tsx', 'utf8');

const regex = /<div className="flex items-center gap-2">\s*<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Filter:<\/label>\s*<input\s*type="number"\s*className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"\s*value={year}\s*onChange={\(e\) => setYear\(parseInt\(e\.target\.value\) \|\| new Date\(\)\.getFullYear\(\)\)}\s*\/>\s*<\/div>/g;

content = content.replace(regex, '<YearSelector year={year} setYear={setYear} />');
fs.writeFileSync('src/pages/Dashboard/InfrastructureDashboard.tsx', content);
console.log('Replaced');
