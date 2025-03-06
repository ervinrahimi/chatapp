import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SkeletonAdmin() {
  return (
    <div className="col-span-4 md:col-span-3">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="p-4">
                  <CardHeader className="p-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <Skeleton className="h-12 w-12 rounded-full" />
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>

                      <Badge variant="secondary">
                        <Skeleton className="h-4 w-12" />
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 pt-2">
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
