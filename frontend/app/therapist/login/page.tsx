"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { therapistLogin } from "@/lib/api/therapists";
import { useSession } from "@/lib/contexts/session-context";
import { clearOtherRoleTokens, notifyAuthRoleChange } from "@/lib/role-auth";
import { useRedirectAuthenticated } from "@/lib/hooks/use-role-redirect";

export default function TherapistLoginPage() {
  const router = useRouter();
  const { checkSession } = useSession();
  useRedirectAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await therapistLogin(email, password);
      clearOtherRoleTokens("therapist");
      localStorage.setItem("therapistToken", response.token);
      notifyAuthRoleChange();
      await checkSession();
      router.push("/therapist/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24 dark:from-emerald-950/20 dark:to-sky-950/20">
      <Card className="mx-auto w-full max-w-md rounded-lg border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LogIn className="h-5 w-5 text-primary" />
            Therapist Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New therapist?{" "}
            <Link href="/therapist/register" className="font-medium text-primary">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
