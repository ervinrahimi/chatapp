"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import sdb from "@/db/surrealdb";
import { useEffect, useState } from "react";
import { Uuid } from "surrealdb";
import { FetchCounts } from "./FetchData";
import type { CardData, TabsSectionClientProps } from "@/types/admin";

export default function TabsSectionClient({
  initialCards,
}: TabsSectionClientProps) {
  const [cards, setCards] = useState<CardData[]>(initialCards);

  useEffect(() => {
    let queryId: Uuid | null = null;

    async function setupLiveQuery() {
      try {
        const db = await sdb();
        queryId = await db.live("Chat");

        // Subscribe to live query updates
        db.subscribeLive(queryId, async (action, result) => {
          if (["CREATE", "DELETE", "UPDATE"].includes(action)) {
            try {
              // Fetch updated counts and update the state
              const updatedCounts = await FetchCounts();
              setCards(updatedCounts);
            } catch (error) {
              console.error("Error fetching live updates:", error);
            }
          }
        });
      } catch (error) {
        console.error("Error setting up live query:", error);
      }
    }

    setupLiveQuery();

    // Cleanup function to kill the live query when the component unmounts
    return () => {
      if (queryId) {
        sdb()
          .then((db) => db.kill(queryId))
          .catch((err) => console.error("Error killing live query:", err));
      }
    };
  }, [cards]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
          </CardHeader>
          <CardContent>{card.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
