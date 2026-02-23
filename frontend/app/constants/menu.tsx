import { IconTelescope, IconPeople, IconInvite } from "../components/icons";

export const MENU = [
  { id: "observatorio", label: "Observatorio", icon: <IconTelescope /> },
  { id: "personas", label: "Personas", icon: <IconPeople /> },
  { id: "invitaciones", label: "Invitaciones", icon: <IconInvite /> },
] as const;

