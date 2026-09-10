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

// Baseline population distributions for realistic municipality totals (~22,500 total)
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

async function populateAll() {
  console.log("=== STARTING 2026 MOCK DATA POPULATION ===");
  const YEAR = 2026;

  // 1. Fetch official barangays
  const { data: allBarangays, error: bErr } = await supabase
    .from('barangays')
    .select('id, name');

  if (bErr || !allBarangays) {
    console.error("Failed to load barangays:", bErr);
    return;
  }

  const barangayMap = new Map();
  allBarangays.forEach(b => {
    if (OFFICIAL_BARANGAYS.includes(b.name)) {
      barangayMap.set(b.name, b.id);
    }
  });

  console.log(`Matched ${barangayMap.size} of 18 official barangays.`);

  // 2. Populate population_stats for 2026
  console.log("\n--- Populating population_stats (2026) ---");
  const popStatsRows = [];

  for (const [name, id] of barangayMap.entries()) {
    const base = BARANGAY_BASELINES[name] || { pop: 1200, hh: 260 };
    const maleRatio = 0.505 + (Math.random() * 0.02 - 0.01);
    const maleCount = Math.round(base.pop * maleRatio);
    const femaleCount = base.pop - maleCount;
    const totalPop = base.pop;

    const hhHeadFRatio = 0.22 + (Math.random() * 0.06 - 0.03); // ~22% female HH heads
    const hhHeadF = Math.round(base.hh * hhHeadFRatio);
    const hhHeadM = base.hh - hhHeadF;
    const totalHh = base.hh;

    const under18 = Math.round(totalPop * (0.33 + (Math.random() * 0.04 - 0.02)));
    const age60Plus = Math.round(totalPop * (0.09 + (Math.random() * 0.02 - 0.01)));
    const age19to59 = totalPop - under18 - age60Plus;

    const pwdCount = randBetween(12, 35);
    const fourPsCount = randBetween(45, 110);

    popStatsRows.push({
      barangay_id: id,
      year: YEAR,
      month_updated: 9,
      male_count: maleCount,
      female_count: femaleCount,
      total_population: totalPop,
      household_heads_m: hhHeadM,
      household_heads_f: hhHeadF,
      household_heads_total: totalHh,
      total_households: totalHh,
      age_under_18: under18,
      age_19_to_59: age19to59,
      age_60_plus: age60Plus,
      pwd_count: pwdCount,
      four_ps_beneficiaries_count: fourPsCount,
      updated_at: new Date().toISOString(),
    });
  }

  const { error: popErr } = await supabase
    .from('population_stats')
    .upsert(popStatsRows, { onConflict: 'barangay_id,year' });

  if (popErr) {
    console.warn("Full population_stats upsert warning:", popErr.message);
    // Fallback if some columns don't exist
    const fallbackPopRows = popStatsRows.map(r => ({
      barangay_id: r.barangay_id,
      year: r.year,
      month_updated: r.month_updated,
      male_count: r.male_count,
      female_count: r.female_count,
      total_population: r.total_population,
      household_heads_m: r.household_heads_m,
      household_heads_f: r.household_heads_f,
      household_heads_total: r.household_heads_total,
      updated_at: r.updated_at,
    }));
    const { error: fbErr } = await supabase
      .from('population_stats')
      .upsert(fallbackPopRows, { onConflict: 'barangay_id,year' });
    if (fbErr) console.error("Fallback pop error:", fbErr);
    else console.log("population_stats upserted (core columns)!");
  } else {
    console.log(`Successfully upserted ${popStatsRows.length} population_stats rows!`);
  }

  // 3. Fetch all dynamic schemas
  const { data: schemas, error: sErr } = await supabase
    .from('dynamic_schemas')
    .select('*');

  if (sErr || !schemas) {
    console.error("Failed to load dynamic_schemas:", sErr);
    return;
  }

  console.log(`\n--- Populating dynamic_data for ${schemas.length} schemas across all 18 barangays (2026) ---`);

  const dynamicDataRows = [];

  for (const schema of schemas) {
    const fields = schema.schema?.fields || [];
    const dept = schema.department;
    const tab = schema.tab_name;

    for (const [bName, bId] of barangayMap.entries()) {
      const base = BARANGAY_BASELINES[bName] || { pop: 1200, hh: 260 };
      const rowData = {};

      for (const field of fields) {
        const fid = field.id;
        const ftype = field.type;

        if (ftype === 'gender_split') {
          let totalVal = 0;
          let mRatio = 0.5;

          if (fid.includes('senior')) {
            totalVal = Math.round(base.pop * 0.085) + randBetween(-5, 5);
            mRatio = 0.44; // more senior women
          } else if (fid.includes('pwd')) {
            totalVal = randBetween(15, 45);
            mRatio = 0.52;
          } else if (fid.includes('solo_parent')) {
            totalVal = randBetween(18, 55);
            mRatio = 0.20; // 80% female solo parents
          } else if (fid.includes('elem') || fid.includes('elementary')) {
            totalVal = Math.round(base.pop * 0.12) + randBetween(-10, 10);
            mRatio = 0.51;
          } else if (fid.includes('jhs') || fid.includes('junior')) {
            totalVal = Math.round(base.pop * 0.09) + randBetween(-8, 8);
            mRatio = 0.49;
          } else if (fid.includes('shs') || fid.includes('senior_high')) {
            totalVal = Math.round(base.pop * 0.06) + randBetween(-5, 5);
            mRatio = 0.48;
          } else if (fid.includes('osy') || fid.includes('out_of_school')) {
            totalVal = randBetween(8, 30);
            mRatio = 0.58;
          } else if (fid.includes('tvet') || fid.includes('tesda')) {
            totalVal = randBetween(12, 35);
            mRatio = 0.46;
          } else if (fid.includes('malnourish') || fid.includes('nutrition')) {
            totalVal = randBetween(3, 14);
            mRatio = 0.50;
          } else if (fid.includes('immuniz') || fid.includes('fic')) {
            totalVal = randBetween(25, 60);
            mRatio = 0.50;
          } else if (fid.includes('infant_death')) {
            totalVal = randBetween(0, 2);
            mRatio = 0.50;
          } else if (fid.includes('fp_modern') || fid.includes('family_planning')) {
            totalVal = randBetween(40, 120);
            mRatio = 0.15; // predominantly female users
          } else if (fid.includes('farmer') || fid.includes('agri')) {
            totalVal = randBetween(50, 160);
            mRatio = 0.68;
          } else if (fid.includes('fisher') || fid.includes('fish')) {
            totalVal = randBetween(20, 110);
            mRatio = 0.82;
          } else if (fid.includes('msme') || fid.includes('business') || fid.includes('entrepreneur')) {
            totalVal = randBetween(15, 65);
            mRatio = 0.35; // 65% women-owned MSMEs
          } else if (fid.includes('labor') || fid.includes('employed')) {
            totalVal = Math.round(base.pop * 0.42) + randBetween(-20, 20);
            mRatio = 0.58;
          } else if (fid.includes('unemployed')) {
            totalVal = randBetween(15, 50);
            mRatio = 0.48;
          } else if (fid.includes('disaster') || fid.includes('evacuee') || fid.includes('responder')) {
            totalVal = randBetween(20, 80);
            mRatio = 0.50;
          } else if (fid.includes('4ps') || fid.includes('four_ps') || fid.includes('safety_net')) {
            totalVal = randBetween(40, 120);
            mRatio = 0.12; // mostly female grantees
          } else if (fid.includes('council') || fid.includes('official') || fid.includes('leader')) {
            totalVal = 10; // 1 captain + 7 kagawad + SK + Sec
            mRatio = 0.60;
          } else if (fid.includes('lupong') || fid.includes('justice')) {
            totalVal = randBetween(10, 20);
            mRatio = 0.55;
          } else {
            totalVal = randBetween(10, 50);
            mRatio = 0.50;
          }

          const mVal = Math.round(totalVal * mRatio);
          const fVal = totalVal - mVal;
          rowData[fid] = { m: mVal, f: fVal, total: totalVal };
        } else if (ftype === 'single_value' || ftype === 'number') {
          if (fid.includes('maternal_death')) {
            rowData[fid] = randBetween(0, 1);
          } else if (fid.includes('teen') || fid.includes('pregnan')) {
            rowData[fid] = randBetween(1, 8);
          } else if (fid.includes('vawc') || fid.includes('abuse') || fid.includes('incident')) {
            rowData[fid] = randBetween(0, 4);
          } else if (fid.includes('bpo') || fid.includes('protection_order')) {
            rowData[fid] = randBetween(0, 3);
          } else if (fid.includes('water') || fid.includes('electric') || fid.includes('sanitation')) {
            rowData[fid] = Math.round(base.hh * (0.88 + Math.random() * 0.10));
          } else if (fid.includes('streetlight') || fid.includes('cctv')) {
            rowData[fid] = randBetween(15, 45);
          } else if (fid.includes('evacuation_center')) {
            rowData[fid] = randBetween(1, 3);
          } else if (fid.includes('budget') || fid.includes('allocation') || fid.includes('amount')) {
            rowData[fid] = randBetween(120000, 380000);
          } else {
            rowData[fid] = randBetween(5, 50);
          }
        } else if (ftype === 'percentage') {
          if (fid.includes('budget') || fid.includes('utilization')) {
            rowData[fid] = (75 + Math.random() * 22).toFixed(1) + "%";
          } else if (fid.includes('water') || fid.includes('access')) {
            rowData[fid] = (85 + Math.random() * 14).toFixed(1) + "%";
          } else {
            rowData[fid] = (70 + Math.random() * 25).toFixed(1) + "%";
          }
        } else if (ftype === 'currency') {
          rowData[fid] = randBetween(150000, 450000);
        } else {
          rowData[fid] = randBetween(5, 35);
        }
      }

      dynamicDataRows.push({
        barangay_id: bId,
        year: YEAR,
        month_updated: "9",
        schema_id: schema.id,
        data: rowData,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Batch upsert dynamic data (chunks of 100)
  console.log(`Inserting ${dynamicDataRows.length} dynamic_data records in batches...`);
  const chunkSize = 100;
  let insertedCount = 0;
  for (let i = 0; i < dynamicDataRows.length; i += chunkSize) {
    const chunk = dynamicDataRows.slice(i, i + chunkSize);
    const { error: dynErr } = await supabase
      .from('dynamic_data')
      .upsert(chunk, { onConflict: 'barangay_id,year,schema_id' });

    if (dynErr) {
      console.error(`Error inserting chunk ${i / chunkSize}:`, dynErr);
    } else {
      insertedCount += chunk.length;
    }
  }
  console.log(`Successfully populated ${insertedCount} dynamic_data entries for 2026!`);

  // 4. Populate GPB Entries for 2026
  console.log("\n--- Populating GPB (GAD Plan & Budget) Entries for 2026 ---");
  const gpbMockItems = [
    {
      year: 2026,
      focus: 'Client-Focused',
      activity: 'Maternal & Child Health and Nutrition Outreach Caravan',
      gender_issue: 'High prevalence of undernourished children in coastal barangays and lack of prenatal services access for remote mothers',
      cause: 'Geographical isolation and insufficient medical transport to Municipal Health Office',
      gad_objective: 'Provide maternal care checkups and supplementary feeding to 100% of identified malnourished children and pregnant women',
      target: '18 Barangays / 450 Pregnant & Lactating Mothers',
      budget: 850000,
      actual_cost: 780000,
      hgdg_score: 18.5,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'Municipal Health Office (MHO) & MSWDO',
    },
    {
      year: 2026,
      focus: 'Client-Focused',
      activity: 'Sustainable Organic Agriculture and Livelihood Training for Rural Women',
      gender_issue: 'Women farmers have limited access to agricultural inputs, modern post-harvest equipment, and formal farming training',
      cause: 'Traditional gender roles limiting women to unpaid family labor in crop production',
      gad_objective: 'Train 200 women farmers in high-value organic crop farming and establish 5 women-led agricultural cooperatives',
      target: '200 Women Farmers across 12 upland barangays',
      budget: 650000,
      actual_cost: 610000,
      hgdg_score: 16.0,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'Municipal Agriculture Office (MAO)',
    },
    {
      year: 2026,
      focus: 'Client-Focused',
      activity: 'Strengthening of 18 Barangay VAWC Desks and Crisis Support Operations',
      gender_issue: 'Underreporting of VAWC cases and lack of confidential intake spaces at barangay halls',
      cause: 'Lack of dedicated VAW Desk supplies, trauma-informed training for desk officers, and emergency rescue protocols',
      gad_objective: 'Equip all 18 Barangay VAW Desks with standardized case management kits, emergency hotlines, and victim legal aid assistance',
      target: '18 Barangays / 36 VAWC Desk Officers',
      budget: 480000,
      actual_cost: 450000,
      hgdg_score: 19.0,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'MSWDO / PNP Women & Children Protection Desk',
    },
    {
      year: 2026,
      focus: 'Client-Focused',
      activity: 'Solar Street Lighting and Safe Pathways in High-Risk Remote Zones',
      gender_issue: 'Safety hazards and fear of harassment for women and students walking along unlit coastal and interior pathways at night',
      cause: 'Inadequate street lighting infrastructure in peripheral barangay puroks',
      gad_objective: 'Install 120 solar street light poles along school routes and coastal access roads',
      target: '18 Barangays / 120 Solar Lamp Posts',
      budget: 1200000,
      actual_cost: 1150000,
      hgdg_score: 14.5,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'Municipal Engineering Office / MDRRMO',
    },
    {
      year: 2026,
      focus: 'Organization-Focused',
      activity: 'Comprehensive GAD Capacity Building & Gender Mainstreaming Orientation for LGU Staff & GFPS',
      gender_issue: 'Uneven understanding of GAD concepts and HGDG scoring tools among municipal department heads and budget officers',
      cause: 'Staff turnover and lack of institutionalized annual GAD training',
      gad_objective: 'Conduct 3-day intensive workshop on Gender Analysis, HGDG application, and GADAR preparation for all 45 GFPS members',
      target: '45 LGU Executives and Department Encoders',
      budget: 350000,
      actual_cost: 320000,
      hgdg_score: 20.0,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'GAD Focal Point System (GFPS) Secretariat / HRMO',
    },
    {
      year: 2026,
      focus: 'Organization-Focused',
      activity: 'Municipal Sex-Disaggregated Database Maintenance and Dynamic Module Integration',
      gender_issue: 'Delays in real-time sectoral data collection and sex-disaggregation across line departments',
      cause: 'Manual paper forms and siloed department reporting systems',
      gad_objective: 'Deploy and maintain digital sex-disaggregated database with 18 barangay encoders',
      target: '18 Barangays / 5 Development Sectors',
      budget: 420000,
      actual_cost: 400000,
      hgdg_score: 19.5,
      hgdg_rating: 'Gender-responsive',
      status: 'Approved',
      responsible_unit: 'MPDO / GAD Secretariat / IT Unit',
    },
  ];

  try {
    const { error: gpbErr } = await supabase
      .from('gpb_entries')
      .upsert(gpbMockItems, { onConflict: 'year,activity' });

    if (gpbErr) console.warn("GPB upsert notice:", gpbErr.message);
    else console.log(`Successfully populated ${gpbMockItems.length} GPB entries for 2026!`);
  } catch (err) {
    console.warn("GPB table skip:", err.message);
  }

  // 5. Populate Compliance Status for 2026
  console.log("\n--- Populating Compliance Status for 2026 ---");
  const complianceItems = [
    { indicator_id: 'gpb_approved', year: 2026, status: 'Compliant', score: 100, remarks: '2026 GPB fully endorsed by GFPS and approved with >5% statutory allocation', updated_at: new Date().toISOString() },
    { indicator_id: 'gfps_institutionalized', year: 2026, status: 'Compliant', score: 100, remarks: 'Executive Order updating GFPS ExeCom and TWG active and functioning', updated_at: new Date().toISOString() },
    { indicator_id: 'sdd_maintained', year: 2026, status: 'Compliant', score: 100, remarks: 'Digital Sex-Disaggregated Database updated across all 5 sectors for 18 barangays', updated_at: new Date().toISOString() },
    { indicator_id: 'gadar_submitted', year: 2026, status: 'In Progress', score: 85, remarks: 'Mid-year accomplishment tracking active with 88.4% budget utilization', updated_at: new Date().toISOString() },
    { indicator_id: 'gad_code_enacted', year: 2026, status: 'Compliant', score: 100, remarks: 'Municipal GAD Code updated in compliance with JMC 2013-01 standards', updated_at: new Date().toISOString() },
  ];

  try {
    const { error: compErr } = await supabase
      .from('compliance_status')
      .upsert(complianceItems, { onConflict: 'indicator_id,year' });

    if (compErr) console.warn("Compliance status notice:", compErr.message);
    else console.log(`Successfully populated ${complianceItems.length} compliance indicators for 2026!`);
  } catch (err) {
    console.warn("Compliance table skip:", err.message);
  }

  console.log("\n=== ALL 2026 MOCK DATA POPULATION COMPLETED SUCCESSFULLY! ===");
}

populateAll();
