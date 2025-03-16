"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import sdb from "@/db/surrealdb";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { FetchChartData } from "./FetchData";
import { Uuid } from "surrealdb";

export default function ChartCardClient({
  initialData,
}: {
  initialData: { name: string; total: number }[];
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let queryId: Uuid | null = null;

    const subscribeToLiveUpdates = async () => {
      try {
        const db = await sdb();
        queryId = await db.live("Chat");

        db.subscribeLive(queryId, async (action, result) => {
          if (["CREATE", "UPDATE", "DELETE"].includes(action)) {
            const updatedData = await FetchChartData();
            setData(updatedData);
          }
        });
      } catch (error) {
        console.error("Error subscribing to live updates:", error);
      }
    };

    subscribeToLiveUpdates();

    return () => {
      if (queryId) {
        sdb().then((db) =>
          db
            .kill(queryId!)
            .catch((err) => console.error("Error killing live query:", err))
        );
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
}
