/** أنواع كيانات قاعدة البيانات — مطابقة لمخطط SQL */

export type CafeTheme = {
  bg: string;
  surface: string;
  fg: string;
  primary: string;
  accent: string;
  style: string;
  logo_url: string | null;
  background_url: string | null;
  app_icon_url: string | null;
};

export type LoyaltySettings = {
  cups_for_free: number;
  count_by: "cup" | "invoice";
  daily_cup_limit: number | null;
  free_cup_needs_staff: boolean;
  reward_valid_days: number;
};

export type Cafe = {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  theme: CafeTheme;
  loyalty_settings: LoyaltySettings;
  created_at: string;
};

export type Customer = {
  id: string;
  cafe_id: string;
  phone: string;
  name: string | null;
  cups_balance: number;
  verified: boolean;
  created_at: string;
};

export type Visit = {
  id: string;
  cafe_id: string;
  customer_id: string;
  cups: number;
  branch: string | null;
  note: string | null;
  staff_id: string | null;
  created_at: string;
};

export type Reward = {
  id: string;
  cafe_id: string;
  customer_id: string;
  prize: string;
  source: "roulette" | "free_cup";
  status: "pending" | "used" | "expired";
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

export type RouletteSlot = {
  id: string;
  cafe_id: string;
  prize_name: string;
  probability: number;
  color: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};
