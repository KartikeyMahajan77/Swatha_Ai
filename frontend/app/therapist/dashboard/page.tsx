"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, LogOut, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Appointment,
  AvailabilitySlot,
  Therapist,
  getTherapistAppointments,
  getTherapistProfile,
  updateTherapistAvailability,
} from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";
import {
  canStartAppointmentChat,
  getAppointmentStartLabel,
} from "@/lib/appointment-time";
import { startTherapistSession } from "@/lib/api/appointments";

const blankSlot = (): AvailabilitySlot => ({
  date: new Date().toISOString().slice(0, 10),
  startTime: "10:00",
  endTime: "11:00",
  isBooked: false,
});

export default function TherapistDashboardPage() {
  const router = useRouter();
  const roleGuard = useRequireRole(["therapist"]);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const openSlots = useMemo(
    () => availability.filter((slot) => !slot.isBooked).length,
    [availability],
  );

  const loadDashboard = async () => {
    try {
      const [{ therapist: profile }, appointmentData] = await Promise.all([
        getTherapistProfile(),
        getTherapistAppointments(),
      ]);
      setTherapist(profile);
      setAvailability(
        (profile.availability || []).map((slot) => ({
          ...slot,
          date: new Date(slot.date).toISOString().slice(0, 10),
        })),
      );
      console.log("Appointment:", appointmentData.appointments);
      setAppointments(appointmentData.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }
    loadDashboard();
  }, [roleGuard.isAllowed]);

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string) => {
    setAvailability((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await updateTherapistAvailability(availability);
      setTherapist(response.therapist);
      setAvailability(
        response.therapist.availability.map((slot) => ({
          ...slot,
          date: new Date(slot.date).toISOString().slice(0, 10),
        })),
      );
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("therapistToken");
    router.push("/therapist/login");
  };

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

  if (loading || !roleGuard.isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24 dark:from-emerald-950/20 dark:to-sky-950/20">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your booking availability and upcoming appointments.
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{therapist?.name}</p>
              <p className="text-muted-foreground">{therapist?.specialization}</p>
              <p>Status: {therapist?.verificationStatus}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Open Slots</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-primary">
              {openSlots}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Bookings</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-primary">
              {appointments.length}
            </CardContent>
          </Card>
        </div>

        {therapist?.verificationStatus !== "verified" && (
          <Card className="rounded-lg border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-5 text-sm text-amber-800 dark:text-amber-200">
              Your profile is under admin review. Your slots can be prepared now,
              but patients will see them only after verification.
            </CardContent>
          </Card>
        )}

        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Available Booking Slots</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAvailability((current) => [...current, blankSlot()])}
            >
              <CalendarPlus className="h-4 w-4" />
              Add Slot
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {availability.length === 0 && (
              <p className="text-sm text-muted-foreground">No availability slots yet.</p>
            )}
            {availability.map((slot, index) => (
              <div
                key={slot._id || index}
                className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Input
                  type="date"
                  value={slot.date}
                  disabled={slot.isBooked}
                  onChange={(event) => updateSlot(index, "date", event.target.value)}
                />
                <Input
                  type="time"
                  value={slot.startTime}
                  disabled={slot.isBooked}
                  onChange={(event) => updateSlot(index, "startTime", event.target.value)}
                />
                <Input
                  type="time"
                  value={slot.endTime}
                  disabled={slot.isBooked}
                  onChange={(event) => updateSlot(index, "endTime", event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={slot.isBooked}
                  onClick={() =>
                    setAvailability((current) =>
                      current.filter((_, slotIndex) => slotIndex !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  {slot.isBooked ? "Booked" : "Remove"}
                </Button>
              </div>
            ))}
            <Button onClick={saveAvailability} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Availability
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
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
