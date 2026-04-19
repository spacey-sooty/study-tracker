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

export type AppStateV1 = {
  v: 1;
  categories: Record<CategoryId, Category>;
  activeQuest: ActiveQuest | null;
};

