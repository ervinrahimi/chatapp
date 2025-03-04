// TabsSectionClient.jsx
"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import sdb from "@/db/surrealdb";
import { Uuid } from "surrealdb";

const initialCards = [
  { title: "Chats", description: "0" },
  { title: "Customers", description: "0" },
  { title: "Pending Chats", description: "0" },
];

export default function TabsSectionClient() {
  const [cards, setCards] = useState(initialCards);

  useEffect(() => {
    let queryId = Uuid || null;

    // Function to fetch counts from the database
    const fetchCounts = async (db) => {
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

    // Function to load chats and subscribe to live updates
    async function loadChatsAndSubscribe() {
      try {
        const db = await sdb();
        await fetchCounts(db);

        // Subscribe to live updates
        queryId = await db.live("Chat");
        db.subscribeLive(queryId, async (action, result) => {
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

    // Cleanup function to kill the live query
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
  );
}
