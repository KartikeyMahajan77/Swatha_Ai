"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthRole, getRoleHome } from "@/lib/role-auth";
import { useSession } from "@/lib/contexts/session-context";

export const useRedirectAuthenticated = () => {
  const router = useRouter();
  const { loading, role } = useSession();

  useEffect(() => {
    if (!loading && role !== "guest") {
      router.replace(getRoleHome(role));
    }
  }, [loading, role, router]);
};

export const useRequireRole = (allowedRoles: AuthRole[]) => {
  const router = useRouter();
  const { loading, role } = useSession();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (role === "guest") {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(getRoleHome(role));
    }
  }, [allowedRoles, loading, role, router]);

  return { loading, role, isAllowed: !loading && allowedRoles.includes(role) };
};
