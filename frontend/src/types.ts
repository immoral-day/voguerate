export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string | null;
  profileBackground?: string | null;
  reputation: number;
  reviewsCount: number;
  role: 'USER' | 'DESIGNER' | 'ADMIN';
  bio?: string;
  joinedDate?: string;
  bannedUntil?: string | null;
  bannedPermanently?: boolean;
  banReason?: string | null;
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
  authToken?: string;
  isSummary?: boolean;
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
  likedByMe?: boolean;
  date: string;
  createdAt?: string;
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

export interface Article {
  id: string;
  title: string;
  topic?: string | null;
  /** HTML-контент; с бэкенда может прийти null */
  body?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackMessage {
  id: string;
  userId?: string | null;
  message: string;
  page?: string | null;
  createdAt?: string;
  user?: User | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt?: string | null;
  createdAt?: string;
  sender?: User | null;
  recipient?: User | null;
}

export interface ChatConversation {
  id: string;
  userId: string;
  otherUser: User;
  lastMessage: ChatMessage;
  unreadCount: number;
  updatedAt?: string;
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
    | 'AUTHORSHIP'
    | 'NEWS'
    | 'ARTICLE_DETAIL'
    | 'MESSAGES';
  itemId?: string;
  userId?: string;
  articleId?: string;
  designerName?: string;
  dropId?: string;
  conversationId?: string;
  recipientId?: string;
}
