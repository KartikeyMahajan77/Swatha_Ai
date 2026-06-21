"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Therapist, getVerifiedTherapists } from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function TherapistsPage() {
  const roleGuard = useRequireRole(["user"]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    getVerifiedTherapists()
      .then((data) => setTherapists(data.therapists))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load therapists"))
      .finally(() => setLoading(false));
  }, [roleGuard.isAllowed]);

  if (!roleGuard.isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24 dark:from-emerald-950/20 dark:to-sky-950/20">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Stethoscope className="h-8 w-8 text-primary" />
            Certified Therapists
          </h1>
          <p className="mt-2 text-muted-foreground">
            Book a session with verified mental health professionals.
          </p>
        </div>

        {loading && <Loader2 className="h-7 w-7 animate-spin text-primary" />}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {therapists.map((therapist) => (
            <Card key={therapist._id} className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl">{therapist.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{therapist.specialization}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{therapist.qualification}</p>
                <p>{therapist.experienceYears} years experience</p>
                <p className="font-medium">Rs. {therapist.hourlyRate}/hour</p>
                <p className="line-clamp-3 text-muted-foreground">{therapist.bio}</p>
                <Button asChild className="w-full">
                  <Link href={`/therapists/${therapist._id}`}>Book Session</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && therapists.length === 0 && (
          <p className="rounded-md border p-5 text-sm text-muted-foreground">
            No verified therapists are available yet.
          </p>
        )}
      </div>
    </div>
  );
}
