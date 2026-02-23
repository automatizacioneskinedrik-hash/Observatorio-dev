export type Role = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
};
