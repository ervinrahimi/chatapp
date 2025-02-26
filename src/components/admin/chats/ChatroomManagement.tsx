import React from 'react';
import { ChatRoomManagementTable } from './chatroom-management-table';
import { clerkClient } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';

export default async function ChatroomManagment() {
  // Retrieve the list of users from Clerk.
  const users = await(await clerkClient()).users.getUserList();
  const adminId = (await currentUser())?.id;

  // Filter users to include only those with the role 'admin'.
  const admins = users.data.filter((user) => user.publicMetadata?.role === 'admin');

  // Map each admin to a simplified object containing only the required fields.
  const adminsList = admins.map((admin) => ({
    id: admin.id,
    imageUrl: admin.imageUrl,
    firstName: admin.firstName ?? '',
    lastName: admin.lastName ?? '',
    emailAddresses: admin.emailAddresses.map((email) => email.emailAddress),
  }));

  if (!adminId) return <div>Error: Admin not found</div>;

  return <ChatRoomManagementTable adminsList={adminsList} adminId={adminId} />;
}