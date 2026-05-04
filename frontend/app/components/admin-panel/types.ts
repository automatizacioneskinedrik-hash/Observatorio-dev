export type StatusTone = "idle" | "progress" | "success" | "error";

export type PanelTabId = "uploads" | "admins" | "limits";

export type AdminResultFilter = "all" | "gmail" | "matched";

export type InteractionScope = "usuario" | "plan" | "perfil" | "global";

export type AdminRecord = {
  email: string;
  createdAt: number;
};

export type AdminCandidate = {
  email: string;
  name: string;
  source: string;
  isGmail: boolean;
  lastSeen: number;
  profileConfirmed: boolean;
  profileCategory: string;
  tipoPerfil: string;
  provider: string;
};

export type AdminUserRow = {
  email?: string;
  name?: string;
  source?: string;
  isGmail?: boolean;
  profileConfirmed?: boolean;
  profileCategory?: string;
  tipoPerfil?: string;
  provider?: string;
};

export type InteractionRule = {
  scope: InteractionScope;
  target: string;
  maxMessagesPerDay: number;
  cooldownMinutes: number;
  temporaryBlockHours: number;
  autoReply: string;
  createdAt: number;
};
