import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | SnipQ",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your bookings and queue.</p>
        </div>
        
        <LoginForm />

        <div className="mt-6 text-center space-y-2 text-sm text-gray-600">
          <p>
            <Link href="/forgot-password" className="text-primary hover:underline font-medium">
              Forgot your password?
            </Link>
          </p>
          <p>
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
