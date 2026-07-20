export const getDefaultYear = (scopeKey: string) => {
  const key = `default_year_${scopeKey}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : new Date().getFullYear();
};

export const setDefaultYear = (year: number, scopeKey: string) => {
  const key = `default_year_${scopeKey}`;
  localStorage.setItem(key, year.toString());
};
