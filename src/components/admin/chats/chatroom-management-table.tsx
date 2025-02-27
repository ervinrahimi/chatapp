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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import sdb from '@/db/surrealdb';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChatView } from './ChatView';
import { type ChatRoom, Requirement } from '@/types/chat';

/**
 * Custom hook for fetching and managing chat rooms from SurrealDB
 */
function useChatRooms(adminsList: string[]) {
  const [data, setData] = React.useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  /**
   * Helper function to update chat status in the database and local state
   */
  const updateChatStatus = React.useCallback(
    async (chatId: string, newStatus: 'closed' | 'viewed') => {
      try {
        const db = await sdb();
        // Update the chat record in the database
        await db.query(`UPDATE Chat SET status = "${newStatus}" WHERE id = ${chatId}`);

        // Update local state
        setData((prevData) =>
          prevData.map((chat) =>
            chat.id === chatId ? { ...chat, status: newStatus } : chat
          )
        );
      } catch (error) {
        console.error('Error updating chat room status:', error);
      }
    },
    []
  );

  /**
   * Fetch chat data and user details from SurrealDB
   */
  React.useEffect(() => {
    async function fetchData() {
      try {
        const db = await sdb();
        // Query to get chat data plus user details
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
          createdAt: chat.created_at
            ? new Date(chat.created_at).toLocaleString()
            : '',
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

  return {
    data,
    isLoading,
    updateChatStatus,
  };
}

/**
 * Custom hook for building columns for the chat room table (React Table)
 */
function useChatRoomColumns(
  adminId: string,
  adminsList: string[],
  updateChatStatus: (chatId: string, newStatus: 'closed' | 'viewed') => Promise<void>
) {
  return React.useMemo<ColumnDef<ChatRoom>[]>(
    () => [
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

                {/* Close chat */}
                <DropdownMenuItem
                  onClick={() => updateChatStatus(chatRoom.id, 'closed')}
                >
                  Chatroom Closed
                </DropdownMenuItem>

                {/* Mark as viewed */}
                <DropdownMenuItem
                  onClick={() => updateChatStatus(chatRoom.id, 'viewed')}
                >
                  Mark as viewed
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* View chat in Sheet */}
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
                    <ChatView
                      chatId={chatRoom.id}
                      adminId={adminId}
                      adminsList={adminsList}
                    />
                  </SheetContent>
                </Sheet>

                {/* Alert dialog as an example for closing chat */}
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
                      <AlertDialogAction
                        onClick={() =>
                          console.log('Chat room closed:', chatRoom.id)
                        }
                      >
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
    ],
    [adminId, adminsList, updateChatStatus]
  );
}

/**
 * Main component to render the Chat Room Management Table
 */
export function ChatRoomManagementTable({ adminsList, adminId }: Requirement) {
  // Use custom hook to manage chat room data
  const { data, isLoading, updateChatStatus } = useChatRooms(adminsList);

  // States for sorting, filtering, column visibility, and row selection
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Build table columns with a custom hook
  const columns = useChatRoomColumns(adminId, adminsList, updateChatStatus);

  // Create the table instance using TanStack React Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Simple loading state
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

  // Render the table
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
