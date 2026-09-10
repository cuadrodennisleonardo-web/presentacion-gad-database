const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gjqeaggkyfxkhqzmkyfd.supabase.co';
const supabaseKey = 'sb_publishable_3NlVxxEondnz8YhYS57tZg_LSzfODAN';
const supabase = createClient(supabaseUrl, supabaseKey);

const OFFICIAL_BARANGAYS = [
  "Ayugao",
  "Bagong Sirang",
  "Baliguian",
  "Bantugan",
  "Bicalen",
  "Bitaogan",
  "Buenavista",
  "Bulalacao",
  "Cagnipa",
  "Lagha",
  "Lidong",
  "Liwacsa",
  "Maangas",
  "Pagsangaan",
  "Patrocinio",
  "Pili",
  "Sta. Maria",
  "Tanawan",
];

const BARANGAY_BASELINES = {
  "Ayugao": { pop: 980, hh: 215 },
  "Bagong Sirang": { pop: 1420, hh: 310 },
  "Baliguian": { pop: 1150, hh: 250 },
  "Bantugan": { pop: 1840, hh: 405 },
  "Bicalen": { pop: 1260, hh: 275 },
  "Bitaogan": { pop: 2150, hh: 470 },
  "Buenavista": { pop: 1380, hh: 300 },
  "Bulalacao": { pop: 1020, hh: 220 },
  "Cagnipa": { pop: 1490, hh: 325 },
  "Lagha": { pop: 890, hh: 195 },
  "Lidong": { pop: 1620, hh: 355 },
  "Liwacsa": { pop: 1080, hh: 235 },
  "Maangas": { pop: 1750, hh: 380 },
  "Pagsangaan": { pop: 1310, hh: 285 },
  "Patrocinio": { pop: 960, hh: 210 },
  "Pili": { pop: 1120, hh: 245 },
  "Sta. Maria": { pop: 1540, hh: 335 },
  "Tanawan": { pop: 1280, hh: 280 },
};

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateSql() {
  console.log("Fetching schemas and barangays from Supabase...");
  const { data: allBarangays } = await supabase.from('barangays').select('id, name');
  const { data: schemas } = await supabase.from('dynamic_schemas').select('*');

  const bMap = new Map();
  (allBarangays || []).forEach(b => {
    if (OFFICIAL_BARANGAYS.includes(b.name)) {
      bMap.set(b.name, b.id);
    }
  });

  let sql = `-- ==============================================================================
-- Migration: 035_seed_2026_complete_mock_data.sql
-- Description: Master 2026 Mock Data Seeding for Presentacion Municipal GAD Database
--              Populates:
--              1. Population & Households (all 18 Barangays)
--              2. All 27 Dynamic Schemas (all 18 Barangays across 5 Development Sectors)
--              3. GPB (GAD Plan & Budget) Entries
--              4. GFPS (GAD Focal Point System) Members
--              5. HGDG Project Scores & Budget Attributions
--              6. Compliance Status Indicators (JMC 2013-01)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. POPULATION & HOUSEHOLD STATS (YEAR 2026)
-- ==============================================================================
`;

  for (const [name, id] of bMap.entries()) {
    const base = BARANGAY_BASELINES[name] || { pop: 1200, hh: 260 };
    const maleCount = Math.round(base.pop * 0.505);
    const femaleCount = base.pop - maleCount;
    const totalPop = base.pop;
    const hhHeadF = Math.round(base.hh * 0.22);
    const hhHeadM = base.hh - hhHeadF;
    const totalHh = base.hh;
    const under18 = Math.round(totalPop * 0.33);
    const age60Plus = Math.round(totalPop * 0.09);
    const age19to59 = totalPop - under18 - age60Plus;

    sql += `
INSERT INTO public.population_stats (barangay_id, year, month_updated, male_count, female_count, total_population, household_heads_m, household_heads_f, household_heads_total, total_households, age_under_18, age_19_to_59, age_60_plus, updated_at)
VALUES ('${id}', 2026, 9, ${maleCount}, ${femaleCount}, ${totalPop}, ${hhHeadM}, ${hhHeadF}, ${totalHh}, ${totalHh}, ${under18}, ${age19to59}, ${age60Plus}, now())
ON CONFLICT (barangay_id, year) DO UPDATE SET
  male_count = EXCLUDED.male_count,
  female_count = EXCLUDED.female_count,
  total_population = EXCLUDED.total_population,
  household_heads_m = EXCLUDED.household_heads_m,
  household_heads_f = EXCLUDED.household_heads_f,
  household_heads_total = EXCLUDED.household_heads_total,
  total_households = EXCLUDED.total_households,
  age_under_18 = EXCLUDED.age_under_18,
  age_19_to_59 = EXCLUDED.age_19_to_59,
  age_60_plus = EXCLUDED.age_60_plus,
  updated_at = now();`;
  }

  sql += `\n\n-- ==============================================================================
-- 2. DYNAMIC TABLES DATA (YEAR 2026) ACROSS ALL 5 SECTORS
-- ==============================================================================
`;

  for (const schema of (schemas || [])) {
    const fields = schema.schema?.fields || [];
    sql += `\n-- Sector: ${schema.department} | Tab: ${schema.tab_name}\n`;

    for (const [bName, bId] of bMap.entries()) {
      const base = BARANGAY_BASELINES[bName] || { pop: 1200, hh: 260 };
      const dataObj = {};

      for (const field of fields) {
        const fid = field.id;
        const ftype = field.type;

        if (ftype === 'gender_split') {
          let tot = 0;
          let mRatio = 0.5;
          if (fid.includes('senior')) { tot = Math.round(base.pop * 0.085); mRatio = 0.44; }
          else if (fid.includes('pwd')) { tot = randBetween(15, 38); mRatio = 0.52; }
          else if (fid.includes('solo_parent')) { tot = randBetween(20, 50); mRatio = 0.20; }
          else if (fid.includes('elem')) { tot = Math.round(base.pop * 0.12); mRatio = 0.51; }
          else if (fid.includes('jhs')) { tot = Math.round(base.pop * 0.09); mRatio = 0.49; }
          else if (fid.includes('shs')) { tot = Math.round(base.pop * 0.06); mRatio = 0.48; }
          else if (fid.includes('osy')) { tot = randBetween(10, 28); mRatio = 0.58; }
          else if (fid.includes('tvet')) { tot = randBetween(12, 35); mRatio = 0.46; }
          else if (fid.includes('malnourish')) { tot = randBetween(3, 12); mRatio = 0.50; }
          else if (fid.includes('immuniz')) { tot = randBetween(30, 65); mRatio = 0.50; }
          else if (fid.includes('farmer')) { tot = randBetween(50, 150); mRatio = 0.68; }
          else if (fid.includes('fisher')) { tot = randBetween(25, 110); mRatio = 0.82; }
          else if (fid.includes('msme') || fid.includes('business')) { tot = randBetween(18, 60); mRatio = 0.35; }
          else if (fid.includes('labor') || fid.includes('employed')) { tot = Math.round(base.pop * 0.42); mRatio = 0.58; }
          else if (fid.includes('unemployed')) { tot = randBetween(15, 45); mRatio = 0.48; }
          else if (fid.includes('4ps')) { tot = randBetween(45, 110); mRatio = 0.12; }
          else { tot = randBetween(15, 50); mRatio = 0.50; }

          const m = Math.round(tot * mRatio);
          const f = tot - m;
          dataObj[fid] = { m, f, total: tot };
        } else if (ftype === 'single_value' || ftype === 'number') {
          if (fid.includes('maternal')) dataObj[fid] = randBetween(0, 1);
          else if (fid.includes('teen')) dataObj[fid] = randBetween(1, 6);
          else if (fid.includes('vawc')) dataObj[fid] = randBetween(0, 4);
          else if (fid.includes('bpo')) dataObj[fid] = randBetween(0, 3);
          else if (fid.includes('water') || fid.includes('electric')) dataObj[fid] = Math.round(base.hh * 0.92);
          else if (fid.includes('streetlight')) dataObj[fid] = randBetween(18, 42);
          else dataObj[fid] = randBetween(5, 40);
        } else if (ftype === 'percentage') {
          dataObj[fid] = (80 + Math.random() * 18).toFixed(1) + "%";
        } else if (ftype === 'currency') {
          dataObj[fid] = randBetween(180000, 450000);
        } else {
          dataObj[fid] = randBetween(10, 50);
        }
      }

      const jsonStr = JSON.stringify(dataObj).replace(/'/g, "''");
      sql += `INSERT INTO public.dynamic_data (barangay_id, year, month_updated, schema_id, data, updated_at)
VALUES ('${bId}', 2026, '9', '${schema.id}', '${jsonStr}'::jsonb, now())
ON CONFLICT (barangay_id, year, schema_id) DO UPDATE SET
  data = EXCLUDED.data,
  month_updated = EXCLUDED.month_updated,
  updated_at = now();\n`;
    }
  }

  sql += `\n-- ==============================================================================
-- 3. GAD PLAN & BUDGET (GPB) ENTRIES (YEAR 2026)
-- ==============================================================================

DELETE FROM public.gpb_entries WHERE year = 2026;

INSERT INTO public.gpb_entries (year, gender_issue, cause, gad_objective, relevant_ppa, gad_activity, performance_indicator, performance_target, gad_budget, budget_source, opr, status)
VALUES
  (2026, 'High prevalence of malnutrition among under-5 children in remote coastal puroks', 'Lack of regular community nutrition clinics and maternal education', 'Reduce child wasting and stunting by 40% across all 18 barangays', 'Maternal & Child Health Services Program', 'Supplementary feeding and monthly health caravan for pregnant & lactating mothers', 'Number of malnourished children provided with dietary supplementation', '350 Malnourished children & 200 pregnant mothers', 850000, 'GAD 5% Fund', 'Municipal Health Office / MSWDO', 'approved'),
  (2026, 'Limited economic opportunities and modern processing tools for rural women farmers and fisherfolk', 'Lack of capital, gender-responsive equipment, and post-harvest skills training', 'Enhance income generation capacity of 250 rural women through enterprise incubation', 'Agriculture Livelihood & Agri-Enterprise Development', 'Provision of solar dryers, cassava processors, and organic vegetable seed kits to women cooperatives', 'Number of women organized into accredited livelihood associations', '250 Women farmers & 8 coastal associations', 920000, 'General Fund / GAD', 'Municipal Agriculture Office (MAO)', 'approved'),
  (2026, 'Underreporting of domestic violence and lack of secure private intake spaces in barangay halls', 'Inadequate VAW Desk privacy, lack of trauma-informed intake training, and transportation barriers', 'Institutionalize fully functional VAW Desks with standardized case tracking across 18 barangays', 'Barangay VAWC Desk Capacity & Victim Support Program', 'Establishment of child/gender-friendly intake corners and paralegal orientation for desk officers', 'Number of Barangay VAW Desks meeting JMC 2013-01 standards', '18 Barangay VAW Desks equipped', 480000, 'GAD 5% Fund', 'MSWDO / PNP WCPD', 'approved'),
  (2026, 'Vulnerability of women, children, and elderly during disaster evacuations', 'Evacuation centers lack segregated sanitation facilities, child-friendly spaces, and maternal care rooms', 'Ensure gender-responsive disaster preparedness and emergency shelter management', 'Disaster Risk Reduction & Climate Change Adaptation', 'Retrofitting of 5 primary evacuation centers with dedicated lactating rooms and gender-segregated toilets', 'Number of evacuation facilities with designated women & child safe spaces', '5 Multi-purpose evacuation centers', 1450000, 'LDRRMF / GAD Fund', 'MDRRMO / Municipal Engineering', 'approved'),
  (2026, 'Uneven application of Harmonized Gender and Development Guidelines (HGDG) in LGU infrastructure projects', 'Limited technical capacity among municipal project engineers and department planners', 'Achieve 100% gender-responsiveness rating across major municipal capital projects', 'LGU Institutional Capacity Development & Gender Mainstreaming', '3-Day Hands-on Workshop on HGDG Tool Application and Gender Analysis for Technical Working Group', 'Percentage of major LGU project proposals subjected to HGDG assessment', '45 GFPS ExeCom and TWG members trained', 380000, 'GAD Fund / HRMO', 'GFPS Secretariat / MPDO', 'approved'),
  (2026, 'Gaps in real-time sex-disaggregated data reporting at the barangay level', 'Manual paper registries and fragmented departmental tracking sheets', 'Maintain and operate computerized Sex-Disaggregated Municipal GAD Database for all 18 barangays', 'Municipal GAD Information Management System', 'Deployment of cloud-synced GAD database system and quarterly data auditing sessions', 'Number of active sector modules synchronized with real-time barangay statistics', '18 Barangays / 5 Development Sectors', 520000, 'GAD Fund / IT Unit', 'MPDO / GAD Secretariat', 'approved');

-- ==============================================================================
-- 4. GAD FOCAL POINT SYSTEM (GFPS) MEMBERS (YEAR 2026)
-- ==============================================================================

DELETE FROM public.gfps_members WHERE year = 2026;

INSERT INTO public.gfps_members (name, position, office, role_in_gfps, committee, contact_number, email, year, is_active)
VALUES
  ('Hon. Municipal Mayor', 'Municipal Mayor / Chairperson', 'Office of the Mayor', 'chairperson', 'Executive Committee', '0917-111-0001', 'mayor@presentacion.gov.ph', 2026, true),
  ('Hon. Municipal Vice Mayor', 'Municipal Vice Mayor / Co-Chairperson', 'Office of the Vice Mayor', 'vice_chairperson', 'Executive Committee', '0917-111-0002', 'vicemayor@presentacion.gov.ph', 2026, true),
  ('Engr. Maria Elena Santos', 'Municipal Planning & Development Coordinator', 'MPDO', 'head_twg', 'Technical Working Group', '0918-222-0003', 'mpdo@presentacion.gov.ph', 2026, true),
  ('Dr. Roberto Alcantara', 'Municipal Health Officer', 'MHO', 'member', 'Technical Working Group', '0918-222-0004', 'mho@presentacion.gov.ph', 2026, true),
  ('Ms. Clarita De Guzman', 'Municipal Social Welfare & Development Officer', 'MSWDO', 'member', 'Technical Working Group', '0918-222-0005', 'mswdo@presentacion.gov.ph', 2026, true),
  ('Mr. Fernando Ramos', 'Municipal Agriculturist', 'MAO', 'member', 'Technical Working Group', '0918-222-0006', 'mao@presentacion.gov.ph', 2026, true),
  ('Engr. Danilo Cruz', 'Municipal Engineer', 'MEO', 'member', 'Technical Working Group', '0918-222-0007', 'meo@presentacion.gov.ph', 2026, true),
  ('Ms. Victoria Reyes', 'Municipal Budget Officer', 'MBO', 'member', 'Technical Working Group', '0918-222-0008', 'mbo@presentacion.gov.ph', 2026, true),
  ('PCPT Jonathan Mercado', 'Chief of Police', 'Presentacion MPS', 'member', 'Peace and Order / Justice', '0918-222-0009', 'pnp@presentacion.gov.ph', 2026, true),
  ('Mrs. Teresa Villanueva', 'President, Municipal Federation of Women CSOs', 'Civil Society Organizations', 'member', 'Civil Society / Sectoral Rep', '0919-333-0010', 'csowomen@presentacion.gov.ph', 2026, true);

-- ==============================================================================
-- 5. HGDG SCORES & BUDGET ATTRIBUTIONS (YEAR 2026)
-- ==============================================================================

DELETE FROM public.hgdg_scores WHERE year = 2026;

INSERT INTO public.hgdg_scores (year, program_name, implementing_office, checklist_type, raw_score, gender_rating, budget_attribution_pct, program_budget, attributed_gad_budget, assessment_notes)
VALUES
  (2026, 'Construction of Multi-Purpose Disaster Evacuation Center with Lactation Rooms and Segregated Washrooms', 'Municipal Engineering Office / MDRRMO', 'Infrastructure & Public Safety', 18.5, 'gender_responsive', 100, 8500000, 8500000, 'Fully compliant with gender design requirements including child-friendly spaces, breast-feeding stations, and well-lit ramps.'),
  (2026, 'High-Value Organic Crop Expansion & Agri-Enterprise Empowerment Project', 'Municipal Agriculture Office', 'Agriculture & Agrarian Reform', 16.2, 'gender_responsive', 100, 3200000, 3200000, 'Integrated women farmers in key leadership roles, training schedules adapted to childcare hours, sex-disaggregated monitoring.'),
  (2026, 'Upgrading of Primary Healthcare and Barangay Health Stations Equipment', 'Municipal Health Office', 'Health & Nutrition', 17.8, 'gender_responsive', 100, 4100000, 4100000, 'Procurement of delivery beds, ultrasound machines, and dedicated teen counseling desks.'),
  (2026, 'Municipal Road Concreting and Coastal Pathway Lighting Phase II', 'Municipal Engineering Office', 'Infrastructure & Public Safety', 12.5, 'gender_sensitive', 75, 12000000, 9000000, 'Gender-sensitive consultations conducted with women market vendors and students; solar streetlights installed along safe routes.'),
  (2026, 'Fisheries Coastal Resource Rehabilitation and Marine Sanctuary Patrol', 'Municipal Agriculture Office / Bantay Dagat', 'Fisheries & Marine Resources', 9.4, 'gender_sensitive', 75, 2400000, 1800000, 'Involved women in seaweed cultivation and post-harvest fish processing while males lead offshore patrolling.');

-- ==============================================================================
-- 6. JMC 2013-01 COMPLIANCE STATUS INDICATORS (YEAR 2026)
-- ==============================================================================

INSERT INTO public.compliance_status (year, indicator_id, indicator_title, status, evidence_notes, score)
VALUES
  (2026, 'gpb_formulation', '1. Annual GAD Plan & Budget (GPB) Formulation & Timely Submission to DILG', 'compliant', 'FY 2026 GPB formulated per JMC 2013-01 with DILG endorsement certificate.', 100),
  (2026, 'gad_budget_5pct', '2. Minimum 5% GAD Budget Allocation & Utilization from Total LGU Budget', 'compliant', 'Allocated 6.2% of total LGU annual investment plan to GAD priority programs.', 100),
  (2026, 'gad_code', '3. Enactment and Implementation of Local GAD Code & IRR', 'compliant', 'Municipal GAD Code with Comprehensive IRR enacted and circulated to all 18 barangays.', 100),
  (2026, 'gfps_functionality', '4. GAD Focal Point System (GFPS) Creation & Quarterly Meetings', 'compliant', 'Executive Order active; quarterly monitoring assemblies documented with minutes.', 100),
  (2026, 'gad_database', '5. Establishment of Sex-Disaggregated GAD Database (Presentacion GAD System)', 'compliant', 'Digital sex-disaggregated municipal database live across all 5 development sectors.', 100),
  (2026, 'lcpc_functionality', '6. Local Council for the Protection of Children (LCPC) Organization & Functionality', 'compliant', 'LCPC functional with institutionalized 1% IRA budget and child welfare registry.', 100),
  (2026, 'vawc_desk_shelter', '7. Barangay VAWC Desks Institutionalization & Women Support Facility', 'compliant', 'All 18 barangays equipped with active VAWC Desk officers and standard intake protocols.', 100),
  (2026, 'gender_in_plans', '8. Gender Mainstreaming in CLUP, CDP, ELA, and Local DRRM Plans', 'compliant', 'HGDG indicators mainstreamed in Comprehensive Development Plan and DRRM Plan.', 100),
  (2026, 'gad_office_unit', '9. GAD Office / Unit Functionality & Technical Capacity Development', 'compliant', 'Dedicated GAD Technical Unit operational under MPDO.', 100),
  (2026, 'local_media_board', '10. Local Media Board Creation / Monitoring of Gender Stereotyping', 'in_progress', 'Local Media Monitoring Committee constituted; initial media guidelines adopted.', 75)
ON CONFLICT (year, indicator_id) DO UPDATE SET
  status = EXCLUDED.status,
  evidence_notes = EXCLUDED.evidence_notes,
  score = EXCLUDED.score;

COMMIT;
`;

  const outPath = path.join(__dirname, '../supabase/migrations/035_seed_2026_complete_mock_data.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`Generated complete 2026 mock data SQL script at: ${outPath} (${(sql.length / 1024).toFixed(1)} KB)`);
}

generateSql();
