"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment, getMyAppointments } from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";
import { getAppointmentStartLabel } from "@/lib/appointment-time";
import { joinAppointmentSession } from "@/lib/api/appointments";

export default function AppointmentsPage() {
  const roleGuard = useRequireRole(["user"]);
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifiedAppointmentIds, setNotifiedAppointmentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [sessionPrompt, setSessionPrompt] = useState<Appointment | null>(null);

  const handleAppointments = useCallback((nextAppointments: Appointment[]) => {
    setAppointments(nextAppointments);

    const liveAppointment = nextAppointments.find(
      (appointment) =>
        appointment.status === "waiting_for_patient" &&
        !notifiedAppointmentIds.has(appointment._id),
    );

    if (liveAppointment) {
      setSessionPrompt(liveAppointment);
      setNotifiedAppointmentIds((current) => {
        const updated = new Set(current);
        updated.add(liveAppointment._id);
        return updated;
      });
    }
  }, [notifiedAppointmentIds]);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getMyAppointments();
      console.log("Appointment:", data.appointments);
      handleAppointments(data.appointments || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [handleAppointments]);

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    loadAppointments();
    const interval = window.setInterval(loadAppointments, 5000);

    return () => window.clearInterval(interval);
  }, [loadAppointments, roleGuard.isAllowed]);

  useEffect(() => {
    const handleSessionStarted = (event: Event) => {
      const payload = (event as CustomEvent<{ appointmentId: string }>).detail;
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === payload.appointmentId
            ? { ...appointment, status: "waiting_for_patient" }
            : appointment,
        ),
      );

      const appointment = appointments.find(
        (item) => item._id === payload.appointmentId,
      );
      if (appointment && !notifiedAppointmentIds.has(appointment._id)) {
        setSessionPrompt({ ...appointment, status: "waiting_for_patient" });
        setNotifiedAppointmentIds((current) => {
          const updated = new Set(current);
          updated.add(appointment._id);
          return updated;
        });
      }
    };

    window.addEventListener(
      "swastha-therapy-session-started",
      handleSessionStarted,
    );

    return () =>
      window.removeEventListener(
        "swastha-therapy-session-started",
        handleSessionStarted,
      );
  }, [appointments, notifiedAppointmentIds]);

  if (!roleGuard.isAllowed || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const joinSession = async (appointmentId: string) => {
    await joinAppointmentSession(appointmentId);
    setSessionPrompt(null);
    router.push(`/appointments/${appointmentId}/chat`);
  };

  const statusBadge = (appointment: Appointment) => {
    if (appointment.status === "waiting_for_patient") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </span>
          Live
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
          Appointments
        </h1>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {sessionPrompt && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-emerald-900">
                  Your therapist has started the session. Join now?
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  {sessionPrompt.therapistId?.name || "Your therapist"} is waiting in the session room.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSessionPrompt(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => joinSession(sessionPrompt._id)}>
                Join Session
              </Button>
              <Button variant="outline" onClick={() => setSessionPrompt(null)}>
                Later
              </Button>
            </div>
          </div>
        )}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments booked yet.</p>
            )}
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className={`rounded-md border p-4 text-sm ${
                  appointment.status === "waiting_for_patient"
                    ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{getAppointmentStartLabel(appointment)}</p>
                  {statusBadge(appointment)}
                </div>
                <p className="text-muted-foreground">
                  Therapist: {appointment.therapistId?.name || "Therapist"}
                </p>
                {appointment.status === "waiting_for_patient" && (
                  <p className="mt-2 font-medium text-emerald-700">
                    Therapist has started the session
                  </p>
                )}
                <div className="mt-3">
                  {appointment.status === "completed" ? (
                    <Button asChild variant="outline">
                      <Link href={`/appointments/${appointment._id}/summary`}>
                        View Summary
                      </Link>
                    </Button>
                  ) : appointment.status === "waiting_for_patient" ? (
                    <Button
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => joinSession(appointment._id)}
                    >
                      Join Now
                    </Button>
                  ) : appointment.status === "active" ? (
                    <Button asChild>
                      <Link href={`/appointments/${appointment._id}/chat`}>
                        Open Chat
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled>
                      Session will start after therapist begins
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
