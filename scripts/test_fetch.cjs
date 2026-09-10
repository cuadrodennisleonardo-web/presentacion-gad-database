const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gjqeaggkyfxkhqzmkyfd.supabase.co';
const supabaseKey = 'sb_publishable_3NlVxxEondnz8YhYS57tZg_LSzfODAN';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: barangays, error: bErr } = await supabase.from('barangays').select('id, name').order('name');
  if (bErr) {
    console.error('Barangay fetch error:', bErr);
    return;
  }
  console.log(`Found ${barangays.length} barangays:`, barangays.map(b => b.name).join(', '));

  const { data: schemas, error: sErr } = await supabase.from('dynamic_schemas').select('id, department, tab_name, subsector');
  if (sErr) {
    console.error('Schemas fetch error:', sErr);
    return;
  }
  console.log(`Found ${schemas.length} dynamic schemas across departments:`);
  schemas.forEach(s => console.log(` - [${s.department}] ${s.tab_name} (subsector: ${s.subsector})`));
}

check();
