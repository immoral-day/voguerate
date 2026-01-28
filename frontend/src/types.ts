export interface User {
  id: string;
  username: string;
  avatar?: string | null;
  profileBackground?: string | null;
  reputation: number;
  reviewsCount: number;
  role: 'USER' | 'DESIGNER' | 'ADMIN';
  bio?: string;
  joinedDate?: string;
  favoriteDesigners?: string[];
  favorites?: string[];
  wardrobe: {
    owned: string[];
    wanted: string[];
    sold: string[];
  };
  badges: string[];
  following: string[];
  followers: string[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  date: string;
  user?: User;
}

export interface RatingBreakdown {
  concept: number;
  execution: number;
  dna: number;
  relevance: number;
  vibe: number;
}

export interface Review {
  id: string;
  userId: string;
  clothingId: string;
  rating: number;
  ratingBreakdown?: RatingBreakdown;
  text: string;
  likes: number;
  date: string;
  reportsCount?: number;
  user?: User;
  clothing?: ClothingItem;
  comments: Comment[];
}

export interface ReviewReport {
  id: string;
  reviewId?: string;
  reporterId?: string;
  reason?: string | null;
  createdAt?: string;
  review?: Review;
  reporter?: User;
}

export interface UserReport {
  id: string;
  reportedUserId?: string;
  reporterId?: string;
  reason?: string | null;
  createdAt?: string;
  reportedUser?: User;
  reporter?: User;
}

export interface ClothingItem {
  id: string;
  brand: string;
  name: string;
  image: string;
  images?: string[];
  releaseDate: string;
  averageRating: number;
  ratingCount: number;
  type: 'SINGLE_LOOK' | 'COLLECTION';
  category: 'Streetwear' | 'Luxury' | 'Techwear' | 'Vintage';
  price: number;
  tags: string[];
  sizes: string[];
  colors: string[];
}

export interface UpcomingDrop {
  id: string;
  brand: string;
  name: string;
  image: string;
  releaseDate: string;
  price: number | string;
  copCount: number;
  dropCount: number;
  coppedBy?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface AuthorshipRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  portfolioLink?: string;
  adminComment?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
}

export interface ViewState {
  view:
    | 'HOME'
    | 'EXPLORE'
    | 'LEADERBOARD'
    | 'ITEM_DETAIL'
    | 'PROFILE'
    | 'DESIGNER'
    | 'VERSUS'
    | 'CALENDAR'
    | 'TOP_RATED'
    | 'FEEDBACK'
    | 'DROP_DETAIL'
    | 'MANIFESTO'
    | 'ADMIN'
    | 'AUTHORSHIP';
  itemId?: string;
  userId?: string;
  designerName?: string;
  dropId?: string;
  conversationId?: string;
}
