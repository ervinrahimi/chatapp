// AdminCardClient.tsx
"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      {/* Main Card */}

      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Top Admins</CardTitle>

          <CardDescription>
            You have {topAdmins.length} top admins.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {topAdmins.map((admin) => (
                <Card key={admin.id} className="p-4">
                  <CardHeader className="p-0 pb-2">
                    <div className="flex items-center space-x-4">
                      {/* Avatar with Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-12 w-12">
                            {admin.imageUrl ? (
                              <img
                                src={admin.imageUrl}
                                alt={`${admin.firstName} ${admin.lastName}`}
                              />
                            ) : (
                              <AvatarFallback>
                                {admin.firstName[0] || ""}
                                {admin.lastName[0] || ""}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {admin.firstName} {admin.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {admin.emailAddresses[0]}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Admin Name and Badge */}
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {admin.firstName} {admin.lastName}
                        </CardTitle>
                        <CardDescription>
                          {admin.emailAddresses.join(", ")}
                        </CardDescription>
                      </div>

                      <Badge variant="secondary">Admin</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Chat count: {admin.matchingCount}
                    </p>
                  </CardContent>

                  {/* <CardFooter className="p-0 pt-4 flex justify-end">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </CardFooter> */}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        {/*  <CardFooter className="border-t p-4 flex justify-center">
          <Button variant="default">Manage Admins</Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
