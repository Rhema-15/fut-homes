import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Admin login · FUT Homes",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-neutral-500">FUT Homes</p>
        <LoginForm />
      </div>
    </main>
  );
}
