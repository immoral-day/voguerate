import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import {
  Article,
  ClothingItem,
  Comment,
  RatingBreakdown,
  Review,
  UpcomingDrop,
  User,
} from '../types';

type JsonRecord = Record<string, unknown>;

export interface BootstrapPayload {
  items: ClothingItem[];
  reviews: Review[];
  users: User[];
  drops: UpcomingDrop[];
  articles: Article[];
}

export interface ProfilePayload {
  user: User;
  reviews: Review[];
}

const asRecord = (value: unknown): JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};

const firstDefined = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null);

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

const asArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const asStringArray = (value: unknown) => asArray(value).map((entry) => asString(entry)).filter(Boolean);

const asCategory = (value: unknown): ClothingItem['category'] => {
  const category = asString(value);
  return ['Streetwear', 'Luxury', 'Techwear', 'Vintage'].includes(category)
    ? category as ClothingItem['category']
    : 'Streetwear';
};

const asItemType = (value: unknown): ClothingItem['type'] =>
  asString(value) === 'COLLECTION' ? 'COLLECTION' : 'SINGLE_LOOK';

const asRole = (value: unknown): User['role'] => {
  const role = asString(value, 'USER').toUpperCase();
  return ['USER', 'DESIGNER', 'ADMIN'].includes(role) ? role as User['role'] : 'USER';
};

export const normalizeUser = (value: unknown): User => {
  const raw = asRecord(value);
  const wardrobe = asRecord(raw.wardrobe);

  return {
    id: asString(raw.id),
    username: asString(firstDefined(raw.username, raw.name), 'Пользователь'),
    email: asString(raw.email) || undefined,
    avatar: asString(firstDefined(raw.avatar, raw.avatar_url), DEFAULT_AVATAR),
    profileBackground: asString(firstDefined(raw.profileBackground, raw.profile_background)) || null,
    reputation: asNumber(raw.reputation),
    reviewsCount: asNumber(firstDefined(raw.reviewsCount, raw.reviews_count)),
    role: asRole(raw.role),
    bio: asString(raw.bio),
    joinedDate: asString(firstDefined(raw.joinedDate, raw.joined_date)) || undefined,
    bannedUntil: asString(firstDefined(raw.bannedUntil, raw.banned_until)) || null,
    bannedPermanently: asBoolean(firstDefined(raw.bannedPermanently, raw.banned_permanently)),
    banReason: asString(firstDefined(raw.banReason, raw.ban_reason)) || null,
    favoriteDesigners: asStringArray(firstDefined(raw.favoriteDesigners, raw.favorite_designers)),
    favorites: asStringArray(raw.favorites),
    wardrobe: {
      owned: asStringArray(wardrobe.owned),
      wanted: asStringArray(wardrobe.wanted),
      sold: asStringArray(wardrobe.sold),
    },
    badges: asStringArray(raw.badges),
    following: asStringArray(raw.following),
    followers: asStringArray(raw.followers),
    authToken: asString(firstDefined(raw.authToken, raw.auth_token)) || undefined,
    isSummary: asBoolean(firstDefined(raw.isSummary, raw.is_summary)),
  };
};

export const normalizeClothingItem = (value: unknown): ClothingItem => {
  const raw = asRecord(value);
  const images = asStringArray(raw.images);
  const image = asString(firstDefined(raw.image, raw.main_image, images[0]), DEFAULT_ITEM_IMAGE);

  return {
    id: asString(raw.id),
    brand: asString(raw.brand),
    name: asString(firstDefined(raw.name, raw.title), 'Без названия'),
    image,
    images,
    releaseDate: asString(firstDefined(raw.releaseDate, raw.release_date)),
    averageRating: asNumber(firstDefined(raw.averageRating, raw.average_rating)),
    ratingCount: asNumber(firstDefined(raw.ratingCount, raw.rating_count)),
    type: asItemType(raw.type),
    category: asCategory(raw.category),
    price: asNumber(raw.price),
    tags: asStringArray(raw.tags),
    sizes: asStringArray(raw.sizes),
    colors: asStringArray(raw.colors),
  };
};

const normalizeRatingBreakdown = (value: unknown): RatingBreakdown | undefined => {
  const raw = asRecord(value);
  if (Object.keys(raw).length === 0) return undefined;

  return {
    concept: asNumber(firstDefined(raw.concept, raw.idea)),
    execution: asNumber(firstDefined(raw.execution, raw.quality)),
    dna: asNumber(firstDefined(raw.dna, raw.individuality)),
    relevance: asNumber(firstDefined(raw.relevance, raw.actuality)),
    vibe: asNumber(firstDefined(raw.vibe, raw.impression)),
  };
};

const normalizeComment = (value: unknown): Comment => {
  const raw = asRecord(value);
  return {
    id: asString(raw.id),
    userId: asString(firstDefined(raw.userId, raw.user_id)),
    text: asString(firstDefined(raw.text, raw.body, raw.content)),
    date: asString(firstDefined(raw.date, raw.createdAt, raw.created_at)),
    user: raw.user ? normalizeUser(raw.user) : undefined,
  };
};

export const normalizeReview = (value: unknown): Review => {
  const raw = asRecord(value);
  const date = asString(firstDefined(raw.date, raw.createdAt, raw.created_at));

  return {
    id: asString(raw.id),
    userId: asString(firstDefined(raw.userId, raw.user_id)),
    clothingId: asString(firstDefined(raw.clothingId, raw.clothingItemId, raw.clothing_item_id)),
    rating: asNumber(firstDefined(raw.rating, raw.final_rating, raw.score)),
    ratingBreakdown: normalizeRatingBreakdown(firstDefined(raw.ratingBreakdown, raw.rating_breakdown)),
    text: asString(firstDefined(raw.text, raw.body, raw.content)),
    likes: asNumber(firstDefined(raw.likes, raw.likes_count)),
    likedByMe: asBoolean(firstDefined(raw.likedByMe, raw.liked_by_me, raw.isLiked)),
    date,
    createdAt: date,
    reportsCount: asNumber(firstDefined(raw.reportsCount, raw.reports_count)),
    user: raw.user ? normalizeUser(raw.user) : undefined,
    clothing: raw.clothing
      ? normalizeClothingItem(raw.clothing)
      : raw.clothingItem
        ? normalizeClothingItem(raw.clothingItem)
        : raw.clothing_item
          ? normalizeClothingItem(raw.clothing_item)
        : undefined,
    comments: asArray(raw.comments).map(normalizeComment),
  };
};

export const normalizeDrop = (value: unknown): UpcomingDrop => {
  const raw = asRecord(value);
  return {
    id: asString(raw.id),
    brand: asString(raw.brand),
    name: asString(firstDefined(raw.name, raw.title), 'Без названия'),
    image: asString(firstDefined(raw.image, raw.main_image), DEFAULT_ITEM_IMAGE),
    releaseDate: asString(firstDefined(raw.releaseDate, raw.release_date)),
    price: asNumber(raw.price),
    copCount: asNumber(firstDefined(raw.copCount, raw.cop_count)),
    dropCount: asNumber(firstDefined(raw.dropCount, raw.drop_count)),
    coppedBy: asStringArray(firstDefined(raw.coppedBy, raw.copped_by)),
  };
};

export const normalizeArticle = (value: unknown): Article => {
  const raw = asRecord(value);
  return {
    id: asString(raw.id),
    title: asString(raw.title, 'Без названия'),
    topic: asString(raw.topic) || null,
    body: asString(raw.body) || null,
    image: asString(raw.image) || null,
    publishedAt: asString(firstDefined(raw.publishedAt, raw.published_at)) || null,
    createdAt: asString(firstDefined(raw.createdAt, raw.created_at)) || undefined,
    updatedAt: asString(firstDefined(raw.updatedAt, raw.updated_at)) || undefined,
  };
};

export const normalizeBootstrap = (value: unknown): BootstrapPayload => {
  const raw = asRecord(value);
  return {
    items: asArray(firstDefined(raw.items, raw.clothingItems, raw.clothing_items)).map(normalizeClothingItem),
    reviews: asArray(raw.reviews).map(normalizeReview),
    users: asArray(raw.users).map(normalizeUser),
    drops: asArray(raw.drops).map(normalizeDrop),
    articles: asArray(raw.articles).map(normalizeArticle),
  };
};

export const normalizeProfile = (value: unknown): ProfilePayload => {
  const raw = asRecord(value);
  return {
    user: normalizeUser(raw.user),
    reviews: asArray(raw.reviews).map(normalizeReview),
  };
};

export const normalizeArray = <T>(value: unknown, normalizer: (entry: unknown) => T): T[] =>
  asArray(value).map(normalizer);
