const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/DataEntry';
const files = [
  { file: 'EconomicDevelopmentDataEntry.tsx', dept: 'Economic Development', table: 'econ_dev_stats' },
  { file: 'DemographicsDataEntry.tsx', dept: 'Demographics', table: 'population_stats' },
  { file: 'JusticeDataEntry.tsx', dept: 'Justice & Safety', table: 'justice_stats' },
  { file: 'InfrastructureDataEntry.tsx', dept: 'Infrastructure', table: 'infra_stats' },
  { file: 'GovernanceDataEntry.tsx', dept: 'Governance', table: 'governance_stats' },
  { file: 'GADDataEntry.tsx', dept: 'Institutional GAD', table: 'gad_stats' }
];

for (const { file, dept, table } of files) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) continue;

  let content = fs.readFileSync(p, 'utf8');

  // Add import if not present
  if (!content.includes('useDataEntryStats')) {
    content = content.replace(
      /import DataEntryLayout from/g,
      `import { useDataEntryStats } from '@/hooks/queries/useDataEntryStats';\nimport DataEntryLayout from`
    );
  }

  // Replace useQuery block
  // We need to match:
  // const { data: fetchedData, isLoading } = useQuery({
  //   queryKey: ['native_data', ...],
  //   ...
  //   }
  // });
  // Since regex multiline matching can be tricky, let's use string manipulation based on the start and end tokens
  const startTokens = [
    `const { data: fetchedData, isLoading } = useQuery({`,
    `queryKey: ['native_data', '${dept}', year],`,
  ];
  
  const idx = content.indexOf(startTokens[0]);
  if (idx !== -1) {
    // Find the matching `});` after idx
    // But since it's a block, we need to match `{` and `}`
    let bracesCount = 0;
    let foundStart = false;
    let endIdx = -1;
    for (let i = idx; i < content.length; i++) {
      if (content[i] === '{') {
        bracesCount++;
        foundStart = true;
      } else if (content[i] === '}') {
        bracesCount--;
      }
      
      if (foundStart && bracesCount === 0) {
        // we reached the end of `useQuery({...})`
        // the next character should be `)`
        if (content[i+1] === ')') {
          endIdx = i + 2;
          if (content[i+2] === ';') {
            endIdx++;
          }
          break;
        }
      }
    }
    
    if (endIdx !== -1) {
      const replacement = `const { data: fetchedData, isLoading } = useDataEntryStats('${dept}', '${table}', year);`;
      content = content.substring(0, idx) + replacement + content.substring(endIdx);
    }
  }

  fs.writeFileSync(p, content);
}
console.log('Refactored all DataEntry files.');
