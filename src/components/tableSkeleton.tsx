import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TableSkeleton() {
  return (
    <div className="w-full">
      {/* 🔹 فیلتر و منوی ستون‌ها */}
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-64 max-w-sm" /> {/* 🔹 اسکلت فیلتر ورودی */}
        <Skeleton className="h-10 w-32 ml-auto" /> {/* 🔹 اسکلت دکمه ستون‌ها */}
      </div>
      {/* 🔹 بدنه جدول */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(4)].map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-6 w-24" /> {/* 🔹 هدر ستون‌ها */}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(4)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-6 w-32" /> {/* 🔹 سلول‌های جدول */}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 🔹 صفحه‌بندی */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <Skeleton className="h-6 w-48" /> {/* 🔹 نمایش تعداد انتخاب‌شده */}
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-8 w-24" /> {/* 🔹 دکمه Previous */}
          <Skeleton className="h-8 w-24" /> {/* 🔹 دکمه Next */}
        </div>
      </div>
    </div>
  );
}
