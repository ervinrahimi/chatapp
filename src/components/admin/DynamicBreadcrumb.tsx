'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';

const customLabels: Record<string, string> = {
  admin: 'Dashboard',
  chats: 'Chat Room Management',
  users: 'User Management',
  // در صورت نیاز می‌توانید مپینگ‌های بیشتری اضافه کنید.
};

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const pathCrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/') + '/';
    const defaultLabel = segment.charAt(0).toUpperCase() + segment.slice(1);
    const label = customLabels[segment.toLowerCase()] || defaultLabel;
    return { href, label };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathCrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.href}>
            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
            {index < pathCrumbs.length - 1 && ' > '}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
