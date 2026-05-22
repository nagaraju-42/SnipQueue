import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | SnipQ",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-background py-12">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 mt-2">Join SnipQ and skip the queue forever.</p>
        </div>
        
        <RegisterForm />

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
