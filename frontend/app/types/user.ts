export type User = {
  name: string;
  email: string;
  subscription: "Free" | "Pro" | "Enterprise";
  isProfileComplete?: boolean;
  profileCategory?: string | null;
  photoURL?: string | null;
  role?: "admin" | "user" | null;
};
