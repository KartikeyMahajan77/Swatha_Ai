"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment, getTherapistAppointments } from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";
import {
  canStartAppointmentChat,
  getAppointmentStartLabel,
} from "@/lib/appointment-time";
import { startTherapistSession } from "@/lib/api/appointments";

export default function TherapistAppointmentsPage() {
  const roleGuard = useRequireRole(["therapist"]);
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    getTherapistAppointments()
      .then((data) => {
        console.log("Appointment:", data.appointments);
        setAppointments(data.appointments || []);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load appointments"),
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

  const startSession = async (appointmentId: string) => {
    await startTherapistSession(appointmentId);
    router.push(`/therapist/appointments/${appointmentId}/chat`);
  };

  const statusBadge = (appointment: Appointment) => {
    if (appointment.status === "waiting_for_patient") {
      return (
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          Waiting for patient
        </span>
      );
    }

    const labelByStatus = {
      booked: "Booked",
      active: "In Session",
      completed: "Completed",
      cancelled: "Cancelled",
    } as const;

    return (
      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        {labelByStatus[appointment.status] || appointment.status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <CalendarDays className="h-7 w-7 text-primary" />
          Therapist Appointments
        </h1>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Booked Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments booked yet.</p>
            )}
            {appointments.map((appointment) => (
              <div key={appointment._id} className="rounded-md border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">
                    {getAppointmentStartLabel(appointment)}
                  </p>
                  {statusBadge(appointment)}
                </div>
                <p className="text-muted-foreground">
                  Patient: {appointment.patientId?.name || "Patient"}
                </p>
                {appointment.notes && <p className="mt-2">{appointment.notes}</p>}
                <div className="mt-3">
                  {appointment.status === "completed" ? (
                    <Button asChild variant="outline">
                      <Link href={`/therapist/appointments/${appointment._id}/summary`}>
                        View Summary
                      </Link>
                    </Button>
                  ) : appointment.status === "booked" ? (
                    <Button
                      disabled={!canStartAppointmentChat(appointment)}
                      onClick={() => startSession(appointment._id)}
                    >
                      {canStartAppointmentChat(appointment)
                        ? "Start Session"
                        : `Session will start at ${getAppointmentStartLabel(appointment)}`}
                    </Button>
                  ) : appointment.status === "waiting_for_patient" ? (
                    <Button disabled>Waiting for patient...</Button>
                  ) : (
                    <Button asChild>
                      <Link href={`/therapist/appointments/${appointment._id}/chat`}>
                        Open Chat
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
