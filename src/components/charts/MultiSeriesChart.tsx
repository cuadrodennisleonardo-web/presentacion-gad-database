import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface MultiSeriesChartProps {
  title: string;
  categories?: string[];
  series: any;
  colors?: string[];
  type?: "bar" | "line" | "area" | "pie" | "donut";
  stacked?: boolean;
  height?: number;
  isCurrency?: boolean;
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = ({ 
  title, 
  categories = [], 
  series, 
  colors,
  type = "bar",
  stacked = false,
  height = 350,
  isCurrency = false
}) => {
  const isPieOrDonut = type === "pie" || type === "donut";

  // Normalize series and categories based on chart type
  const { normalizedSeries, normalizedLabels, hasValidData } = useMemo(() => {
    if (isPieOrDonut) {
      let nums: number[] = [];
      let labs: string[] = categories ? [...categories] : [];

      if (Array.isArray(series)) {
        if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && 'data' in series[0]) {
          // Multi-series like [{ name: "Male", data: [...] }, { name: "Female", data: [...] }]
          if (series.length > 1) {
            nums = series.map((s: any) => {
              const d = Array.isArray(s.data) ? s.data : [];
              return d.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
            });
            labs = series.map((s: any) => s.name || "Series");
          } else {
            // Single series: [{ name: "Field", data: [1, 2, 3] }]
            nums = (series[0]?.data || []).map((v: any) => Number(v) || 0);
          }
        } else {
          // Direct numeric array [10, 20, 30]
          nums = series.map((v: any) => Number(v) || 0);
        }
      }

      const total = nums.reduce((a, b) => a + b, 0);
      const valid = nums.length > 0 && total > 0 && !isNaN(total);

      return {
        normalizedSeries: nums,
        normalizedLabels: labs.length > 0 ? labs : nums.map((_, i) => `Item ${i + 1}`),
        hasValidData: valid,
      };
    } else {
      // Bar / Line / Area Chart
      let sList: { name: string; data: number[] }[] = [];
      const safeCats = Array.isArray(categories) ? categories : [];

      if (Array.isArray(series)) {
        if (series.length > 0 && typeof series[0] === 'object' && series[0] !== null && 'data' in series[0]) {
          sList = series.map((s: any) => ({
            name: String(s.name || "Series"),
            data: Array.isArray(s.data) ? s.data.map((v: any) => (isNaN(Number(v)) ? 0 : Number(v))) : [],
          }));
        } else {
          // Direct numbers array passed to bar chart
          sList = [{
            name: title,
            data: series.map((v: any) => (isNaN(Number(v)) ? 0 : Number(v))),
          }];
        }
      }

      const hasCategories = safeCats.length > 0;
      const hasSeriesData = sList.length > 0 && sList.some(s => s.data && s.data.length > 0);

      return {
        normalizedSeries: sList,
        normalizedLabels: safeCats,
        hasValidData: hasCategories && hasSeriesData,
      };
    }
  }, [isPieOrDonut, series, categories, title]);

  const hasManyCategories = !isPieOrDonut && normalizedLabels && normalizedLabels.length > 12;
  const chartHeight = hasManyCategories ? Math.max(height, 420) : height;

  const defaultColors = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e"];

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: type,
      stacked: !isPieOrDonut ? stacked : false,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      animations: { enabled: true },
    },
    colors: colors && colors.length > 0 ? colors : defaultColors,
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: normalizedLabels && normalizedLabels.length > 15 ? "70%" : "55%",
      },
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    dataLabels: {
      enabled: isPieOrDonut,
    },
    stroke: {
      curve: "smooth",
      width: type === "bar" || isPieOrDonut ? 0 : 2,
    },
    ...(isPieOrDonut && normalizedLabels && normalizedLabels.length > 0 ? { labels: normalizedLabels } : {}),
    xaxis: !isPieOrDonut ? {
      type: "category",
      categories: normalizedLabels || [],
      tickAmount: normalizedLabels && normalizedLabels.length > 0 ? normalizedLabels.length : undefined,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -45,
        rotateAlways: hasManyCategories,
        hideOverlappingLabels: false,
        maxHeight: 140,
        style: {
          fontSize: hasManyCategories ? "10px" : "11px",
        }
      }
    } : undefined,
    yaxis: !isPieOrDonut ? {
      title: { text: isCurrency ? "Amount (₱)" : "Count" },
      labels: {
        formatter: (val) => {
          if (val === undefined || val === null || isNaN(val)) return "0";
          if (isCurrency) return "₱" + Number(val).toLocaleString();
          return Number(val).toLocaleString();
        }
      }
    } : undefined,
    tooltip: {
      y: {
        formatter: (val) => {
          if (val === undefined || val === null || isNaN(val)) return "0";
          if (isCurrency) return "₱" + Number(val).toLocaleString();
          return Number(val).toLocaleString();
        }
      }
    },
    legend: {
      position: isPieOrDonut ? 'bottom' : 'top',
      horizontalAlign: isPieOrDonut ? 'center' : 'right'
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "var(--color-gray-200)",
    },
  }), [type, isPieOrDonut, stacked, colors, normalizedLabels, hasManyCategories, isCurrency]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
      </div>
      {!hasValidData ? (
        <div style={{ height: chartHeight }} className="flex w-full items-center justify-center text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          No Data Recorded
        </div>
      ) : (
        <ReactApexChart options={options} series={normalizedSeries} type={type} height={chartHeight} />
      )}
    </div>
  );
};

export default MultiSeriesChart;
