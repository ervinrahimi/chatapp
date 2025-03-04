// AdminCardClient.tsx
"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import sdb from "@/db/surrealdb";
import { useEffect, useState } from "react";
import { Uuid } from "surrealdb";

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: string[];
  imageUrl?: string;
}
// New type extending Admin with a matching count
interface AdminWithCount extends Admin {
  matchingCount: number;
}

interface AdminCardClientProps {
  adminsList: Admin[];
}

export default function AdminCardClient({ adminsList }: AdminCardClientProps) {
  // Initialize state for top admins with matching count
  const [topAdmins, setTopAdmins] = useState<AdminWithCount[]>(
    adminsList.map((admin) => ({ ...admin, matchingCount: 0 }))
  );

  useEffect(() => {
    let queryId: Uuid | null = null;

    const fetchData = async () => {
      try {
        const db = await sdb();
        const res = await db.query(`SELECT admin_id FROM Chat`);
        const admins = Array.isArray(res?.[0]) ? res[0] : [];
        const adminIds = admins.map((admin: any) => admin.admin_id);

        const freqMap: Record<string, number> = {};
        adminIds.forEach((id: string) => {
          freqMap[id] = (freqMap[id] || 0) + 1;
        });

        const adminsWithCount: AdminWithCount[] = adminsList.map((admin) => ({
          ...admin,
          matchingCount: freqMap[admin.id] || 0,
        }));
        const sortedTopAdmins = adminsWithCount
          .sort((a, b) => b.matchingCount - a.matchingCount)
          .slice(0, 5);

        setTopAdmins(sortedTopAdmins);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    const subscribeToLiveUpdates = async () => {
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
    };

    fetchData();
    subscribeToLiveUpdates();

    return () => {
      if (queryId) {
        sdb().then((db) => {
          db.kill(queryId!).catch((err) =>
            console.error("Error killing live query:", err)
          );
        });
      }
    };
  }, [adminsList]);

  return (
    <div className="col-span-4 md:col-span-3">
      <div className="h-full space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow">
        <div className="flex flex-col space-y-2">
          <h3 className="text-xl font-semibold">Top Admins</h3>
          <p className="text-sm text-muted-foreground">
            You have {topAdmins.length} top admins.
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {topAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  {admin.imageUrl ? (
                    <img
                      src={admin.imageUrl}
                      alt={`${admin.firstName} ${admin.lastName}`}
                    />
                  ) : (
                    <AvatarFallback>
                      {`${admin.firstName[0] || ""}${admin.lastName[0] || ""}`}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">
                    {admin.firstName} {admin.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {admin.emailAddresses.join(", ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Chat count: {admin.matchingCount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
