import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ApiError,
  PlayerStats,
  ProtocolStreak,
  ProtocolEntry,
  BodyMeasurements,
  WeightEntry,
  PhotoEntry,
  Workout,
  CodeEntry,
  JobApplication,
  JobStats,
  TechSkill,
  TechModule,
  CurriculumStats,
  GermanEntry,
  FinanceProfile,
  ChatMessage,
  Challenge,
  FangYuanDaily,
  FangYuanPrinciple,
  WeeklyPlan,
  WeeklyReview,
} from "@/types";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://127.0.0.1:3000";
// Always use mock mode for Vercel preview (no backend needed)
const isMockMode = true;

// Mock data for preview mode
const MOCK_STATS: PlayerStats = {
  level: 12,
  xp: 2840,
  xp_to_next: 3000,
  total_xp_earned: 15240,
  streak_days: 14,
};

const MOCK_STREAK: ProtocolStreak = {
  current_streak: 14,
  longest_streak: 21,
  last_completed_date: new Date().toISOString().split('T')[0],
};

const MOCK_PROTOCOL = {
  id: null,
  date: new Date().toISOString().split('T')[0],
  score: 85,
  notes: "",
  wake05: true,
  german_study: false,
  gym_workout: true,
  sleep22: false,
  coding_hours: 3,
};
const DEFAULT_FINANCE_PROFILE: FinanceProfile = {
  monthly_income: 2000,
  monthly_fixed_costs: 1447,
  food_budget: 320,
  discretionary_budget: 0,
  savings_goal: 6000,
  savings_goal_target_date: "2027-08-31",
  current_savings: 1400,
  monthly_savings_target: 233,
  fixed_costs_breakdown: {
    rent: 620,
    phone_internet: 70,
    gym: 32,
    laptop_insurance: 5,
    ai_subscription: 20,
    kosovo_apartment: 700,
  },
  caps_balance: 0,
};

type ApiEnvelope<T> = {
  status?: string;
  data?: T;
  error?: string | { code?: string; message?: string };
  meta?: unknown;
};

type RawUser = Partial<User>;
type RawPlayerStats = Partial<PlayerStats>;
type RawProtocol = {
  id?: string | null;
  date?: string;
  score?: number;
  notes?: string;
  wake05?: boolean;
  german_study?: boolean;
  gym_workout?: boolean;
  sleep22?: boolean;
  coding_hours?: number;
};

type RawJob = {
  id?: string;
  company_name?: string;
  job_title?: string;
  status?: string;
  applied_at?: string | null;
  location?: string | null;
  salary_range?: string | null;
  url?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RawWorkout = {
  id?: string;
  user_id?: string;
  name?: string;
  duration_minutes?: number;
  exercises?: unknown[];
  notes?: string | null;
  created_at?: string;
};

type RawGermanProgress = {
  id?: string | null;
  date?: string;
  anki_cards?: number;
  anki_time?: number;
  anki_streak?: number;
  radio_hours?: number;
  tandem_minutes?: number;
  total_words?: number;
  language_transfer?: boolean;
  language_transfer_lesson?: number;
  notes?: string;
};

type RawCodeProgress = {
  id?: string | null;
  date?: string;
  hours?: number;
  github_commits?: number;
  project?: string;
  notes?: string;
};

type RequestConfig = {
  useGatewayRoot?: boolean;
};

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeUser(user: RawUser | undefined): User {
  return {
    id: toStringValue(user?.id),
    email: toStringValue(user?.email),
    username: toStringValue(user?.username),
    level: toNumber(user?.level, 1),
    xp: toNumber(user?.xp, 0),
    created_at: toStringValue(user?.created_at, new Date(0).toISOString()),
  };
}

function normalizePlayerStats(stats: RawPlayerStats | undefined): PlayerStats {
  const xp = toNumber(stats?.xp, 0);
  return {
    level: toNumber(stats?.level, 1),
    xp,
    xp_to_next: toNumber(stats?.xp_to_next, 100),
    total_xp_earned: toNumber(stats?.total_xp_earned, xp),
    title: toStringValue(stats?.title, "Initiate"),
    streak_days: toNumber(stats?.streak_days, 0),
    streak_started_at: stats?.streak_started_at ?? null,
    last_active: toStringValue(stats?.last_active),
    created_at: toStringValue(stats?.created_at),
    updated_at: toStringValue(stats?.updated_at),
    pillars: stats?.pillars ?? {},
    skills: stats?.skills ?? {},
  };
}

function normalizeProtocol(protocol: RawProtocol | undefined, date?: string): ProtocolEntry {
  const wake05 = Boolean(protocol?.wake05);
  const germanStudy = Boolean(protocol?.german_study);
  const gymWorkout = Boolean(protocol?.gym_workout);
  const sleep22 = Boolean(protocol?.sleep22);
  const codingHours = toNumber(protocol?.coding_hours, 0);

  return {
    id: protocol?.id ?? null,
    date: toStringValue(protocol?.date, date || new Date().toISOString().slice(0, 10)),
    score: toNumber(protocol?.score, 0),
    notes: toStringValue(protocol?.notes),
    wake05,
    german_study: germanStudy,
    gym_workout: gymWorkout,
    sleep22,
    coding_hours: codingHours,
    wake_time: wake05 ? "05:00" : "",
    sleep_time: sleep22 ? "22:00" : "",
    cold_shower: false,
    workout: gymWorkout,
    protein_intake: false,
    no_sugar: false,
    read_pages: 0,
    meditation_minutes: 0,
    completed: toNumber(protocol?.score, 0) >= 80,
  };
}

function normalizeMeasurement(measurements: Record<string, unknown> | undefined): BodyMeasurements {
  return {
    weight: toNumber(measurements?.weight),
    height: toNumber(measurements?.height),
    body_fat: toNumber(measurements?.body_fat),
    biceps: toNumber(measurements?.biceps),
    chest: toNumber(measurements?.chest),
    waist: toNumber(measurements?.waist),
    hips: toNumber(measurements?.hips),
    thighs: toNumber(measurements?.thighs),
    calves: toNumber(measurements?.calves),
    shoulders: toNumber(measurements?.shoulders),
    date: toStringValue(measurements?.date),
    created_at: toStringValue(measurements?.date),
  };
}

function normalizeWeightEntry(entry: Record<string, unknown>): WeightEntry {
  return {
    id: toStringValue(entry.id),
    weight: toNumber(entry.weight ?? entry.weight_kg),
    date: toStringValue(entry.date ?? entry.entry_date),
    notes: entry.notes ? String(entry.notes) : undefined,
    created_at: entry.created_at ? String(entry.created_at) : undefined,
    body_fat_percentage:
      typeof entry.body_fat_percentage === "number" ? entry.body_fat_percentage : undefined,
  };
}

function normalizeWorkout(workout: RawWorkout): Workout {
  const createdAt = toStringValue(workout.created_at, new Date().toISOString());
  const name = toStringValue(workout.name, "Workout");
  return {
    id: toStringValue(workout.id),
    user_id: toStringValue(workout.user_id),
    name,
    type: name,
    date: createdAt.slice(0, 10),
    duration_minutes: toNumber(workout.duration_minutes, 0),
    exercises: Array.isArray(workout.exercises) ? (workout.exercises as Workout["exercises"]) : [],
    notes: workout.notes ?? undefined,
    created_at: createdAt,
  };
}

function normalizeCodeEntry(progress: RawCodeProgress | null | undefined, date?: string): CodeEntry | null {
  if (!progress) {
    return null;
  }

  return {
    id: progress.id ?? null,
    date: toStringValue(progress.date, date || new Date().toISOString().slice(0, 10)),
    hours: toNumber(progress.hours, 0),
    project: toStringValue(progress.project),
    commits: toNumber(progress.github_commits, 0),
    github_commits: toNumber(progress.github_commits, 0),
    notes: toStringValue(progress.notes),
  };
}

function normalizeGermanProgress(progress: RawGermanProgress | null | undefined, date?: string): GermanEntry | null {
  if (!progress) {
    return null;
  }

  const ankiTime = toNumber(progress.anki_time, 0);
  const radioHours = toNumber(progress.radio_hours, 0);
  const tandemMinutes = toNumber(progress.tandem_minutes, 0);

  return {
    id: progress.id ?? null,
    date: toStringValue(progress.date, date || new Date().toISOString().slice(0, 10)),
    minutes: ankiTime + Math.round(radioHours * 60) + tandemMinutes,
    activity: "German Session",
    anki_cards: toNumber(progress.anki_cards, 0),
    anki_time: ankiTime,
    anki_streak: toNumber(progress.anki_streak, 0),
    radio_hours: radioHours,
    tandem_minutes: tandemMinutes,
    total_words: toNumber(progress.total_words, 0),
    language_transfer: Boolean(progress.language_transfer),
    language_transfer_lesson: toNumber(progress.language_transfer_lesson, 0),
    notes: toStringValue(progress.notes),
  };
}

function normalizeJob(job: RawJob): JobApplication {
  return {
    id: toStringValue(job.id),
    company: toStringValue(job.company_name),
    position: toStringValue(job.job_title),
    status: (job.status as JobApplication["status"]) || "applied",
    applied_date: toStringValue(job.applied_at, new Date().toISOString()),
    location: job.location ?? undefined,
    salary_range: job.salary_range ?? undefined,
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    created_at: job.created_at ?? undefined,
    updated_at: job.updated_at ?? undefined,
  };
}

function normalizeJobStats(data: Record<string, unknown> | undefined): JobStats {
  const pipeline = (data?.pipeline as Record<string, number> | undefined) || {};
  const totals = (data?.totals as Record<string, number> | undefined) || {};
  const pace = (data?.pace as Record<string, number> | undefined) || {};
  const totalApplied = toNumber(totals.total_applied, 0);
  const totalInterviews = toNumber(totals.total_interviews, 0);

  return {
    total_applied: totalApplied,
    by_status: {
      saved: toNumber(pipeline.saved, 0),
      applied: toNumber(pipeline.applied, 0),
      screening: toNumber(pipeline.screening, 0),
      interview: toNumber(pipeline.interview, 0),
      offer: toNumber(pipeline.offer, 0),
      rejected: toNumber(pipeline.rejected, 0),
      withdrawn: toNumber(pipeline.withdrawn, 0),
    },
    response_rate: totalApplied > 0 ? Number(((totalInterviews / totalApplied) * 100).toFixed(2)) : 0,
    interview_rate: totalApplied > 0 ? Number(((totalInterviews / totalApplied) * 100).toFixed(2)) : 0,
    total_interviews: totalInterviews,
    target_applications: toNumber(totals.target_applications, 60),
    target_interviews: toNumber(totals.target_interviews, 8),
    days_remaining: toNumber(pace.days_remaining, 0),
    weekly_applications_needed: toNumber(pace.weekly_applications_needed, 0),
    applications_remaining: toNumber(pace.applications_remaining, 0),
    interviews_remaining: toNumber(pace.interviews_remaining, 0),
  };
}

function normalizeFinanceProfile(profile: Record<string, unknown> | undefined): FinanceProfile {
  const fixedCostsBreakdown =
    profile?.fixed_costs_breakdown && typeof profile.fixed_costs_breakdown === "object"
      ? (profile.fixed_costs_breakdown as Record<string, number>)
      : DEFAULT_FINANCE_PROFILE.fixed_costs_breakdown;

  return {
    monthly_income: toNumber(profile?.monthly_income, DEFAULT_FINANCE_PROFILE.monthly_income),
    monthly_fixed_costs: toNumber(
      profile?.monthly_fixed_costs,
      DEFAULT_FINANCE_PROFILE.monthly_fixed_costs || 0
    ),
    food_budget: toNumber(profile?.food_budget, DEFAULT_FINANCE_PROFILE.food_budget || 0),
    discretionary_budget: toNumber(
      profile?.discretionary_budget,
      DEFAULT_FINANCE_PROFILE.discretionary_budget || 0
    ),
    savings_goal: toNumber(
      profile?.savings_goal_amount ?? profile?.savings_goal,
      DEFAULT_FINANCE_PROFILE.savings_goal
    ),
    savings_goal_target_date: toStringValue(
      profile?.savings_goal_target_date,
      DEFAULT_FINANCE_PROFILE.savings_goal_target_date || ""
    ),
    current_savings: toNumber(
      profile?.current_savings,
      DEFAULT_FINANCE_PROFILE.current_savings
    ),
    monthly_savings_target: toNumber(
      profile?.monthly_savings_target,
      DEFAULT_FINANCE_PROFILE.monthly_savings_target || 0
    ),
    fixed_costs_breakdown: fixedCostsBreakdown,
    caps_balance: toNumber(profile?.caps_balance, 0),
    updated_at: profile?.updated_at ? String(profile.updated_at) : undefined,
  };
}

function normalizePrinciple(principle: Record<string, unknown>): FangYuanPrinciple {
  return {
    number: toNumber(principle.number, 0),
    title: toStringValue(principle.title),
    description: toStringValue(principle.description ?? principle.explanation),
    application: toStringValue(principle.application),
    xpRequired: toNumber(principle.xpRequired, 0),
    unlocked: Boolean(principle.unlocked),
    quizScore: toNumber(principle.quizScore, 0),
    quizPassed: Boolean(principle.quizPassed),
  };
}

function normalizeChallenge(challenge: Record<string, unknown>): Challenge {
  return {
    id: toStringValue(challenge.id),
    key: toStringValue(challenge.key),
    title: toStringValue(challenge.title),
    description: toStringValue(challenge.description),
    difficulty: toStringValue(challenge.difficulty),
    xp_reward: toNumber(challenge.xpReward ?? challenge.xp_reward, 0),
    xpReward: toNumber(challenge.xpReward ?? challenge.xp_reward, 0),
    duration_days: toNumber(challenge.durationDays ?? challenge.duration_days, 0),
    durationDays: toNumber(challenge.durationDays ?? challenge.duration_days, 0),
    joined: toStringValue(challenge.status) !== "",
    status: toStringValue(challenge.status),
    progress: toNumber(challenge.progress, 0),
    streak: toNumber(challenge.streak, 0),
    daysCompleted: toNumber(challenge.daysCompleted, 0),
    startedAt: challenge.startedAt ? String(challenge.startedAt) : null,
    completedAt: challenge.completedAt ? String(challenge.completedAt) : null,
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = `${GATEWAY_URL}/api`;
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  clearAccessToken() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  private getUrl(endpoint: string, config?: RequestConfig): string {
    const prefix = config?.useGatewayRoot ? GATEWAY_URL : this.baseUrl;
    return `${prefix}${endpoint}`;
  }

  private async request<T>(
    endpoint: string,
    options: Parameters<typeof fetch>[1] = {},
    config?: RequestConfig
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(this.getUrl(endpoint, config), {
      ...options,
      headers,
    });

    let payload: ApiEnvelope<T> | T | null = null;
    if (response.status !== 204) {
      payload = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const envelope = payload as ApiEnvelope<T> | null;
      const error = envelope?.error;
      const message =
        typeof error === "string"
          ? error
          : error?.message || (payload as ApiError | null)?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ApiEnvelope<T>).data as T;
    }

    return (payload ?? {}) as T;
  }

  // ============================================================================
  // Auth
  // ============================================================================

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setAccessToken(response.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", response.refresh_token);
    }
    return {
      ...response,
      user: normalizeUser(response.user),
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setAccessToken(response.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", response.refresh_token);
    }
    return {
      ...response,
      user: normalizeUser(response.user),
    };
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    this.setAccessToken(response.access_token);
    return response;
  }

  async getMe(): Promise<{ user: User }> {
    const response = await this.request<{ user: RawUser }>("/auth/me");
    return { user: normalizeUser(response.user) };
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.clearAccessToken();
    }
  }

  // ============================================================================
  // Health
  // ============================================================================

  async health(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>("/health", {}, { useGatewayRoot: true });
  }

  // ============================================================================
  // Player/Stats
  // ============================================================================

  async getPlayerStats(): Promise<PlayerStats> {
    if (isMockMode) return MOCK_STATS;
    const response = await this.request<{ stats: RawPlayerStats }>("/player/stats");
    return normalizePlayerStats(response.stats);
  }

  async updatePlayerStats(data: Partial<PlayerStats>): Promise<PlayerStats> {
    const response = await this.request<{ stats: RawPlayerStats }>("/player/stats", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return normalizePlayerStats(response.stats);
  }

  async addXP(amount: number, pillar?: string, skillId?: string): Promise<void> {
    await this.request<void>("/player/add-xp", {
      method: "POST",
      body: JSON.stringify({ amount, pillar, skill_id: skillId }),
    });
  }

  async trackActivity(activity: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.request<void>("/player/activity", {
      method: "POST",
      body: JSON.stringify({ activity_type: activity, metadata }),
    });
  }

  // ============================================================================
  // Protocol
  // ============================================================================

  async getProtocolStreak(): Promise<ProtocolStreak> {
    if (isMockMode) return MOCK_STREAK;
    const response = await this.request<{
      current?: number;
      longest?: number;
      last_completed?: string | null;
    }>("/protocol/streak");

    return {
      current_streak: toNumber(response.current, 0),
      longest_streak: toNumber(response.longest, 0),
      last_completed_date: (response.last_completed as string | null | undefined) ?? null,
    };
  }

  async getProtocol(date: string): Promise<ProtocolEntry> {
    if (isMockMode) return normalizeProtocol(MOCK_PROTOCOL, date);
    const response = await this.request<{ protocol: RawProtocol }>(`/protocol/${date}`);
    return normalizeProtocol(response.protocol, date);
  }

  async createProtocol(data: Partial<ProtocolEntry>): Promise<ProtocolEntry> {
    const date = data.date || new Date().toISOString().slice(0, 10);
    await this.request<void>("/protocol", {
      method: "POST",
      body: JSON.stringify({
        date,
        wake05: Boolean(data.wake05),
        germanStudy: Boolean(data.german_study),
        gymWorkout: Boolean(data.gym_workout),
        sleep22: Boolean(data.sleep22),
        codingHours: toNumber(data.coding_hours, 0),
        notes: data.notes,
      }),
    });
    return this.getProtocol(date);
  }

  async getRetention(): Promise<{ status: string; risk_level: string; suggestions: unknown[] }> {
    return this.request<{ status: string; risk_level: string; suggestions: unknown[] }>(
      "/retention/status"
    );
  }

  // ============================================================================
  // Body/Measurements
  // ============================================================================

  async getBodyLatest(): Promise<BodyMeasurements> {
    const response = await this.request<{ measurements: Record<string, unknown> }>("/body/latest");
    return normalizeMeasurement(response.measurements);
  }

  async getWeightHistory(): Promise<WeightEntry[]> {
    const response = await this.request<{ entries: Record<string, unknown>[] }>("/weight");
    return Array.isArray(response.entries) ? response.entries.map(normalizeWeightEntry) : [];
  }

  async addWeightEntry(data: { weight: number; date?: string; notes?: string }): Promise<WeightEntry> {
    const response = await this.request<Record<string, unknown>>("/weight", {
      method: "POST",
      body: JSON.stringify({
        weight_kg: data.weight,
        entry_date: data.date || new Date().toISOString().slice(0, 10),
        notes: data.notes,
      }),
    });
    return normalizeWeightEntry(response);
  }

  async getWeightChart(): Promise<{ dates: string[]; weights: number[] }> {
    const response = await this.request<{ chart_data: Array<{ date?: string; weight?: number }> }>(
      "/weight/chart"
    );
    const chartData = Array.isArray(response.chart_data) ? response.chart_data : [];
    return {
      dates: chartData.map((point) => toStringValue(point.date)),
      weights: chartData.map((point) => toNumber(point.weight, 0)),
    };
  }

  async getPhotos(): Promise<PhotoEntry[]> {
    const response = await this.request<{ photos: PhotoEntry[] }>("/photos");
    return Array.isArray(response.photos) ? response.photos : [];
  }

  async uploadPhoto(file: File, photoType: string): Promise<PhotoEntry> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("photo_type", photoType);

    const response = await fetch(this.getUrl("/photos"), {
      method: "POST",
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<{ photo?: PhotoEntry }> | null;
    if (!response.ok) {
      throw new Error(payload?.error && typeof payload.error !== "string" ? payload.error.message || "Failed to upload photo" : "Failed to upload photo");
    }

    return payload?.data?.photo || ({ id: "", photo_type: photoType as PhotoEntry["photo_type"] } as PhotoEntry);
  }

  // ============================================================================
  // Workouts
  // ============================================================================

  async getWorkouts(): Promise<Workout[]> {
    const response = await this.request<{ workouts: RawWorkout[] }>("/workouts");
    return Array.isArray(response.workouts) ? response.workouts.map(normalizeWorkout) : [];
  }

  async createWorkout(data: Partial<Workout>): Promise<Workout> {
    await this.request<void>("/workouts", {
      method: "POST",
      body: JSON.stringify({
        name: data.name || data.type || "Workout",
        durationMinutes: toNumber(data.duration_minutes, 0),
        exercises: data.exercises || [],
        notes: data.notes,
      }),
    });

    const workouts = await this.getWorkouts();
    return workouts[0];
  }

  // ============================================================================
  // Code
  // ============================================================================

  async getCodeLatest(): Promise<CodeEntry | null> {
    const response = await this.request<{ progress: RawCodeProgress | null }>("/code/latest");
    return normalizeCodeEntry(response.progress);
  }

  async getCodeByDate(date: string): Promise<CodeEntry | null> {
    const response = await this.request<{ progress: RawCodeProgress | null }>(`/code/${date}`);
    return normalizeCodeEntry(response.progress, date);
  }

  async saveCode(data: Partial<CodeEntry>): Promise<CodeEntry | null> {
    const date = data.date || new Date().toISOString().slice(0, 10);
    await this.request<void>("/code", {
      method: "POST",
      body: JSON.stringify({
        date,
        hours: toNumber(data.hours, 0),
        commits: toNumber(data.commits ?? data.github_commits, 0),
        project: data.project || "",
        notes: data.notes,
      }),
    });
    return this.getCodeByDate(date);
  }

  async getCodeStats(): Promise<{ total_hours: number; streak_days: number }> {
    const [totals, streak] = await Promise.all([
      this.request<{ total_hours?: number }>("/code/stats/total"),
      this.request<{ streak_days?: number }>("/code/stats/streak"),
    ]);

    return {
      total_hours: toNumber(totals.total_hours, 0),
      streak_days: toNumber(streak.streak_days, 0),
    };
  }

  // ============================================================================
  // German
  // ============================================================================

  async getGermanLatest(): Promise<GermanEntry | null> {
    const response = await this.request<{ progress: RawGermanProgress | null }>("/german/latest");
    return normalizeGermanProgress(response.progress);
  }

  async getGermanByDate(date: string): Promise<GermanEntry | null> {
    const response = await this.request<{ progress: RawGermanProgress | null }>(`/german/${date}`);
    return normalizeGermanProgress(response.progress, date);
  }

  async saveGerman(data: Partial<GermanEntry>): Promise<GermanEntry | null> {
    const date = data.date || new Date().toISOString().slice(0, 10);
    const minutes = toNumber(data.minutes, 0);
    const activity = (data.activity || "").toLowerCase();

    const ankiCards = toNumber(data.anki_cards, 0);
    const ankiTime =
      typeof data.anki_time === "number"
        ? data.anki_time
        : activity.includes("anki")
          ? minutes
          : 0;
    const radioHours =
      typeof data.radio_hours === "number"
        ? data.radio_hours
        : activity.includes("podcast") || activity.includes("radio") || activity.includes("listen")
          ? minutes / 60
          : 0;
    const tandemMinutes =
      typeof data.tandem_minutes === "number"
        ? data.tandem_minutes
        : activity.includes("tandem")
          ? minutes
          : 0;

    await this.request<void>("/german", {
      method: "POST",
      body: JSON.stringify({
        date,
        ankiCards: ankiCards,
        ankiTime,
        radioHours,
        tandemMinutes,
        notes: data.notes,
      }),
    });
    return this.getGermanByDate(date);
  }

  // ============================================================================
  // Finance
  // ============================================================================

  async getFinance(): Promise<FinanceProfile> {
    const response = await this.request<{ profile: Record<string, unknown> }>("/finance/profile");
    return normalizeFinanceProfile(response.profile);
  }

  async updateFinanceProfile(data: Partial<FinanceProfile>): Promise<FinanceProfile> {
    const response = await this.request<{ profile: Record<string, unknown> }>("/finance/profile", {
      method: "PUT",
      body: JSON.stringify({
        monthly_income: data.monthly_income,
        monthly_fixed_costs: data.monthly_fixed_costs,
        food_budget: data.food_budget,
        discretionary_budget: data.discretionary_budget,
        savings_goal_amount: data.savings_goal,
        savings_goal_target_date: data.savings_goal_target_date,
        current_savings: data.current_savings,
        monthly_savings_target: data.monthly_savings_target,
        fixed_costs_breakdown: data.fixed_costs_breakdown,
      }),
    });
    return normalizeFinanceProfile(response.profile);
  }

  async getFinanceSummary(): Promise<{ monthly_income: number; expenses: number; savings: number }> {
    const response = await this.request<{ summary: { income?: number; expenses?: number; balance?: number } }>(
      "/finance/summary"
    );
    return {
      monthly_income: toNumber(response.summary?.income, 0),
      expenses: toNumber(response.summary?.expenses, 0),
      savings: toNumber(response.summary?.balance, 0),
    };
  }

  async getCaps(): Promise<{ balance: number; transactions: unknown[] }> {
    const response = await this.request<{ caps?: unknown[] }>("/finance/caps");
    const transactions = Array.isArray(response.caps) ? response.caps : [];
    return {
      balance: transactions.reduce<number>((sum, item) => {
        if (item && typeof item === "object" && "amount" in item) {
          return sum + toNumber((item as { amount?: unknown }).amount, 0);
        }
        return sum;
      }, 0),
      transactions,
    };
  }

  async createFinanceEntry(data: {
    amount: number;
    category: string;
    entry_type?: string;
    description?: string;
    date: string;
  }): Promise<{ id: string; amount: number; category: string }> {
    const response = await this.request<{ id: string; amount: number; category: string }>("/finance", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  }

  // ============================================================================
  // Curriculum/Tech Stack
  // ============================================================================

  async getCurriculumStats(): Promise<CurriculumStats> {
    return this.request<CurriculumStats>("/curriculum/stats");
  }

  async getCurriculumSkills(): Promise<TechSkill[]> {
    const response = await this.request<{ skills: TechSkill[] }>("/curriculum/skills");
    return Array.isArray(response.skills) ? response.skills : [];
  }

  async getCurriculumSkillDetail(key: string): Promise<{ skill: TechSkill; modules: TechModule[] }> {
    return this.request<{ skill: TechSkill; modules: TechModule[] }>(`/curriculum/skills/${key}`);
  }

  async updateModuleProgress(
    moduleId: string,
    data: { status: string; hours_spent?: number; notes?: string }
  ): Promise<void> {
    await this.request<void>(`/curriculum/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // Jobs
  // ============================================================================

  async getJobs(): Promise<JobApplication[]> {
    const response = await this.request<{ jobs: RawJob[] }>("/jobs");
    return Array.isArray(response.jobs) ? response.jobs.map(normalizeJob) : [];
  }

  async getJob(id: string): Promise<JobApplication> {
    const response = await this.request<{ job: RawJob }>(`/jobs/${id}`);
    return normalizeJob(response.job);
  }

  async createJob(data: Partial<JobApplication>): Promise<JobApplication> {
    const response = await this.request<{ id: string }>("/jobs", {
      method: "POST",
      body: JSON.stringify({
        company_name: data.company || "",
        job_title: data.position || "",
        status: data.status || "applied",
        applied_at: data.applied_date || new Date().toISOString().slice(0, 10),
        location: data.location,
        salary_range: data.salary_range,
        url: data.url,
        notes: data.notes,
      }),
    });

    return {
      id: response.id,
      company: data.company || "",
      position: data.position || "",
      status: (data.status as JobApplication["status"]) || "applied",
      applied_date: data.applied_date || new Date().toISOString().slice(0, 10),
      location: data.location,
      salary_range: data.salary_range,
      url: data.url,
      notes: data.notes,
    };
  }

  async getJobStats(): Promise<JobStats> {
    const response = await this.request<Record<string, unknown>>("/jobs/stats");
    return normalizeJobStats(response);
  }

  async updateJob(id: string, data: Partial<JobApplication>): Promise<JobApplication> {
    const current = await this.getJob(id);
    await this.request<void>(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        company_name: data.company ?? current.company,
        job_title: data.position ?? current.position,
        status: data.status ?? current.status,
        applied_at: data.applied_date ?? current.applied_date,
        location: data.location ?? current.location,
        salary_range: data.salary_range ?? current.salary_range,
        url: data.url ?? current.url,
        notes: data.notes ?? current.notes,
      }),
    });
    return this.getJob(id);
  }

  async deleteJob(id: string): Promise<void> {
    await this.request<void>(`/jobs/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Challenges
  // ============================================================================

  async getChallenges(): Promise<Challenge[]> {
    const response = await this.request<{ challenges: Record<string, unknown>[] }>("/challenges");
    return Array.isArray(response.challenges) ? response.challenges.map(normalizeChallenge) : [];
  }

  async joinChallenge(key: string): Promise<void> {
    await this.request<void>("/challenges/join", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  }

  async updateChallengeProgress(
    challengeId: string,
    day: number,
    completed: boolean,
    notes?: string
  ): Promise<void> {
    await this.request<void>("/challenges/progress", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challengeId,
        day,
        completed,
        notes,
      }),
    });
  }

  // ============================================================================
  // Fang Yuan
  // ============================================================================

  async getFangYuanPrinciples(): Promise<FangYuanPrinciple[]> {
    const response = await this.request<{ principles: Record<string, unknown>[] }>("/fang-yuan/principles");
    return Array.isArray(response.principles) ? response.principles.map(normalizePrinciple) : [];
  }

  async getFangYuanDaily(): Promise<FangYuanDaily | null> {
    const response = await this.request<{ teaching: Record<string, unknown> | null }>("/fang-yuan/daily");
    if (!response.teaching) {
      return null;
    }

    const teaching = response.teaching;
    return {
      quote: toStringValue(teaching.quote),
      principle: normalizePrinciple(teaching),
    };
  }

  // ============================================================================
  // Weekly
  // ============================================================================

  async getWeeklyPlan(): Promise<WeeklyPlan> {
    return this.request<WeeklyPlan>("/weekly/plan");
  }

  async getWeeklyReview(): Promise<WeeklyReview> {
    return this.request<WeeklyReview>("/weekly/review");
  }

  // ============================================================================
  // AI Coach
  // ============================================================================

  async chatWithAI(message: string, history?: ChatMessage[]): Promise<{ response: string }> {
    const response = await this.request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        prompt: message,
        history: (history || []).map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });
    return { response: toStringValue(response.reply) };
  }

  async upsertMemory(content: string, category: string, importance: number): Promise<void> {
    await this.request<void>("/ai/memory/upsert", {
      method: "POST",
      body: JSON.stringify({
        text: content,
        metadata: {
          category,
          importance,
        },
      }),
    });
  }

  async searchMemory(query: string): Promise<unknown[]> {
    const response = await this.request<{ hits: unknown[] }>("/ai/memory/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    return Array.isArray(response.hits) ? response.hits : [];
  }

  async transcribeVoice(audioBlob: Blob): Promise<{ text: string }> {
    const audioBase64 = await blobToBase64(audioBlob);
    const response = await this.request<{ text: string }>("/ai/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audio_base64: audioBase64 }),
    });
    return { text: toStringValue(response.text) };
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getTrends(): Promise<unknown> {
    const response = await this.request<{ trends: unknown }>("/analytics/trends");
    return response.trends;
  }

  async getOutcomes(): Promise<unknown> {
    const response = await this.request<{ outcomes: unknown[] }>("/outcomes");
    return response.outcomes;
  }
}

export const api = new ApiClient();
