const fs = require('fs');

const fixUnused = (file, removals) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const regex of removals) {
    content = content.replace(regex, '');
  }
  fs.writeFileSync(file, content);
};

// 1. DynamicDashboardCharts
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/components/common/DynamicDashboardCharts.tsx', [
  /type DynamicSchema = Database\['public'\]\['Tables'\]\['dynamic_schemas'\]\['Row'\];\n/g
]);

// 2. DashboardPage
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/DashboardPage.tsx', [
  /import \{ useQuery \} from "@tanstack\/react-query";\n/g,
  /import \{ CHART_COLORS \} from "@\/config\/chartColors";\n/g
]);

// 3. DemographicsDashboard
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/DemographicsDashboard.tsx', [
  /import \{ CHART_COLORS \} from "@\/config\/chartColors";\n/g
]);

// 4. GADDashboard
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/GADDashboard.tsx', [
  /import \{ CHART_COLORS \} from "@\/config\/chartColors";\n/g
]);

// 5. GovernanceDashboard
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/GovernanceDashboard.tsx', [
  /import ErrorBoundary from "@\/components\/common\/ErrorBoundary";\n/g
]);

// 6. InfrastructureDashboard
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/InfrastructureDashboard.tsx', [
  /import ErrorBoundary from "@\/components\/common\/ErrorBoundary";\n/g,
  /import \{ CHART_COLORS \} from "@\/config\/chartColors";\n/g
]);

// 7. JusticeDashboard
fixUnused('c:/Users/Admin/Documents/Municipal Database/Presentacion Database/src/pages/Dashboard/JusticeDashboard.tsx', [
  /import ErrorBoundary from "@\/components\/common\/ErrorBoundary";\n/g,
  /import \{ CHART_COLORS \} from "@\/config\/chartColors";\n/g
]);

console.log("Unused imports removed.");
