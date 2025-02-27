'use client';

import type * as React from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, MessageSquare, Users } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

const navMainData = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Chat Room Management',
    url: '/admin/chats',
    icon: MessageSquare,
  },
  {
    title: 'User Management',
    url: '/admin/users',
    icon: Users,
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const pathname = usePathname();

  const currentUser = user
    ? {
        name: `${user.username}`,
        email: user.emailAddresses?.[0]?.emailAddress,
        avatar: user.imageUrl,
      }
    : {
        name: 'Guest User',
        email: 'guest@example.com',
        avatar: '/avatars/guest.jpg',
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMainData} activePath={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
