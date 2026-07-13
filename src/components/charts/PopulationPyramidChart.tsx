import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
export interface PopulationPyramidData {
  ageGroup: string;
  male: number;
  female: number;
}

interface PopulationPyramidChartProps {
  data: PopulationPyramidData[];
}

const PopulationPyramidChart: React.FC<PopulationPyramidChartProps> = ({ data }) => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#3b82f6", "#ec4899"],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "80%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 1,
      colors: ["#fff"],
    },
    xaxis: {
      categories: data.map((d) => d.ageGroup),
      title: {
        text: "Population",
      },
      labels: {
        formatter: (val) => {
          return Math.abs(Number(val)).toString();
        },
      },
    },
    yaxis: {
      title: {
        text: "Age Group",
      },
    },
    tooltip: {
      y: {
        formatter: (val) => {
          return Math.abs(val).toString();
        },
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "var(--color-gray-200)",
    },
  };

  const series = [
    {
      name: "Male",
      data: data.map((d) => -d.male),
    },
    {
      name: "Female",
      data: data.map((d) => d.female),
    },
  ];

  return (
    <div id="PopulationPyramidChart">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </div>
  );
};

export default PopulationPyramidChart;
