export const CATEGORIES = [
  'Coffee',
  'Tea',
  'Pastries',
  'Sandwiches',
  'Desserts',
  'Other',
] as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

export const UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pieces',
  'packs',
  'boxes',
] as const;
