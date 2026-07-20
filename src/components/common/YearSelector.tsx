import toast from 'react-hot-toast';
import { setDefaultYear } from '@/utils/yearUtils';

interface YearSelectorProps {
  year: number;
  setYear: (year: number) => void;
  yearOptions?: { value: number; label: string }[];
  scopeKey: string;
}

export default function YearSelector({ year, setYear, yearOptions, scopeKey }: YearSelectorProps) {
  const handleSetDefault = () => {
    setDefaultYear(year, scopeKey);
    toast.success(`Default year set to ${year}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Year:</label>
      {yearOptions ? (
        <select
          className="w-32 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {yearOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          type="number"  
          className="w-24 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
        />
      )}
      <button 
        onClick={handleSetDefault}
        className="ml-1 text-xs text-brand-600 dark:text-brand-400 hover:underline hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        title="Set as Default Year"
      >
        Set Default
      </button>
    </div>
  );
}
