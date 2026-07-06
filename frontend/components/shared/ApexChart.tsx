"use client";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  type: "line" | "area" | "bar" | "donut" | "radialBar";
  series: ApexOptions["series"];
  options: ApexOptions;
  height?: number;
};

export default function ApexChart({ type, series, options, height = 220 }: Props) {
  return (
    <Chart
      type={type}
      series={series}
      options={options}
      height={height}
      width="100%"
    />
  );
}
