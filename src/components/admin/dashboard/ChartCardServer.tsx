import { use } from "react";
import {FetchChartData} from "./FetchData";
import ChartCardClient from "./ChartCardClient";

export default function ChartCardServer() {
  const initialData = use(FetchChartData());

  return <ChartCardClient initialData={initialData} />;
}
