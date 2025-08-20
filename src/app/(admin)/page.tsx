import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";

export const metadata: Metadata = {
  title:
    "Solvox AI",
  description: "Dashboard of Solvox AI",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 ">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>
      <div className="col-span-12 ">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-7">
            <StatisticsChart />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <MonthlyTarget />
          </div>
        </div>
      </div>
    </div>
  );
}
