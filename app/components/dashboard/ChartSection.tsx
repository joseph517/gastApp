import React from "react";
import { CategoryTotal } from "../../types";
import UniversalPieChart from "../shared/UniversalPieChart";

interface ChartSectionProps {
  data: CategoryTotal[];
  title?: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  data,
  title = "Gastos por Categoría"
}) => {
  return (
    <UniversalPieChart
      data={data}
      title={title}
      showLegend={true}
      showPercentages={true}
      showSummary={false}
      height={200}
    />
  );
};

export default ChartSection;