const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';

// Color Palette (Clean Municipal Cyan / Slate Theme - Minimalist & Executive)
const COLORS = {
  bgLight: 'F8FAFC',
  primaryBrand: '0E7490', // Cyan-700
  secondaryBrand: '0891B2', // Cyan-600
  darkSlate: '0F172A',
  textDark: '1E293B',
  textMuted: '64748B',
  white: 'FFFFFF',
  cardBg: 'F8FAFC',
  cardBorder: 'E2E8F0',
  cyanLight: 'E0F2FE',
  cyanText: '0369A1',
  emeraldLight: 'ECFDF5',
  emeraldText: '047857',
  purpleLight: 'F5F3FF',
  purpleText: '6D28D9'
};

// Common slide footer (Clean, No emojis)
function addFooter(slide, current, total) {
  slide.addText('Municipality of Presentacion, Camarines Sur — Centralized Municipal Database & GAD System', {
    x: 0.8,
    y: 7.0,
    w: 8.5,
    h: 0.3,
    fontSize: 9,
    color: COLORS.textMuted,
    fontFace: 'Arial'
  });
  slide.addText(`${current} / ${total}`, {
    x: 11.5,
    y: 7.0,
    w: 1.0,
    h: 0.3,
    fontSize: 9,
    align: 'right',
    color: COLORS.textMuted,
    fontFace: 'Arial'
  });
}

// ==========================================
// SLIDE 1: Title Slide (Completely Clean & Open, No Box/Rectangle Container)
// ==========================================
const s1 = pptx.addSlide();
s1.background = { color: 'F0FDFA' };

// Clean vertical accent line
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0.8,
  y: 1.6,
  w: 0.08,
  h: 4.4,
  fill: { color: COLORS.primaryBrand },
  line: { color: COLORS.primaryBrand, width: 0 }
});

s1.addText('REPUBLIC OF THE PHILIPPINES • PROVINCE OF CAMARINES SUR', {
  x: 1.2,
  y: 1.7,
  w: 10.5,
  h: 0.3,
  fontSize: 11,
  bold: true,
  color: COLORS.primaryBrand,
  fontFace: 'Arial'
});

s1.addText('Centralized Municipal Database\n& GAD Information System', {
  x: 1.2,
  y: 2.2,
  w: 11.0,
  h: 1.8,
  fontSize: 34,
  bold: true,
  color: COLORS.darkSlate,
  fontFace: 'Arial'
});

s1.addText('A unified digital governance platform for evidence-based planning, policy formulation, resource allocation, and gender-responsive municipal development.', {
  x: 1.2,
  y: 4.2,
  w: 10.0,
  h: 0.8,
  fontSize: 14,
  color: COLORS.textMuted,
  fontFace: 'Arial'
});

s1.addText('System Introduction & Live Demonstration\nPresented to LGU Department Heads & Leadership • Municipality of Presentacion', {
  x: 1.2,
  y: 5.3,
  w: 10.5,
  h: 0.7,
  fontSize: 12,
  color: COLORS.textDark,
  fontFace: 'Arial'
});

addFooter(s1, 1, 5);

// ==========================================
// SLIDE 2: Objectives & The Modern Solution
// ==========================================
const s2 = pptx.addSlide();
s2.background = { color: COLORS.white };

s2.addText('SYSTEM OBJECTIVES & VALUE', {
  x: 0.8,
  y: 0.6,
  w: 10.0,
  h: 0.3,
  fontSize: 10,
  bold: true,
  color: COLORS.primaryBrand,
  fontFace: 'Arial'
});

s2.addText('Transforming Municipal Data Management', {
  x: 0.8,
  y: 0.9,
  w: 11.5,
  h: 0.6,
  fontSize: 22,
  bold: true,
  color: COLORS.darkSlate,
  fontFace: 'Arial'
});

// Card 1: Traditional Bottlenecks
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8,
  y: 1.8,
  w: 3.6,
  h: 4.8,
  fill: { color: 'F8FAFC' },
  line: { color: 'E2E8F0', width: 1 }
});
s2.addText('Traditional Bottlenecks', {
  x: 1.1,
  y: 2.1,
  w: 3.0,
  h: 0.4,
  fontSize: 15,
  bold: true,
  color: '991B1B',
  fontFace: 'Arial'
});
s2.addText([
  { text: '• Fragmented paper forms and individual spreadsheet files across offices.\n\n' },
  { text: '• Inconsistent sex-disaggregated data required for GAD compliance.\n\n' },
  { text: '• Time-consuming consolidation during AIP and annual budget planning.\n\n' },
  { text: '• Risk of lost baseline data during personnel transitions.' }
], {
  x: 1.1,
  y: 2.6,
  w: 3.0,
  h: 3.6,
  fontSize: 11,
  color: COLORS.textDark,
  fontFace: 'Arial'
});

// Card 2: Centralized Solution
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 4.8,
  y: 1.8,
  w: 3.6,
  h: 4.8,
  fill: { color: 'F8FAFC' },
  line: { color: 'E2E8F0', width: 1 }
});
s2.addText('Centralized Platform', {
  x: 5.1,
  y: 2.1,
  w: 3.0,
  h: 0.4,
  fontSize: 15,
  bold: true,
  color: COLORS.primaryBrand,
  fontFace: 'Arial'
});
s2.addText([
  { text: '• Single municipal repository accessible 24/7 with cloud backup.\n\n' },
  { text: '• Standardized Male and Female disaggregation across all indicators.\n\n' },
  { text: '• Instant 1-click PDF and CSV reports for Sangguniang Bayan sessions.\n\n' },
  { text: '• Structured submission and verification flow before data commits.' }
], {
  x: 5.1,
  y: 2.6,
  w: 3.0,
  h: 3.6,
  fontSize: 11,
  color: COLORS.textDark,
  fontFace: 'Arial'
});

// Card 3: Executive Value
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 8.8,
  y: 1.8,
  w: 3.6,
  h: 4.8,
  fill: { color: 'F8FAFC' },
  line: { color: 'E2E8F0', width: 1 }
});
s2.addText('Executive Impact', {
  x: 9.1,
  y: 2.1,
  w: 3.0,
  h: 0.4,
  fontSize: 15,
  bold: true,
  color: '047857',
  fontFace: 'Arial'
});
s2.addText([
  { text: '• Evidence-based policy formulation and targeted resource allocation.\n\n' },
  { text: '• Seamless compliance with DILG, DSWD, DepEd, and GAD mandates.\n\n' },
  { text: '• Clear visibility into sector performance and community needs.\n\n' },
  { text: '• Standardized records for audits and annual accomplishment reports.' }
], {
  x: 9.1,
  y: 2.6,
  w: 3.0,
  h: 3.6,
  fontSize: 11,
  color: COLORS.textDark,
  fontFace: 'Arial'
});

addFooter(s2, 2, 5);

// ==========================================
// SLIDE 3: User Access & Role Breakdown
// ==========================================
const s3 = pptx.addSlide();
s3.background = { color: COLORS.white };

s3.addText('SECURITY & ROLE-BASED ACCESS CONTROL', {
  x: 0.8,
  y: 0.6,
  w: 10.0,
  h: 0.3,
  fontSize: 10,
  bold: true,
  color: COLORS.primaryBrand,
  fontFace: 'Arial'
});

s3.addText('User Access & Permission Structure', {
  x: 0.8,
  y: 0.9,
  w: 11.5,
  h: 0.6,
  fontSize: 22,
  bold: true,
  color: COLORS.darkSlate,
  fontFace: 'Arial'
});

const roles = [
  {
    title: 'Super Admin',
    subtitle: 'System Administrators / MPDO / IT',
    color: 'E0F2FE',
    border: '0284C7',
    textColor: '0369A1',
    items: [
      'Full administrative access across all sectors',
      'Manage user accounts, roles, and department permissions',
      'Create and edit custom tables via Dynamic Tables Manager',
      'Review, approve, or reject department data submissions',
      'Inspect complete municipal audit logs and history'
    ],
    x: 0.8
  },
  {
    title: 'Department Encoders',
    subtitle: 'Sector Heads & Data Officers (MSWDO, MAO, MHO, etc.)',
    color: 'ECFDF5',
    border: '10B981',
    textColor: '047857',
    items: [
      'Sector-specific data entry (Demographics, Health, Agriculture, etc.)',
      'Batch data importing via CSV spreadsheets',
      'Automatic calculation of gender subtotals and ratios',
      'Submit updated data for administrative review and verification',
      'Export department data to PDF and CSV tables'
    ],
    x: 4.8
  },
  {
    title: 'Senior Viewers',
    subtitle: 'Executive Leadership (Mayor, SB Members, Observers)',
    color: 'F5F3FF',
    border: '8B5CF6',
    textColor: '6D28D9',
    items: [
      'Read-only access to all municipal dashboards and indicators',
      'Real-time visualization of statistical charts and gender splits',
      'Interactive GIS map navigation and localized profile viewing',
      'One-click PDF and CSV export for sessions and committee hearings',
      'Secure viewing without risk of accidental data modification'
    ],
    x: 8.8
  }
];

roles.forEach(r => {
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: r.x,
    y: 1.8,
    w: 3.6,
    h: 4.8,
    fill: { color: r.color },
    line: { color: r.border, width: 1 }
  });

  s3.addText(r.title, {
    x: r.x + 0.2,
    y: 2.0,
    w: 3.2,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: r.textColor,
    fontFace: 'Arial'
  });

  s3.addText(r.subtitle, {
    x: r.x + 0.2,
    y: 2.35,
    w: 3.2,
    h: 0.45,
    fontSize: 9.5,
    bold: true,
    color: COLORS.textMuted,
    fontFace: 'Arial'
  });

  const bulletText = r.items.map(item => `• ${item}\n\n`).join('');
  s3.addText(bulletText, {
    x: r.x + 0.2,
    y: 2.9,
    w: 3.2,
    h: 3.5,
    fontSize: 10.5,
    color: COLORS.textDark,
    fontFace: 'Arial'
  });
});

addFooter(s3, 3, 5);

// ==========================================
// SLIDE 4: Core System Capabilities
// ==========================================
const s4 = pptx.addSlide();
s4.background = { color: COLORS.white };

s4.addText('CORE PLATFORM CAPABILITIES', {
  x: 0.8,
  y: 0.6,
  w: 10.0,
  h: 0.3,
  fontSize: 10,
  bold: true,
  color: COLORS.primaryBrand,
  fontFace: 'Arial'
});

s4.addText('Key Features of the Municipal Portal', {
  x: 0.8,
  y: 0.9,
  w: 11.5,
  h: 0.6,
  fontSize: 22,
  bold: true,
  color: COLORS.darkSlate,
  fontFace: 'Arial'
});

const features = [
  {
    title: 'Sector Dashboards',
    desc: 'Visual dashboards for Demographics, Social Development, Economic Development, Infrastructure, Local Governance, and Justice & Peace.',
    x: 0.8
  },
  {
    title: 'Interactive GIS Map',
    desc: 'Official boundary map of Presentacion. Click any barangay to inspect localized population counts, registered farmers, and sector metrics.',
    x: 3.8
  },
  {
    title: 'Dynamic Table Maker',
    desc: 'Allows creation of custom tables anytime (Gender Splits, Subtables, Ratios, Budgets) without programming or external software costs.',
    x: 6.8
  },
  {
    title: 'Executive Reporting',
    desc: 'Instant generation of formatted PDF tables and CSV exports for Sangguniang Bayan council sessions, hearings, and national audits.',
    x: 9.8
  }
];

features.forEach(f => {
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: f.x,
    y: 1.8,
    w: 2.7,
    h: 4.8,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  s4.addText(f.title, {
    x: f.x + 0.2,
    y: 2.1,
    w: 2.3,
    h: 0.5,
    fontSize: 15,
    bold: true,
    color: COLORS.darkSlate,
    fontFace: 'Arial'
  });

  s4.addText(f.desc, {
    x: f.x + 0.2,
    y: 2.8,
    w: 2.3,
    h: 3.4,
    fontSize: 11,
    color: COLORS.textMuted,
    fontFace: 'Arial'
  });
});

addFooter(s4, 4, 5);

// ==========================================
// SLIDE 5: Live Demonstration Agenda
// ==========================================
const s5 = pptx.addSlide();
s5.background = { color: '0F172A' }; // Dark Slate for transition to demo

s5.addText('SYSTEM WALKTHROUGH', {
  x: 0.8,
  y: 0.8,
  w: 10.0,
  h: 0.3,
  fontSize: 11,
  bold: true,
  color: '38BDF8',
  fontFace: 'Arial'
});

s5.addText('Live System Demonstration', {
  x: 0.8,
  y: 1.2,
  w: 11.5,
  h: 0.8,
  fontSize: 30,
  bold: true,
  color: COLORS.white,
  fontFace: 'Arial'
});

s5.addText('Transitioning to the live web portal. Here is what we will explore:', {
  x: 0.8,
  y: 2.0,
  w: 11.0,
  h: 0.5,
  fontSize: 13,
  color: '94A3B8',
  fontFace: 'Arial'
});

const demoSteps = [
  { num: '1', title: 'Executive Overview Dashboard', desc: 'Real-time municipal KPIs, gender breakdown graphs, and sector summary.' },
  { num: '2', title: 'Interactive Presentacion Map', desc: 'Navigating territorial boundaries and localized barangay profiles.' },
  { num: '3', title: 'Departmental Data Entry', desc: 'Demonstrating structured entry grids, auto-calculating totals, and batch CSV imports.' },
  { num: '4', title: 'Dynamic Table Maker & 1-Click Reports', desc: 'Demonstrating how new tables are created and exported to formatted PDFs.' },
  { num: '5', title: 'Approvals & Audit Trail', desc: 'Demonstrating how encoder submissions are verified before updating permanent records.' }
];

demoSteps.forEach((step, idx) => {
  const y = 2.7 + (idx * 0.8);
  
  // Number box
  s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8,
    y: y,
    w: 0.55,
    h: 0.55,
    fill: { color: COLORS.primaryBrand },
    line: { color: '38BDF8', width: 1 }
  });
  s5.addText(step.num, {
    x: 0.8,
    y: y,
    w: 0.55,
    h: 0.55,
    fontSize: 12,
    bold: true,
    align: 'center',
    color: COLORS.white,
    fontFace: 'Arial'
  });

  // Step Title & Desc
  s5.addText([
    { text: `${step.title}: `, options: { bold: true, color: COLORS.white, fontSize: 12 } },
    { text: step.desc, options: { color: 'CBD5E1', fontSize: 11 } }
  ], {
    x: 1.5,
    y: y + 0.05,
    w: 10.5,
    h: 0.5,
    fontFace: 'Arial'
  });
});

s5.addText('Live Portal: https://presentacion-gad.vercel.app/ • Ready for Demonstration & Discussion', {
  x: 0.8,
  y: 6.8,
  w: 11.5,
  h: 0.4,
  fontSize: 11,
  bold: true,
  color: '38BDF8',
  fontFace: 'Arial'
});

const outputPath = path.join(__dirname, 'LGU_Presentacion_Introduction.pptx');

pptx.writeFile({ fileName: outputPath })
  .then(fileName => {
    console.log(`SUCCESS: PowerPoint saved to ${fileName}`);
  })
  .catch(err => {
    console.error(`ERROR: ${err}`);
  });
