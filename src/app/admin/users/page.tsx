import { UserManagementTable } from '@/components/admin/users/users-table';

export default function UserManagementPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold my-5">User Management</h1>
      <UserManagementTable />
    </div>
  );
}
