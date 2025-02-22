"use client"

import type * as React from "react"
import { LayoutDashboard, MessageSquare, Users } from "lucide-react"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"

const navMainData = [
  {
    title: "Dashboard",
    url: "/admin/chat/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Chat Room Management",
    url: "/admin/chat/chats",
    icon: MessageSquare,
  },
  {
    title: "User Management",
    url: "/admin/chat/users",
    icon: Users,
  }
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()



  const currentUser = user
    ? {
     
        name: `${user.username}`, 
        email: user.emailAddresses?.[0]?.emailAddress,
        avatar: user.imageUrl,
      }
    : {
        name: "Guest User",
        email: "guest@example.com",
        avatar: "/avatars/guest.jpg",
      }

  return (
    <Sidebar collapsible="icon" {...props}>
     
      <SidebarContent>
        <NavMain items={navMainData} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
