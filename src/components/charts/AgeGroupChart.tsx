import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface AgeGroupChartProps {
  data: { name: string; value: number }[];
}

const AgeGroupChart: React.FC<AgeGroupChartProps> = ({ data }) => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#3b82f6"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "50%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: data.map((d) => d.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Population" },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "var(--color-gray-200)",
    },
    theme: {
      mode: "light", // will handle dark mode via css overrides if needed
    },
  };

  const series = [
    {
      name: "Population",
      data: data.map((d) => d.value),
    },
  ];

  return (
    <div id="AgeGroupChart">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </div>
  );
};

export default AgeGroupChart;
