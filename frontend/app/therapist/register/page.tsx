"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseMedical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { therapistRegister } from "@/lib/api/therapists";
import { useRedirectAuthenticated } from "@/lib/hooks/use-role-redirect";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  qualification: "",
  specialization: "",
  experienceYears: "",
  hourlyRate: "",
  bio: "",
  certificateUrl: "",
};

export default function TherapistRegisterPage() {
  const router = useRouter();
  useRedirectAuthenticated();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await therapistRegister({
        ...form,
        experienceYears: Number(form.experienceYears),
        hourlyRate: Number(form.hourlyRate),
      });
      setMessage(response.message);
      setForm(initialForm);
      setTimeout(() => router.push("/therapist/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24 dark:from-emerald-950/20 dark:to-sky-950/20">
      <Card className="mx-auto w-full max-w-3xl rounded-lg border-primary/10 bg-card/95 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BriefcaseMedical className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Therapist Registration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Full name", "text"],
              ["email", "Email", "email"],
              ["password", "Password", "password"],
              ["phone", "Phone", "tel"],
              ["qualification", "Qualification", "text"],
              ["specialization", "Specialization", "text"],
              ["experienceYears", "Experience years", "number"],
              ["hourlyRate", "Hourly rate", "number"],
              ["certificateUrl", "Certificate URL", "url"],
            ].map(([field, label, type]) => (
              <Input
                key={field}
                type={type}
                placeholder={label}
                value={form[field as keyof typeof form]}
                onChange={(event) => updateField(field, event.target.value)}
                required={field !== "certificateUrl"}
              />
            ))}
            <Textarea
              className="md:col-span-2"
              placeholder="Short professional bio"
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              required
            />
            {error && <p className="md:col-span-2 text-sm text-red-500">{error}</p>}
            {message && <p className="md:col-span-2 text-sm text-emerald-600">{message}</p>}
            <Button className="md:col-span-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for Verification
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/therapist/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
