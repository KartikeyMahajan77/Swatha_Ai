"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/contexts/session-context";
import { getRoleHome } from "@/lib/role-auth";

export default function RegisterRedirectPage() {
  const router = useRouter();
  const { loading, role } = useSession();

  useEffect(() => {
    if (loading) {
      return;
    }

    router.replace(role === "guest" ? "/signup" : getRoleHome(role));
  }, [loading, role, router]);

  return null;
}
