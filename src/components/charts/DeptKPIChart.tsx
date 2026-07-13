import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface DeptKPIChartProps {
  title: string;
  categories: string[];
  seriesData: number[];
  color?: string;
  type?: "bar" | "line" | "area" | "pie" | "donut";
}

const DeptKPIChart: React.FC<DeptKPIChartProps> = ({ 
  title, 
  categories, 
  seriesData, 
  color = "#3b82f6",
  type = "bar"
}) => {
  const isPieOrDonut = type === "pie" || type === "donut";

  const options: ApexOptions = {
    chart: {
      type: type,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: isPieOrDonut ? ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] : [color],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "40%",
      },
    },
    dataLabels: {
      enabled: isPieOrDonut,
    },
    stroke: {
      curve: "smooth",
      width: type === "bar" ? 0 : 2,
    },
    labels: isPieOrDonut ? categories : undefined,
    xaxis: !isPieOrDonut ? {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    } : undefined,
    yaxis: !isPieOrDonut ? {
      title: { text: "Count" },
    } : undefined,
    grid: {
      strokeDashArray: 4,
      borderColor: "var(--color-gray-200)",
    },
  };

  const series = isPieOrDonut ? seriesData : [
    {
      name: title,
      data: seriesData,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
      </div>
      <ReactApexChart options={options} series={series} type={type} height={300} />
    </div>
  );
};

export default DeptKPIChart;
