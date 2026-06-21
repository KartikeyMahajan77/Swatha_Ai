"use client";

import { useParams } from "next/navigation";
import { TherapyAppointmentChat } from "@/components/therapy/therapy-appointment-chat";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function PatientAppointmentChatPage() {
  const params = useParams<{ appointmentId: string }>();
  const roleGuard = useRequireRole(["user"]);

  if (!roleGuard.isAllowed) {
    return null;
  }

  return (
    <TherapyAppointmentChat
      appointmentId={params.appointmentId}
      role="patient"
    />
  );
}
