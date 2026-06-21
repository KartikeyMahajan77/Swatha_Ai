"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Therapist, bookAppointment, getTherapistById } from "@/lib/api/therapists";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function TherapistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roleGuard = useRequireRole(["user"]);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const openSlots = useMemo(
    () => (therapist?.availability || []).filter((slot) => !slot.isBooked),
    [therapist],
  );

  useEffect(() => {
    if (!roleGuard.isAllowed) {
      return;
    }

    getTherapistById(params.id)
      .then((data) => {
        setTherapist(data.therapist);
        const firstOpenSlot = data.therapist.availability?.find((slot) => !slot.isBooked);
        setSelectedSlotId(firstOpenSlot?._id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load therapist"))
      .finally(() => setLoading(false));
  }, [params.id, roleGuard.isAllowed]);

  const handleBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const slot = openSlots.find((item) => item._id === selectedSlotId);
    if (!slot) {
      setError("Please choose an available slot.");
      return;
    }

    setBooking(true);
    try {
      const response = await bookAppointment(params.id, {
        availabilitySlotId: selectedSlotId,
        date: slot.date,
        time: slot.startTime,
        durationMinutes: Number(durationMinutes),
        notes,
      });
      setMessage(response.message);
      const refreshed = await getTherapistById(params.id);
      setTherapist(refreshed.therapist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading || !roleGuard.isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!therapist) {
    return <div className="min-h-screen px-4 py-24">Therapist not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24 dark:from-emerald-950/20 dark:to-sky-950/20">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-3xl">{therapist.name}</CardTitle>
            <p className="text-muted-foreground">{therapist.specialization}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{therapist.bio}</p>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border p-3">{therapist.qualification}</div>
              <div className="rounded-md border p-3">{therapist.experienceYears} years</div>
              <div className="rounded-md border p-3">Rs. {therapist.hourlyRate}/hour</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Book Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBooking} className="space-y-4">
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
                required
              >
                <option value="">Select available slot</option>
                {openSlots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {new Date(slot.date).toLocaleDateString()} | {slot.startTime} - {slot.endTime}
                  </option>
                ))}
              </select>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
              <Textarea
                placeholder="Notes for the therapist"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              <Button className="w-full" disabled={booking || openSlots.length === 0}>
                {booking && <Loader2 className="h-4 w-4 animate-spin" />}
                Book Appointment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
