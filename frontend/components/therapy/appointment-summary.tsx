"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentDetails } from "@/lib/api/appointments";
import { Appointment } from "@/lib/api/therapists";
import { getAppointmentStartLabel } from "@/lib/appointment-time";

interface AppointmentSummaryProps {
  appointmentId: string;
  role: "patient" | "therapist";
}

export function AppointmentSummary({
  appointmentId,
  role,
}: AppointmentSummaryProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAppointmentDetails(appointmentId, role)
      .then((data) => setAppointment(data.appointment))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load summary"),
      )
      .finally(() => setLoading(false));
  }, [appointmentId, role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const summary = appointment?.aiSummary;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <Card className="mx-auto max-w-4xl rounded-lg">
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            {appointment
              ? `${getAppointmentStartLabel(appointment)} | ${appointment.status}`
              : "Therapy session"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!summary && (
            <p className="text-sm text-muted-foreground">
              Summary is not available yet.
            </p>
          )}
          {summary && (
            <>
              <div>
                <h2 className="font-semibold">Summary</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.sessionSummary}
                </p>
              </div>
              <div>
                <h2 className="font-semibold">Main Concerns</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.mainConcerns?.join(", ") || "None recorded"}
                </p>
              </div>
              <div>
                <h2 className="font-semibold">Suggested Exercises</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.suggestedExercises?.join(", ") || "None recorded"}
                </p>
              </div>
              <div>
                <h2 className="font-semibold">Follow Up</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.followUpRecommendation || "No recommendation recorded"}
                </p>
              </div>
              {role === "therapist" && summary.therapistNotesDraft && (
                <div>
                  <h2 className="font-semibold">Therapist Notes Draft</h2>
                  <p className="text-sm text-muted-foreground">
                    {summary.therapistNotesDraft}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
