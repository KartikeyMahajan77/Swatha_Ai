"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Therapist,
  getAdminDashboard,
  getAdminTherapists,
  getPendingTherapists,
  rejectTherapist,
  verifyTherapist,
} from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function AdminDashboardPage() {
  const router = useRouter();
  const roleGuard = useRequireRole(["admin"]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Therapist[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    const [dashboardData, pendingData, therapistData] = await Promise.all([
      getAdminDashboard(),
      getPendingTherapists(),
      getAdminTherapists(),
    ]);
    setStats(dashboardData.stats);
    setPending(pendingData.therapists);
    setTherapists(therapistData.therapists);
  };

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }
    loadDashboard()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [roleGuard.isAllowed]);

  const review = async (therapistId: string, action: "verify" | "reject") => {
    try {
      if (action === "verify") {
        await verifyTherapist(therapistId);
      } else {
        await rejectTherapist(therapistId);
      }
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    }
  };

  if (loading || !roleGuard.isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(stats).map(([key, value]) => (
            <Card key={key} className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold text-primary">{value}</CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Pending Therapists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
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
