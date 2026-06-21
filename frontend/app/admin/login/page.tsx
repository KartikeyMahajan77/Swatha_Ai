"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminLogin } from "@/lib/api/therapists";
import { useSession } from "@/lib/contexts/session-context";
import { clearOtherRoleTokens, notifyAuthRoleChange } from "@/lib/role-auth";
import { useRedirectAuthenticated } from "@/lib/hooks/use-role-redirect";

export default function AdminLoginPage() {
  const router = useRouter();
  const { checkSession } = useSession();
  useRedirectAuthenticated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await adminLogin(email, password);
      clearOtherRoleTokens("admin");
      localStorage.setItem("adminToken", response.token);
      notifyAuthRoleChange();
      await checkSession();
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 px-4 py-24">
      <Card className="mx-auto max-w-md rounded-lg">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
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
            <Button className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
