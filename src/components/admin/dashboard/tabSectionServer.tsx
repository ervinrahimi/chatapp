// This component renders the admin dashboard tab section for the server

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabsSectionClient from "./tabsSectionClient";
import ChartCard from "./ChartCardClient";
import AdminCardServer from "./AdminCardServer";
import { Suspense } from "react";
import SkeletonAdmin from "./skeleton/adminSkeleton";
import ChartSkeleton from "./skeleton/chartSkeleton";
import { use } from "react";
import CardsSkeleton from "./skeleton/CardsSkeleton";
import { FetchCounts } from "./FetchData";
import ChartCardServer from "./ChartCardServer";
const content = {
  tabs: {
    overview: "Overview",
  },
};

export default function TabsSectionServer() {
  function TabsData() {
    const cards = use(FetchCounts());
    return <TabsSectionClient initialCards={cards} />;
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">{content.tabs.overview}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Suspense fallback={<CardsSkeleton />}>
          <TabsData />
        </Suspense>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartCardServer />
          </Suspense>
          <Suspense fallback={<SkeletonAdmin />}>
            <AdminCardServer />
          </Suspense>
        </div>
      </TabsContent>
    </Tabs>
  );
}
