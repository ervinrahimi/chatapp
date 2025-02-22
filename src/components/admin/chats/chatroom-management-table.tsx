'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import sdb from '@/db/surrealdb'; // اتصال به SurrealDB

// تعریف اینترفیس ChatRoom با فیلدهای مورد نیاز
interface ChatRoom {
  id: string;
  user: string;
  admin: string;
  status: 'pending' | 'activated' | 'viewed' | 'closed';
  lastMessage: string;
  createdAt: string;
}

// تعریف ستون‌ها با استفاده از TanStack React Table
const columns: ColumnDef<ChatRoom>[] = [
  {
    accessorKey: 'user',
    header: 'Customer Name',
    cell: ({ row }) => <div>{row.getValue('user')}</div>,
  },
  {
    accessorKey: 'admin',
    header: 'Admin',
    cell: ({ row }) => <div>{row.getValue('admin')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <div
          className={
            status === 'pending'
              ? 'text-yellow-600'
              : status === 'activated'
              ? 'text-green-600'
              : status === 'viewed'
              ? 'text-blue-600'
              : status === 'closed'
              ? 'text-red-600'
              : 'text-gray-600'
          }
        >
          {status === 'pending'
            ? 'Pending'
            : status === 'activated'
            ? 'Activated'
            : status === 'viewed'
            ? 'Viewed'
            : status === 'closed'
            ? 'Closed'
            : 'Unknown'}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created At
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('createdAt')}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const chatRoom = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => console.log('Mark as viewed:', chatRoom.id)}>
              Mark as viewed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Sheet>
              <SheetTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Send message
                </DropdownMenuItem>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Send message</SheetTitle>
                  <SheetDescription>Send your message to the user.</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <Textarea placeholder="Type your message here..." className="mb-2" />
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Send message
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Close chat room
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will close the chat room and log all details.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => console.log('Chat room closed:', chatRoom.id)}>
                    <X className="mr-2 h-4 w-4" /> Close chat room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// کامپوننت اصلی جدول مدیریت چت روم
export function ChatRoomManagementTable() {
  const [data, setData] = React.useState<ChatRoom[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const db = await sdb();
        // Query برای دریافت اطلاعات Chat به همراه اطلاعات مشتری و ادمین
        const res = await db.query(
          'SELECT *, customer_id.* as ChatUser, admin_id.* as ChatAdmin FROM Chat ORDER BY created_at DESC'
        );
        const chats = res?.[0] || [];

        // نگاشت داده‌ها به ساختار ChatRoom
        const mappedData: ChatRoom[] = chats.map((chat: any) => ({
          id: chat.id,
          user: chat.ChatUser ? chat.ChatUser.name : '',
          admin: chat.ChatAdmin ? `${chat.ChatAdmin.firstname} ${chat.ChatAdmin.lastname}` : '',
          // نگاشت وضعیت: اگر pending یا activated باشد => open، اگر viewed باشد => viewed، در غیر این صورت closed
          status:
            chat.status === 'pending'
              ? 'pending'
              : chat.status === 'activated'
              ? 'activated'
              : chat.status === 'viewed'
              ? 'viewed'
              : chat.status === 'closed'
              ? 'closed'
              : 'unknown',
          createdAt: chat.created_at ? new Date(chat.created_at).toLocaleString() : '',
        }));

        setData(mappedData);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="ml-auto h-10 w-[100px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <TableHead key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {/* قسمت سرچ: فیلتر بر اساس ستون user */}
        <Input
          placeholder="Filter by user..."
          value={(table.getColumn('user')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('user')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mr-auto">
              Columns <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
