"use client";

import { useParams } from "next/navigation";
import { AppointmentSummary } from "@/components/therapy/appointment-summary";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function PatientAppointmentSummaryPage() {
  const params = useParams<{ appointmentId: string }>();
  const roleGuard = useRequireRole(["user"]);

  if (!roleGuard.isAllowed) {
    return null;
  }

  return <AppointmentSummary appointmentId={params.appointmentId} role="patient" />;
}
