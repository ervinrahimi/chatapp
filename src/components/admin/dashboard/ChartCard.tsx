"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import sdb from "@/db/surrealdb";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Uuid } from "surrealdb";
const ChartCard = () => {
  const [data, setData] = useState<{ name: string; total: number }[]>([]);

  useEffect(() => {
    let queryId: Uuid | null = null;

    // Function to fetch chat data from the database
    async function fetchData() {
      try {
        const db = await sdb();
        const res = await db.query(
          `SELECT * FROM Chat WHERE time::format(created_at, "%Y-%m-%d") >= time::format(time::now() - 5d, "%Y-%m-%d")`
        );

        const chats = Array.isArray(res?.[0]) ? res[0] : [];

        // Group chat records by their creation date
        const groupByDate = chats.reduce(
          (acc: Record<string, number>, chat: any) => {
            const date = new Date(chat.created_at).toLocaleDateString();
            if (!acc[date]) {
              acc[date] = 0;
            }
            acc[date] += 1;
            return acc;
          },
          {}
        );

        // Format the grouped data for the chart component
        const formattedData = Object.entries(groupByDate)
          .map(([date, total]) => ({ name: date, total }))
          .sort(
            (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()
          );

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    }

    // Function to subscribe to live updates from the database
    async function subscribeToLiveUpdates() {
      try {
        const db = await sdb();
        queryId = await db.live("Chat");
        db.subscribeLive(queryId, (action: string, result: any) => {
          if (action === "CLOSE") return;
          if (["CREATE", "UPDATE", "DELETE"].includes(action)) {
            fetchData();
          }
        });
      } catch (error) {
        console.error("Error subscribing to live updates:", error);
      }
    }

    fetchData();
    subscribeToLiveUpdates();

    // Clean up the live subscription on component unmount
    return () => {
      if (queryId) {
        sdb().then((db) => {
          db.kill(queryId).catch((err) =>
            console.error("Error killing live query:", err)
          );
        });
      }
    };
  }, []);

  return (
    <div className="col-span-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Chat Statistics</CardTitle>
        </CardHeader>

        <CardContent className="h-[300px]">
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                label={{
                  value: "Number of Chats",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartCard;
