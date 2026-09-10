import React, { useMemo } from "react";
import Chart from "react-apexcharts";

interface SexDistributionChartProps {
  male: number;
  female: number;
}

const SexDistributionChart: React.FC<SexDistributionChartProps> = ({
  male,
  female,
}) => {
  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: "inherit",
        background: "transparent",
      },
      labels: ["Male", "Female"],
      colors: ["#3b82f6", "#ec4899"], // blue-500, pink-500
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontWeight: 500,
                color: "#6b7280",
              },
              value: {
                show: true,
                fontSize: "24px",
                fontWeight: 700,
                color: "#1f2937",
                formatter: (val) => Number(val).toLocaleString(),
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: "14px",
                fontWeight: 500,
                color: "#6b7280",
                formatter: function (w) {
                  return w.globals.seriesTotals
                    .reduce((a: number, b: number) => a + b, 0)
                    .toLocaleString();
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        colors: ["transparent"],
      },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "14px",
        markers: {
          shape: "circle",
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      theme: {
        mode: "light",
      },
    }),
    []
  );

  const series = [male, female];

  if (male === 0 && female === 0) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Population Data</p>
        <p className="text-xs text-gray-400 mt-0.5">Demography data has not been entered yet.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <Chart options={options} series={series} type="donut" height="100%" />
    </div>
  );
};

export default SexDistributionChart;
