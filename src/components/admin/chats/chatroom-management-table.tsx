'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, X } from 'lucide-react';

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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import sdb from '@/db/surrealdb';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChatView } from './ChatView';

// Interface for ChatRoom
interface ChatRoom {
  id: string;
  user: string;
  status: 'pending' | 'active' | 'viewed' | 'closed' | 'unknown';
  createdAt: string;
}

// Interface for AdminsList prop
interface Requirement {
  adminsList: {
    id: string;
    imageUrl: string;
    firstName: string;
    lastName: string;
    emailAddresses: string[];
  }[];
  adminId: string;
}

export function ChatRoomManagementTable({ adminsList, adminId }: Requirement) {
  const [data, setData] = React.useState<ChatRoom[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Define table columns using TanStack React Table
  const columns = React.useMemo<ColumnDef<ChatRoom>[]>(() => [
    {
      accessorKey: 'user',
      header: 'Customer Name',
      cell: ({ row }) => <div>{row.getValue('user')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusColor =
          status === 'pending'
            ? 'text-yellow-600'
            : status === 'active'
            ? 'text-green-600'
            : status === 'viewed'
            ? 'text-blue-600'
            : status === 'closed'
            ? 'text-red-600'
            : 'text-gray-600';
        const statusLabel =
          status === 'pending'
            ? 'Pending'
            : status === 'active'
            ? 'Active'
            : status === 'viewed'
            ? 'Viewed'
            : status === 'closed'
            ? 'Closed'
            : 'Unknown';
        return <div className={statusColor}>{statusLabel}</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created At <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      ),
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
                    View Chatroom
                  </DropdownMenuItem>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-full">
                  <SheetHeader>
                    <VisuallyHidden>
                      <SheetTitle>Chat Room</SheetTitle>
                    </VisuallyHidden>
                  </SheetHeader>
                  {/* Render ChatView component with chatId and adminId */}
                  <ChatView chatId={chatRoom.id} adminId={adminId} adminsList={adminsList} />
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
  ], []);

  // Fetch chat rooms data from SurrealDB on component mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        const db = await sdb();
        // Query to get chat data along with user details
        const res = await db.query(
          'SELECT *, user_id.* as ChatUser FROM Chat ORDER BY created_at DESC'
        );
        const chats = res?.[0] || [];

        // Map the fetched data to the ChatRoom structure
        const mappedData: ChatRoom[] = chats.map((chat: any) => ({
          id: chat.id,
          user: chat.ChatUser ? chat.ChatUser.name : '',
          status:
            chat.status === 'pending'
              ? 'pending'
              : chat.status === 'active'
              ? 'active'
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
  }, [adminsList]);

  // Initialize the React Table instance
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

  // Display a simplified loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="py-4">
          <Skeleton className="h-10 w-[250px]" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Render the chat room management table
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {/* Search filter for user column */}
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
