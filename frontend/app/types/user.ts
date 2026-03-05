export type User = {
  name: string;
  email: string;
  subscription: "Free" | "Pro" | "Enterprise";
  isProfileComplete?: boolean;
  profileCategory?: string | null;
};
