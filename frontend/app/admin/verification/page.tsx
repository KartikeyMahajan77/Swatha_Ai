"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Therapist,
  getPendingTherapists,
  rejectTherapist,
  verifyTherapist,
} from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function TherapistVerificationPage() {
  const roleGuard = useRequireRole(["admin"]);
  const [pending, setPending] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPending = async () => {
    const data = await getPendingTherapists();
    setPending(data.therapists || []);
  };

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    loadPending()
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load requests"),
      )
      .finally(() => setLoading(false));
  }, [roleGuard.isAllowed]);

  const review = async (therapistId: string, action: "verify" | "reject") => {
    try {
      if (action === "verify") {
        await verifyTherapist(therapistId);
      } else {
        await rejectTherapist(therapistId);
      }
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    }
  };

  if (!roleGuard.isAllowed || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <div className="mx-auto max-w-5xl space-y-5">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Therapist Verification
        </h1>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            )}
            {pending.map((therapist) => (
              <div key={therapist._id} className="flex flex-col justify-between gap-3 rounded-md border p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-medium">{therapist.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {therapist.specialization} | {therapist.qualification}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => review(therapist._id, "verify")}>
                    <Check className="h-4 w-4" />
                    Verify
                  </Button>
                  <Button variant="outline" onClick={() => review(therapist._id, "reject")}>
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
