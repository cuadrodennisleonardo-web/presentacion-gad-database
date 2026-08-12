/**
 * Resolves the sub-sector branch for a dynamic schema.
 * Handles explicitly tagged subSectors as well as inferring subSectors
 * for legacy or un-tagged schemas based on tab titles and field content.
 */
export function getSchemaSubSector(schema: any): string {
  if (!schema) return 'all';
  
  const sData = schema.schema as any;
  const explicitSub = sData?.subSector;

  // If explicitly tagged as education, health, welfare, or housing
  if (explicitSub && explicitSub !== 'all') {
    return explicitSub;
  }

  // Infer from schema titles and field names if subSector is missing or 'all'
  const title = (
    (schema.tab_name || '') + ' ' +
    (schema.tab_key || '') + ' ' +
    (sData?.description || '') + ' ' +
    (sData?.fields ? JSON.stringify(sData.fields) : '') + ' ' +
    (sData?.groups ? JSON.stringify(sData.groups) : '')
  ).toLowerCase();

  if (title.includes('housing') || title.includes('toilet') || title.includes('sanitation') || title.includes('utility') || title.includes('utilities') || title.includes('water') || title.includes('waste') || title.includes('insanitary') || title.includes('potable')) {
    return 'housing';
  }
  if (title.includes('health') || title.includes('nutrition') || title.includes('malnutrition') || title.includes('stunted') || title.includes('pregnancy') || title.includes('disease') || title.includes('maternal') || title.includes('mortality') || title.includes('hospital') || title.includes('outbreak')) {
    return 'health';
  }
  if (title.includes('school') || title.includes('education') || title.includes('student') || title.includes('enrollment') || title.includes('enrolled') || title.includes('youth') || title.includes('grade') || title.includes('kinder') || title.includes('als') || title.includes('sned') || title.includes('strand')) {
    return 'education';
  }
  if (title.includes('welfare') || title.includes('pwd') || title.includes('4ps') || title.includes('senior') || title.includes('solo parent') || title.includes('aics') || title.includes('pension')) {
    return 'welfare';
  }

  return explicitSub || 'all';
}
