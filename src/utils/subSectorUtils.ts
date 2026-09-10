/**
 * Resolves the sub-sector branch for a dynamic schema.
 * Checks the schema.subsector column first, then schema JSON subSector,
 * and falls back to inferring subsectors.
 */
export function getSchemaSubSector(schema: any): string {
  if (!schema) return 'all';
  
  // 1. Direct database column
  if (schema.subsector && schema.subsector !== 'all') {
    return schema.subsector;
  }
  
  // 2. Schema JSON definition
  const sData = schema.schema as any;
  const explicitSub = sData?.subSector;
  if (explicitSub && explicitSub !== 'all') {
    return explicitSub;
  }

  // 3. Fallback: infer from text
  const title = (
    (schema.tab_name || '') + ' ' +
    (schema.tab_key || '') + ' ' +
    (sData?.description || '') + ' ' +
    (sData?.fields ? JSON.stringify(sData.fields) : '') + ' ' +
    (sData?.groups ? JSON.stringify(sData.groups) : '')
  ).toLowerCase();

  if (title.includes('water') || title.includes('potable') || title.includes('electrification') || title.includes('energy')) {
    return 'water-utilities';
  }
  if (title.includes('road') || title.includes('bridge') || title.includes('transport')) {
    return 'roads-bridges';
  }
  if (title.includes('health station') || title.includes('daycare') || title.includes('eccd') || title.includes('shelter') || title.includes('evacuation')) {
    return 'social-support-infra';
  }
  if (title.includes('waste') || title.includes('sanitation') || title.includes('garbage') || title.includes('sewage')) {
    return 'solid-waste';
  }
  if (title.includes('crop') || title.includes('farmer') || title.includes('agriculture') || title.includes('palay') || title.includes('corn')) {
    return 'agriculture-land';
  }
  if (title.includes('fish') || title.includes('coastal') || title.includes('boat') || title.includes('aquaculture')) {
    return 'fishery';
  }
  if (title.includes('labor') || title.includes('employ') || title.includes('ofw') || title.includes('job')) {
    return 'labor-employment';
  }
  if (title.includes('msme') || title.includes('business') || title.includes('enterprise') || title.includes('vendor') || title.includes('market')) {
    return 'industry-msme';
  }
  if (title.includes('vawc') || title.includes('gbv') || title.includes('violence') || title.includes('abuse') || title.includes('bpo')) {
    return 'gbv';
  }
  if (title.includes('health') || title.includes('nutrition') || title.includes('malnutrition') || title.includes('immuniz') || title.includes('maternal') || title.includes('pregnancy')) {
    return 'health';
  }
  if (title.includes('school') || title.includes('education') || title.includes('student') || title.includes('enroll') || title.includes('tvet') || title.includes('osy')) {
    return 'education';
  }
  if (title.includes('pwd') || title.includes('4ps') || title.includes('senior') || title.includes('welfare') || title.includes('solo parent')) {
    return 'social-protection';
  }
  if (title.includes('gad budget') || title.includes('ira') || title.includes('nta') || title.includes('fiscal') || title.includes('revenue')) {
    return 'fiscal-mgmt';
  }
  if (title.includes('leadership') || title.includes('gst') || title.includes('council') || title.includes('training')) {
    return 'capacity-dev';
  }

  return 'all';
}
