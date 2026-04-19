export type CategoryId =
  | "body"
  | "mind"
  | "craft"
  | "social"
  | "spirit"
  | "wealth";

export type Category = {
  id: CategoryId;
  name: string;
  accent: string;
  totalSeconds: number;
};

export type ActiveQuest = {
  categoryId: CategoryId;
  startedAtMs: number;
};

export type DailyQuest =
  | {
      id: string;
      kind: "anySeconds";
      targetSeconds: number;
      completedAtMs?: number;
    }
  | {
      id: string;
      kind: "categorySeconds";
      categoryId: CategoryId;
      targetSeconds: number;
      completedAtMs?: number;
    }
  | {
      id: string;
      kind: "questsEnded";
      targetCount: number;
      completedAtMs?: number;
    };

export type DailyState = {
  date: string; // local YYYY-MM-DD
  stats: {
    secondsTotal: number;
    categorySeconds: Record<CategoryId, number>;
    questsEnded: number;
  };
  quests: DailyQuest[];
};

export type StreakState = {
  current: number;
  best: number;
  lastActiveDate: string | null; // local YYYY-MM-DD
};

export type DailyQuestTemplate =
  | {
      kind: "anySeconds";
      targetMinutes: number;
    }
  | {
      kind: "categorySeconds";
      categoryId: CategoryId;
      targetMinutes: number;
    }
  | {
      kind: "questsEnded";
      targetCount: number;
    };

export type AppSettings = {
  dailyQuestTemplates: DailyQuestTemplate[];
};

export type AppStateV1 = {
  v: 1;
  categories: Record<CategoryId, Category>;
  activeQuest: ActiveQuest | null;
};

export type AppStateV2 = {
  v: 2;
  categories: Record<CategoryId, Category>;
  activeQuest: ActiveQuest | null;
  daily: DailyState;
  streak: StreakState;
  stats: {
    questsEndedTotal: number;
  };
};

export type AppStateV3 = Omit<AppStateV2, "v"> & {
  v: 3;
  settings: AppSettings;
};
