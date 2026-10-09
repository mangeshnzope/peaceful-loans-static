export interface Meta {
  built: string;
  data_from: string;
  data_to: string;
  tg_definition: string[];
  creator_chart_era_start: string;
  creator_onboarded: string;
  post_types?: string[];
  image_types?: string[];
  notes: string;
}

export interface DailyRow {
  date: string;
  tg_impressions: number | null;
  tg_share_pct: number | null;
  tg_may_be_higher: boolean;
  engagements: number;
  new_followers: number;
  posts_published: number;
}

export interface WeeklyRow {
  week_start: string;
  week_end: string;
  tg_impressions: number | null;
  tg_share_pct: number | null;
  tg_may_be_higher: boolean;
  engagements: number;
  new_followers: number;
  posts_published: number;
}

export interface MonthlyRow {
  month_start: string;
  month_end: string;
  tg_impressions: number | null;
  tg_share_pct: number | null;
  tg_may_be_higher: boolean;
  engagements: number;
  new_followers: number;
  posts_published: number;
}

export interface PostRow {
  post_id?: string;
  published: string;
  weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string;
  title: string;
  url: string;
  type: string;
  auto_type?: string;
  image_type?: string;
  auto_image_type?: string;
  format: "Media (ugcPost)" | "Text/share";
  creator_chart_era: boolean;
  tg_impressions_lifetime: number | null;
  tg_share_pct: number | null;
  out_of_network_pct: number | null;
  in_network_pct: number | null;
  engagements: number;
  comments: number;
  reposts: number;
  followers_gained: number;
  engagement_rate_pct: number | null;
}

export interface ViewerMix {
  day_weight: Record<string, number>;
  pct_of_views: Record<string, Record<string, Record<string, number>>>;
}

export interface GroupRow {
  g: string;
  n: number;
  tg: number;
  tgsum: number;
  sh: number;
  out: number | null;
  er: number | null;
  com: number;
}

export interface GroupPValues {
  tg: number;
  sh: number;
  outnet: number;
  er: number;
}

export interface GroupInsights {
  rows: GroupRow[];
  p: GroupPValues;
}

export interface Correlation {
  rho: number;
  p: number;
  n: number;
}

export interface LinearFit {
  slope10: number;
  r2: number;
  p: number;
  a: number;
  b: number;
}

export interface Insights {
  groups: {
    cat: GroupInsights;
    img?: GroupInsights;
    fmt: GroupInsights;
    era: GroupInsights;
    dow: GroupInsights;
  };
  corr: {
    out_vs_share: Correlation;
    out_vs_tg: Correlation;
    comments_vs_out: Correlation;
    reposts_vs_out: Correlation;
    er_vs_share: Correlation;
    hour_vs_share: Correlation;
  };
  fit: LinearFit;
}

export interface CompanyPage {
  note: string;
  visitors_monthly: { month_start: string; month_end: string; tg_page_views: number; tg_share_pct: number | null }[];
  visitors_12m: { start: string; end: string; tg_page_views: number; tg_share_pct: number };
  followers: { as_of: string; tg_followers: number; tg_share_pct: number };
}

export interface Newsletter {
  name: string;
  note: string;
  editions: {
    activity_id: string;
    post_id: string | null;
    published: string;
    title: string;
    url: string;
    tg_impressions_lifetime: number | null;
    tg_share_pct: number | null;
    tg_is_floor: boolean;
    out_of_network_pct: number | null;
    engagements: number;
    comments: number;
    reposts: number;
  }[];
  subscribers: { date: string; subscribers: number; tg_share_floor_pct: number }[];
}

export interface DashboardData {
  meta: Meta;
  daily: DailyRow[];
  weekly: WeeklyRow[];
  monthly: MonthlyRow[];
  posts: PostRow[];
  viewer_mix: ViewerMix;
  insights: Insights;
  company_page?: CompanyPage;
  newsletter?: Newsletter;
}
