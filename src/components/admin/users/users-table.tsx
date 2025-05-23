/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Connect to the database using the sdb function (settings in page.tsx)
import sdb from "@/db/surrealdb";
import { Uuid } from "surrealdb";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import TableSkeleton from "@/components/tableSkeleton";

interface Customer {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export function UserManagementTable() {
  // State for database connection
  const [dbClient, setDbClient] = React.useState<any>(null);
  const [isAuthDone, setIsAuthDone] = React.useState(false);

  // State for customers and loading status
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // State for table settings
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Connect to SurrealDB and perform Auth
  React.useEffect(() => {
    const connectToDB = async () => {
      try {
        const db = await sdb(); // The sdb function establishes the connection
        setDbClient(db);
        setIsAuthDone(true);
      } catch (err) {
        console.error("Error connecting to SurrealDB:", err);
      }
    };

    connectToDB();
  }, []);

  // Fetch customers from the database using the .query method
  React.useEffect(() => {
    let queryId: Uuid | null = null;
    async function fetchCustomersAndSubscribe() {
      if (!isAuthDone || !dbClient) return;
      try {
        // Fetch initial customers from SurrealDB
        const response = (await dbClient.query(
          "SELECT id,name,email,created_at FROM ChatUser ORDER BY created_at DESC",
          {}
        )) as [Customer[]];
        setCustomers(response[0]);
        setIsLoading(false);

        // Set up live subscription for ChatUser table changes
        queryId = await dbClient.live("ChatUser");
        dbClient.subscribeLive(queryId, (action: string, result: any) => {
          if (action === "CLOSE") return;
          if (action === "CREATE") {
            const newCustomer: Customer = {
              id: result.id,
              name: result.name,
              email: result.email,
              created_at: result.created_at,
            };
            setCustomers((prev) => [newCustomer, ...prev]);
          } else if (action === "UPDATE") {
            setCustomers((prev) =>
              prev.map((customer) =>
                customer.id === result.id
                  ? { ...customer, name: result.name, email: result.email }
                  : customer
              )
            );
          } else if (action === "DELETE") {
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== result.id)
            );
          }
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    }
    fetchCustomersAndSubscribe();

    // Cleanup live subscription on component unmount
    return () => {
      if (queryId) {
        sdb().then((db) => {
          if (queryId) {
            db.kill(queryId).catch((err) =>
              console.error("Error killing live query:", err)
            );
          }
        });
      }
    };
  }, [isAuthDone, dbClient]);

  // Edit customer operation
  const handleEditCustomer = React.useCallback(
    async (customer: Customer) => {
      if (!isAuthDone || !dbClient) return;
      const newName =
        (document.getElementById(`name-${customer.id}`) as HTMLInputElement)
          ?.value || customer.name;
      const newEmail =
        (document.getElementById(`email-${customer.id}`) as HTMLInputElement)
          ?.value || customer.email;
      try {
        await dbClient.query(
          `UPDATE ${customer.id} SET name = "${newName}", email = "${newEmail}";`
        );
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customer.id ? { ...c, name: newName, email: newEmail } : c
          )
        );
        console.log("Customer updated:", customer.id);
      } catch (error) {
        console.error("Error updating customer:", error);
      }
    },
    [isAuthDone, dbClient]
  );

  // Delete customer operation
  const handleDeleteCustomer = React.useCallback(
    async (customer: Customer) => {
      if (!isAuthDone || !dbClient) return;
      try {
        await dbClient.query(`DELETE ${customer.id};`, {});
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        console.log("Customer deleted:", customer.id);
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    },
    [isAuthDone, dbClient]
  );

  // Define table columns according to the Customer structure
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div>{date.toLocaleString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;
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
              <DropdownMenuSeparator />
              {/* Edit customer */}
              <Sheet>
                <SheetTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit customer
                  </DropdownMenuItem>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <VisuallyHidden>
                      <SheetTitle>Edit Customer</SheetTitle>
                    </VisuallyHidden>
                    <SheetTitle>Edit Customer</SheetTitle>
                    <SheetDescription>
                      Make changes to the customer here. Click save when youre
                      done.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <Input
                      id={`name-${customer.id}`}
                      defaultValue={customer.name}
                      className="mb-2"
                      placeholder="Name"
                    />
                    <Input
                      id={`email-${customer.id}`}
                      defaultValue={customer.email}
                      className="mb-2"
                      placeholder="Email"
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>Save Changes</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will update the customers information.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEditCustomer(customer)}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </SheetContent>
              </Sheet>
              {/* Delete customer */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Delete customer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the customer and remove their data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteCustomer(customer)}
                    >
                      Delete
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

  // Table settings using useReactTable
  const table = useReactTable({
    data: customers,
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
    return <TableSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
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
                  data-state={row.getIsSelected() && "selected"}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
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
