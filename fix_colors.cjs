const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard';
const files = [
  'DashboardPage.tsx',
  'SocialDevelopmentDashboard.tsx',
  'EconomicDevelopmentDashboard.tsx',
  'DemographicsDashboard.tsx',
  'JusticeDashboard.tsx',
  'InfrastructureDashboard.tsx',
  'GovernanceDashboard.tsx',
  'GADDashboard.tsx'
];

for (const file of files) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) continue;
  
  let content = fs.readFileSync(p, 'utf8');
  
  // Add import if not present
  if (!content.includes('CHART_COLORS')) {
    content = content.replace(
      'import { supabase } from "@/config/supabase";',
      'import { CHART_COLORS } from "@/config/chartColors";\nimport { supabase } from "@/config/supabase";'
    );
  }
  
  // Replace Male/Female colors
  content = content.replace(/colors=\{\["#[0-9a-fA-F]{6}", "#[0-9a-fA-F]{6}"\]\}/g, (match, offset, str) => {
    // Basic heuristic: if the preceding lines have "Male" and "Female", use CHART_COLORS
    const pre = str.substring(offset - 200, offset);
    if (pre.includes('"Male"') && pre.includes('"Female"')) {
      return 'colors={[CHART_COLORS.male, CHART_COLORS.female]}';
    }
    return match;
  });

  // Specifically for Pie charts we can use CHART_COLORS.pie
  content = content.replace(/colors=\{\[("[#[0-9a-fA-F]{6}"(, )?]+)\]\}/g, (match, p1, offset, str) => {
    const pre = str.substring(offset - 200, offset);
    if (pre.includes('type="pie"')) {
      return 'colors={CHART_COLORS.pie}';
    }
    return match;
  });

  fs.writeFileSync(p, content);
}

console.log('Fixed dashboard chart colors');
