import React from "react";
import { CategoryTotal } from "../../types";
import UniversalPieChart from "../shared/UniversalPieChart";

interface CategoryChartProps {
  data: CategoryTotal[];
  title?: string;
  showLegend?: boolean;
  showPercentages?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = React.memo(({
  data,
  title = "Distribución por Categorías",
  showLegend = true,
  showPercentages = true
}) => {
  return (
    <UniversalPieChart
      data={data}
      title={title}
      showLegend={showLegend}
      showPercentages={showPercentages}
      showSummary={true}
      height={200}
    />
  );
});

export default CategoryChart;