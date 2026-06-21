"use client";

import { useParams } from "next/navigation";
import { AppointmentSummary } from "@/components/therapy/appointment-summary";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function TherapistAppointmentSummaryPage() {
  const params = useParams<{ appointmentId: string }>();
  const roleGuard = useRequireRole(["therapist"]);

  if (!roleGuard.isAllowed) {
    return null;
  }

  return (
    <AppointmentSummary appointmentId={params.appointmentId} role="therapist" />
  );
}
