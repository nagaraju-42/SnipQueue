"use client";

import { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOtpForm() {
  const [otp, setOtp] = useState("");
  const { verifyOtp, loading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/login");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await verifyOtp(email, otp);
      router.push("/login?verified=true");
    } catch (err) {
      // handled
    }
  };

  if (!email) return null;

  return (
    <Card className="w-full max-w-md text-center">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Verify Email</h1>
        <p className="text-gray-500 mt-2">We sent a 6-digit code to <span className="font-medium text-gray-800">{email}</span></p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          maxLength={6}
          placeholder="000000"
          className="text-center text-2xl tracking-widest font-mono h-16"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" isLoading={loading} disabled={otp.length !== 6}>
          Verify
        </Button>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-background">
      <Suspense fallback={
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-gray-500">Loading verification form...</p>
        </Card>
      }>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
