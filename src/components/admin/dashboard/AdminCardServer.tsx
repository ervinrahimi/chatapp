import React from "react";
import AdminCardClient from "./adminCardClient";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export default async function AdminCardServer() {
  // Retrieve the list of users from the Clerk API.
  const users = await (await clerkClient()).users.getUserList();
  // Get the current admin's id.
  const adminId = (await currentUser())?.id;

  // Return an error message if no admin is found.
  if (!adminId) return <div>Error: Admin not found</div>;

  // Filter users whose role is "admin" based on public metadata.
  const admins = users.data.filter(
    (user) => user.publicMetadata?.role === "admin"
  );

  // Map the admin data to a simplified structure.
  const adminsList = admins.map((admin) => ({
    id: admin.id,
    imageUrl: admin.imageUrl,
    firstName: admin.firstName ?? "",
    lastName: admin.lastName ?? "",
    emailAddresses: admin.emailAddresses.map((email) => email.emailAddress),
  }));

  // Render the AdminCardClient component with the admin list.
  return <AdminCardClient adminsList={adminsList} />;
}
