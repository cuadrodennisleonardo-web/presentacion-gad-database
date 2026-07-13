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

  return (
    <div className="h-[400px] w-full">
      <Chart options={options} series={series} type="bar" height="100%" />
    </div>
  );
};

export default PopulationByBarangayChart;
