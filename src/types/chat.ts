export interface ChatRoom {
  id: string;
  user: string;
  status: 'pending' | 'active' | 'viewed' | 'closed' | 'unknown';
  createdAt: string;
}

// Interface for AdminsList prop
export interface Requirement {
  adminsList: {
    id: string;
    imageUrl: string;
    firstName: string;
    lastName: string;
    emailAddresses: string[];
  }[];
  adminId: string;
}