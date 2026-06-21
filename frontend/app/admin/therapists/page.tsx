"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Therapist, getAdminTherapists } from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function ManageTherapistsPage() {
  const roleGuard = useRequireRole(["admin"]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    getAdminTherapists()
      .then((data) => setTherapists(data.therapists || []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load therapists"),
      )
      .finally(() => setLoading(false));
  }, [roleGuard.isAllowed]);

  if (!roleGuard.isAllowed || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <div className="mx-auto max-w-6xl space-y-5">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Users className="h-7 w-7 text-primary" />
          Manage Therapists
        </h1>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>All Therapists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {therapists.map((therapist) => (
              <div key={therapist._id} className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-4">
                <span className="font-medium">{therapist.name}</span>
                <span>{therapist.specialization}</span>
                <span>{therapist.email}</span>
                <span>{therapist.verificationStatus}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
