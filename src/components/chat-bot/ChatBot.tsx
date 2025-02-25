import { clerkClient } from "@clerk/nextjs/server";
import { ChatWidget } from "./ChatWidget";

export async function ChatBot() {
  // Retrieve the list of users from Clerk.
  const users = await (await clerkClient()).users.getUserList();

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

  // Render the ChatWidget component, passing the adminsList as a prop.
  return <ChatWidget adminsList={adminsList} />;
}
