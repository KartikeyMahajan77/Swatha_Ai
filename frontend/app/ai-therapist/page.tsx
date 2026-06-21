"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function AiTherapistRedirectPage() {
  const router = useRouter();
  const roleGuard = useRequireRole(["user"]);

  useEffect(() => {
    if (roleGuard.isAllowed) {
      router.replace("/dashboard");
    }
  }, [roleGuard.isAllowed, router]);

  return (
    <div className="flex min-h-screen items-center justify-center pt-16">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}
