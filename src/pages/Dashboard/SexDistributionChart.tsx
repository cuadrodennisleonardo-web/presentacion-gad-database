import React, { useMemo } from "react";
import Chart from "react-apexcharts";

interface SexDistributionChartProps {
  male: number;
  female: number;
  height?: number | string;
}

const SexDistributionChart: React.FC<SexDistributionChartProps> = ({
  male,
  female,
  height = 260,
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
            size: "72%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "12px",
                fontWeight: 500,
                color: "#6b7280",
              },
              value: {
                show: true,
                fontSize: "20px",
                fontWeight: 700,
                color: "#1f2937",
                formatter: (val) => Number(val).toLocaleString(),
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: "12px",
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
        width: 3,
        colors: ["#ffffff"],
      },
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "12px",
        markers: {
          shape: "circle",
        },
        itemMargin: {
          horizontal: 10,
          vertical: 4,
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        custom: function({ series, seriesIndex, w }: any) {
          const label = w.globals.labels[seriesIndex] || (seriesIndex === 0 ? "Male" : "Female");
          const value = series[seriesIndex] !== undefined ? series[seriesIndex] : 0;
          const total = series.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
          const color = (w.globals.colors && w.globals.colors[seriesIndex]) || (seriesIndex === 0 ? "#3b82f6" : "#ec4899");
          return `
            <div style="background: rgba(17, 24, 39, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(55, 65, 81, 0.8); border-radius: 10px; padding: 8px 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); font-family: Outfit, sans-serif; color: #ffffff;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
                <span style="font-size: 11px; font-weight: 700; color: #e5e7eb;">${label} Population</span>
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #ffffff;">
                ${Number(value).toLocaleString()}
                <span style="font-size: 11px; font-weight: 500; color: #9ca3af; margin-left: 6px;">(${pct}%)</span>
              </div>
            </div>
          `;
        },
      },
    }),
    []
  );

  const series = [male, female];

  if (male === 0 && female === 0) {
    return (
      <div className="flex h-[260px] w-full flex-col items-center justify-center text-center p-4">
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
    <div style={{ height }} className="w-full">
      <Chart options={options} series={series} type="donut" height="100%" />
    </div>
  );
};

export default SexDistributionChart;
