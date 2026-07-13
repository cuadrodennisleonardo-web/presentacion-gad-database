import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface MultiSeriesChartProps {
  title: string;
  categories?: string[];
  series: any[];
  colors?: string[];
  type?: "bar" | "line" | "area" | "pie" | "donut";
  stacked?: boolean;
  height?: number;
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = ({ 
  title, 
  categories, 
  series, 
  colors,
  type = "bar",
  stacked = false,
  height = 350
}) => {
  const isPieOrDonut = type === "pie" || type === "donut";

  let isZeroPie = false;
  if (isPieOrDonut && Array.isArray(series)) {
    const sum = series.reduce((a, b) => Number(a) + Number(b), 0);
    if (sum === 0) {
      isZeroPie = true;
    }
  }

  const options: ApexOptions = {
    chart: {
      type: type,
      stacked: !isPieOrDonut ? stacked : false,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: colors || ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: isPieOrDonut,
    },
    stroke: {
      curve: "smooth",
      width: type === "bar" ? 0 : 2,
    },
    ...(isPieOrDonut && categories && categories.length > 0 ? { labels: categories } : {}),
    xaxis: !isPieOrDonut ? {
      categories: categories || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    } : undefined,
    yaxis: !isPieOrDonut ? {
      title: { text: "Count" },
    } : undefined,
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "var(--color-gray-200)",
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
      </div>
      {isZeroPie ? (
        <div style={{ height }} className="flex w-full items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
          No Data Recorded
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type={type} height={height} />
      )}
    </div>
  );
};

export default MultiSeriesChart;
