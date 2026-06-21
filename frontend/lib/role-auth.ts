export type AuthRole = "guest" | "user" | "therapist" | "admin";

export const AUTH_ROLE_CHANGE_EVENT = "swastha-auth-role-change";

export const getStoredAuthRole = (): AuthRole => {
  if (typeof window === "undefined") {
    return "guest";
  }

  if (localStorage.getItem("adminToken")) {
    return "admin";
  }

  if (localStorage.getItem("therapistToken")) {
    return "therapist";
  }

  if (localStorage.getItem("token")) {
    return "user";
  }

  return "guest";
};

export const getRoleHome = (role: AuthRole) => {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "therapist") {
    return "/therapist/dashboard";
  }

  if (role === "user") {
    return "/dashboard";
  }

  return "/";
};

export const notifyAuthRoleChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_ROLE_CHANGE_EVENT));
  }
};

export const clearOtherRoleTokens = (role: Exclude<AuthRole, "guest">) => {
  if (role !== "user") {
    localStorage.removeItem("token");
  }

  if (role !== "therapist") {
    localStorage.removeItem("therapistToken");
  }

  if (role !== "admin") {
    localStorage.removeItem("adminToken");
  }
};

export const roleNavigation = {
  guest: [
    { href: "/login", label: "User Login" },
    { href: "/signup", label: "User Register" },
    { href: "/therapist/login", label: "Therapist Login" },
    { href: "/therapist/register", label: "Therapist Register" },
    { href: "/admin/login", label: "Admin Login" },
  ],
  user: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard", label: "AI Therapist" },
    { href: "/therapists", label: "Certified Therapists" },
    { href: "/appointments", label: "Appointments" },
    { href: "/dashboard", label: "Profile" },
  ],
  therapist: [
    { href: "/therapist/dashboard", label: "Therapist Dashboard" },
    { href: "/therapist/appointments", label: "Appointments" },
    { href: "/therapist/dashboard", label: "Profile" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Admin Dashboard" },
    { href: "/admin/verification", label: "Therapist Verification" },
    { href: "/admin/therapists", label: "Manage Therapists" },
  ],
} satisfies Record<AuthRole, { href: string; label: string }[]>;
