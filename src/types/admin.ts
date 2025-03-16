export interface CardData {
  title: string;
  description: string;
}

export interface TabsSectionClientProps {
  initialCards: CardData[];
}

 interface TopAdminProps {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: string[];
  imageUrl?: string;
}
// New type extending Admin with a matching count
export interface AdminWithCount extends TopAdminProps {
  matchingCount: number;
}

export interface AdminCardClientProps {
  adminsList: TopAdminProps[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  created_at: string;
}