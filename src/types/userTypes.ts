export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export interface AdminsList {
  adminsList: {
    id: string;
    imageUrl: string;
    firstName: string;
    lastName: string;
    emailAddresses: string[];
  }[];
}
