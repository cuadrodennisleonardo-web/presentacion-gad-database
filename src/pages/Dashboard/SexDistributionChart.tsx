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

  return (
    <div className="h-[300px] w-full">
      <Chart options={options} series={series} type="donut" height="100%" />
    </div>
  );
};

export default SexDistributionChart;
