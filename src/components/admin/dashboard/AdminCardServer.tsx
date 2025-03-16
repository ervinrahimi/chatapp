import React from "react";
import AdminCardClient from "./adminCardClient";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { use } from "react";

import { FetchAdminsData } from "./FetchData";
import { AdminWithCount } from "@/types/admin";

async function clerkAdminsList() {
  const users = await (await clerkClient()).users.getUserList();
  const adminId = (await currentUser())?.id;
  if (!adminId) throw new Error("Admin not found");
  const admins = users.data.filter(
    (user) => user.publicMetadata?.role === "admin"
  );
  const adminsList = admins.map((admin) => ({
    id: admin.id,
    imageUrl: admin.imageUrl,
    firstName: admin.firstName ?? "",
    lastName: admin.lastName ?? "",
    emailAddresses: admin.emailAddresses.map((email) => email.emailAddress),
    matchingCount: 0, // Default value for matchingCount
  }));
  return adminsList;
}

export default function AdminCardServer() {
  const AdminList = use(clerkAdminsList());

  const topAdmins = use(FetchAdminsData(AdminList)) as AdminWithCount[];
  // Render the AdminCardClient component with the admin list.
  return <AdminCardClient initialAdmins={topAdmins} adminsList={AdminList} />;
}
