"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Loader2, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  TherapyMessage,
  endAppointmentSession,
  getAppointmentDetails,
  getAppointmentMessages,
  getAppointmentToken,
  getSocketUrl,
  joinAppointmentSession,
  postAppointmentMessage,
  startTherapistSession,
} from "@/lib/api/appointments";
import { Appointment } from "@/lib/api/therapists";
import { getAppointmentStartLabel } from "@/lib/appointment-time";

interface TherapyAppointmentChatProps {
  appointmentId: string;
  role: "patient" | "therapist";
}

export function TherapyAppointmentChat({
  appointmentId,
  role,
}: TherapyAppointmentChatProps) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<TherapyMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [typingRole, setTypingRole] = useState<"patient" | "therapist" | null>(
    null,
  );

  const summaryPath = useMemo(
    () =>
      role === "patient"
        ? `/appointments/${appointmentId}/summary`
        : `/therapist/appointments/${appointmentId}/summary`,
    [appointmentId, role],
  );

  useEffect(() => {
    let mounted = true;

    const loadChat = async () => {
      try {
        const details = await getAppointmentDetails(appointmentId, role);

        if (!mounted) {
          return;
        }

        if (
          details.appointment.status === "completed" ||
          details.appointment.status === "cancelled"
        ) {
          setAppointment(details.appointment);
          return;
        }

        if (role === "therapist" && details.appointment.status === "booked") {
          if (!details.canStart) {
            setAppointment(details.appointment);
            setError("Chat will be available when your session starts.");
            return;
          }

          const started = await startTherapistSession(appointmentId);
          setAppointment(started.appointment);
        } else if (role === "patient") {
          if (details.appointment.status === "booked") {
            setAppointment(details.appointment);
            setError("Your therapist has not started this session yet.");
            return;
          }

          if (details.appointment.status === "waiting_for_patient") {
            const joined = await joinAppointmentSession(appointmentId);
            setAppointment(joined.appointment);
          } else {
            setAppointment(details.appointment);
          }
        } else {
          setAppointment(details.appointment);
        }

        const history = await getAppointmentMessages(appointmentId, role);
        setMessages(history.messages || []);

        const socket = io(getSocketUrl(), {
          auth: { token: getAppointmentToken(role) },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit(
            "join_appointment_room",
            { appointmentId },
            (response: { success: boolean; message?: string }) => {
              if (!response.success) {
                setError(response.message || "Unable to join appointment room.");
              }
            },
          );
        });

        socket.on("receive_therapy_message", (incoming: TherapyMessage) => {
          setMessages((current) => {
            if (current.some((item) => item._id === incoming._id)) {
              return current;
            }
            return [...current, incoming];
          });
        });

        socket.on("patient_joined_session", () => {
          setAppointment((current) =>
            current ? { ...current, status: "active" } : current,
          );
        });

        socket.on(
          "typing",
          (payload: { senderRole: "patient" | "therapist" }) => {
            if (payload.senderRole !== role) {
              setTypingRole(payload.senderRole);
            }
          },
        );

        socket.on("stop_typing", () => setTypingRole(null));

        socket.on("end_therapy_session", () => {
          router.replace(summaryPath);
        });

        socket.on("connect_error", () => {
          setError("Real-time connection failed. Messages will use fallback sending.");
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadChat();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [appointmentId, role, router, summaryPath]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || appointment?.status !== "active") {
      return;
    }

    setMessage("");

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "send_therapy_message",
        { appointmentId, message: trimmedMessage },
        async (response: { success: boolean }) => {
          if (!response.success) {
            const fallback = await postAppointmentMessage(
              appointmentId,
              role,
              trimmedMessage,
            );
            setMessages((current) => [...current, fallback.message]);
          }
        },
      );
      return;
    }

    const fallback = await postAppointmentMessage(
      appointmentId,
      role,
      trimmedMessage,
    );
    setMessages((current) => [...current, fallback.message]);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    socketRef.current?.emit(value ? "typing" : "stop_typing", {
      appointmentId,
    });
  };

  const endSession = async () => {
    setEnding(true);
    setError("");

    try {
      await endAppointmentSession(appointmentId, role);
      socketRef.current?.emit("end_therapy_session", { appointmentId });
      router.push(summaryPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (appointment?.status === "completed") {
    router.replace(summaryPath);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <Card className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Therapy Session Chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            {appointment
              ? `${getAppointmentStartLabel(appointment)} | ${appointment.status.replace(/_/g, " ")}`
              : "Appointment chat"}
          </p>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          {error && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              {error}
            </p>
          )}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-md border bg-background p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {appointment?.status === "waiting_for_patient"
                  ? "Waiting for patient to join..."
                  : "No messages yet. Start when both sides are ready."}
              </p>
            )}
            {messages.map((item) => {
              const isMine = item.senderRole === role;
              return (
                <div
                  key={item._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p>{item.message}</p>
                    <p className="mt-1 text-[11px] opacity-70">
                      {item.senderRole} |{" "}
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {typingRole && (
              <p className="text-xs text-muted-foreground">
                {typingRole === "patient" ? "Patient" : "Therapist"} is typing...
              </p>
            )}
          </div>

          {appointment?.status === "cancelled" ? (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              This appointment was cancelled.
            </p>
          ) : appointment?.status === "active" ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <Textarea
                className="min-h-[44px] flex-1 resize-none"
                placeholder="Type your message"
                value={message}
                onChange={(event) => handleTyping(event.target.value)}
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                  Send
                </Button>
                {role === "therapist" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={ending}
                    onClick={endSession}
                  >
                    {ending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    End
                  </Button>
                )}
              </div>
            </form>
          ) : appointment?.status === "waiting_for_patient" ? (
            <div className="flex items-center justify-between rounded-md border p-3 text-sm text-muted-foreground">
              <span>Waiting for patient to join...</span>
              {role === "therapist" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={ending}
                  onClick={endSession}
                >
                  End Session
                </Button>
              )}
            </div>
          ) : (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              Chat will be available when your session starts.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
