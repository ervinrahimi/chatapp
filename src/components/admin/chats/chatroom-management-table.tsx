'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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

export function ChatRoomManagementTable({ adminsList, adminId }: Requirement) {
  // State for chat rooms data and loading status
  const [data, setData] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for table configurations
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Helper function to map status to allowed values
  const mapStatus = (status: string): ChatRoom['status'] => {
    if (status === 'pending') return 'pending';
    if (status === 'active') return 'active';
    if (status === 'viewed') return 'viewed';
    if (status === 'closed') return 'closed';
    return 'unknown';
  };

  // Combined useEffect: fetch initial chats and set up live subscription
  useEffect(() => {
    let queryId: string | null = null;
    async function loadChatsAndSubscribe() {
      try {
        const db = await sdb();
        // Fetch initial chats from SurrealDB
        const res = await db.query(
          'SELECT *, user_id.* as ChatUser FROM Chat ORDER BY created_at DESC'
        );
        const chats = res?.[0] || [];
        const mappedData: ChatRoom[] = chats.map((chat: any) => ({
          id: chat.id,
          user: chat.ChatUser ? chat.ChatUser.name : '',
          status: mapStatus(chat.status),
          createdAt: chat.created_at ? new Date(chat.created_at).toLocaleString() : '',
        }));
        setData(mappedData);
        setIsLoading(false);

        // Set up live subscription for Chat table changes
        queryId = await db.live('Chat');
        db.subscribeLive(queryId, (action: string, result: any) => {
          if (action === 'CLOSE') return;
          if (action === 'CREATE') {
            // For CREATE action, fetch the user data via a query since result.ChatUser is not available
            (async () => {
              try {
                const dbInner = await sdb();
                // Query the user table to get the user's name using result.user_id
                const userRes = await dbInner.query(`SELECT name FROM ChatUser WHERE id = ${result.user_id}`);
                console.log(userRes)
                const newChat: ChatRoom = {
                  id: result.id,
                  user: userRes?.[0]?.[0]?.name || '',
                  status: mapStatus(result.status),
                  createdAt: result.created_at ? new Date(result.created_at).toLocaleString() : '',
                };
                setData(prev => [newChat, ...prev]);
              } catch (error) {
                console.error('Error fetching user for new chat:', error);
              }
            })();
          } else if (action === 'UPDATE') {
            console.log(result)
            const newStatus = mapStatus(result.status);
            setData(prev =>
              prev.map(chat =>
                chat.id.id === result.id.id ? { ...chat, status: newStatus } : chat
              )
            );
          } else if (action === 'DELETE') {
            setData(prev =>
              prev.filter(chat => chat.id.id !== result.id.id)
            );
          }
        });
      } catch (error) {
        console.error('Error in loadChatsAndSubscribe:', error);
      }
    }
    loadChatsAndSubscribe();

    // Cleanup live subscription on component unmount
    return () => {
      if (queryId) {
        sdb().then(db => {
          db.kill(queryId).catch(err => console.error('Error killing live query:', err));
        });
      }
    };
  }, [adminsList]);

  // Manual chat status update function (e.g. via action menu)
  const updateChatStatus = useCallback(
    async (chatId: any, newStatus: 'closed' | 'viewed') => {
      try {
        const db = await sdb();
        await db.query(`UPDATE Chat SET status = "${newStatus}" WHERE id = ${chatId}`);
      } catch (error) {
        console.error('Error updating chat room status:', error);
      }
    },
    []
  );

  // Define table columns using useMemo
  const columns = useMemo<ColumnDef<ChatRoom>[]>(
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
                <DropdownMenuItem onClick={() => updateChatStatus(chatRoom.id, 'closed')}>
                  Chatroom Closed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateChatStatus(chatRoom.id, 'viewed')}>
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
                    <ChatView
                      chatId={chatRoom.id}
                      adminId={adminId}
                      adminsList={adminsList}
                    />
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
    ],
    [adminId, adminsList, updateChatStatus]
  );

  // Create table instance using useReactTable
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by user..."
          value={(table.getColumn('user')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('user')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mr-auto">
              Columns <ChevronDown className="mr-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
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
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
