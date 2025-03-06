import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChartSkeleton() {
  return (
    <div className="col-span-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <Separator className="mb-4" />
          <div className="w-full h-full flex flex-col justify-center items-center space-y-3">
            <Skeleton className="h-6 w-3/4" />
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-8 w-[80%] rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
