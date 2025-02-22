import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartCard from "./ChartCard";
import SalesCard from "./SalesCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";

const content = {
  tabs: {
    overview: "Overview",
    // analytics: "Analytics",
    // reports: "Reports",
    // notifications: "Notifications",
  },
  cards: [
    {
      title: "Total Revenue",
      description: "$45,231.89",
      content: "+20.1% from last month",
    },
    {
      title: "Subscriptions",
      description: "+2350",
      content: "+180.1% from last month",
    },
    {
      title: "Sales",
      description: "+12,234",
      content: "+19% from last month",
    },
    {
      title: "Active Now",
      description: "+573",
      content: "+201 since last hour",
    },
  ],
};

const TabsSection = () => {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">{content.tabs.overview}</TabsTrigger>
        {/* <TabsTrigger value="analytics">{content.tabs.analytics}</TabsTrigger>
        <TabsTrigger value="reports">{content.tabs.reports}</TabsTrigger>
        <TabsTrigger value="notifications">{content.tabs.notifications}</TabsTrigger> */}
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {content.cards.map((card, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>{card.content}</CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <ChartCard />
          <SalesCard />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TabsSection;