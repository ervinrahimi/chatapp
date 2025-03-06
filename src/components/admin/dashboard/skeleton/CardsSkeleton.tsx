"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Chats</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-16" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-16" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Chats</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-16" />
        </CardContent>
      </Card>
    </div>
  );
}
