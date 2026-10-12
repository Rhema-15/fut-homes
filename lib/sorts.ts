export const SORTS = {
  near: "Closest to campus",
  price: "Lowest price",
  new: "Newest",
} as const;
export type Sort = keyof typeof SORTS;
