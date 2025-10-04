"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function Layout({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session?.user) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session?.user) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#efefef]">
      <Navbar />
      <DashboardSidebar />
      <main className="flex-1 md:ml-[260px]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
