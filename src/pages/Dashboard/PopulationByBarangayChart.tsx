import React, { useMemo } from "react";
import Chart from "react-apexcharts";

interface PopulationByBarangayChartProps {
  data: { barangay_name: string; count: number }[];
}

const PopulationByBarangayChart: React.FC<PopulationByBarangayChartProps> = ({
  data,
}) => {
  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "inherit",
        background: "transparent",
        toolbar: { show: false },
      },
      colors: ["#14b8a6"], // brand-500
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: 20,
        style: {
          fontSize: "12px",
          colors: ["#6b7280"], // gray-500
        },
        formatter: (val) => Number(val).toLocaleString(),
      },
      xaxis: {
        categories: data.map((d) => d.barangay_name),
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "12px",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#374151", // gray-700
            fontSize: "12px",
            fontWeight: 500,
          },
        },
      },
      grid: {
        borderColor: "#f3f4f6", // gray-100
        strokeDashArray: 4,
        xaxis: {
          lines: { show: true },
        },
        yaxis: {
          lines: { show: false },
        },
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val) => val.toLocaleString() + " residents",
        },
      },
    }),
    [data]
  );

  const series = [
    {
      name: "Population",
      data: data.map((d) => d.count),
    },
  ];

  const totalPop = data.reduce((acc, d) => acc + (d.count || 0), 0);
  if (data.length === 0 || totalPop === 0) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Barangay Data</p>
        <p className="text-xs text-gray-400 mt-0.5">Population statistics have not been recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <Chart options={options} series={series} type="bar" height="100%" />
    </div>
  );
};

export default PopulationByBarangayChart;
