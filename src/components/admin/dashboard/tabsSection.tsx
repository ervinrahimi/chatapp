import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import sdb from "@/db/surrealdb";
import { useEffect, useState } from "react";
import { Uuid } from "surrealdb";
import ChartCard from "./ChartCard";
import AdminCard from "./adminCard";

const content = {
  tabs: {
    overview: "Overview",
  },
};

const TabsSection = () => {
  const [cards, setCards] = useState([
    { title: "Chats", description: "0" },
    { title: "Customers", description: "0" },
    {
      title: "Pending Chats",
      description: "0",
    },
  ]);

  useEffect(() => {
    let queryId: Uuid | null = null;

    const fetchCounts = async (db: any) => {
      const chatRes = await db.query(
        "SELECT count() as count FROM Chat GROUP ALL"
      );
      const chatCount = chatRes?.[0]?.[0]?.count || 0;

      const chatUserRes = await db.query(
        "SELECT count() as count FROM ChatUser GROUP ALL"
      );
      const chatUserCount = chatUserRes?.[0]?.[0]?.count || 0;

      const pendingRes = await db.query(
        "SELECT count() as count FROM Chat WHERE status='pending' GROUP ALL"
      );
      const pendingCount = pendingRes?.[0]?.[0]?.count || 0;

      setCards([
        { title: "Chats", description: chatCount.toString() },
        { title: "Customers", description: chatUserCount.toString() },
        { title: "Pending Chats", description: pendingCount.toString() },
      ]);
    };

    async function loadChatsAndSubscribe() {
      try {
        const db = await sdb();
        await fetchCounts(db);

        // Set up live subscription for Chat table changes
        queryId = await db.live("Chat");
        db.subscribeLive(queryId, async (action: string, result: any) => {
          if (action === "CLOSE") return;
          if (["CREATE", "DELETE", "UPDATE"].includes(action)) {
            try {
              const dbInner = await sdb();
              await fetchCounts(dbInner);
            } catch (error) {
              console.error("Error fetching counts on live update:", error);
            }
          }
        });
      } catch (error) {
        console.error("Error in loadChatsAndSubscribe:", error);
      }
    }
    loadChatsAndSubscribe();

    // Cleanup live subscription on component unmount
    return () => {
      if (queryId) {
        sdb().then((db) => {
          if (queryId) {
            db.kill(queryId).catch((err) =>
              console.error("Error killing live query:", err)
            );
          }
        });
      }
    };
  }, []);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">{content.tabs.overview}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <ChartCard />
          <AdminCard />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TabsSection;
