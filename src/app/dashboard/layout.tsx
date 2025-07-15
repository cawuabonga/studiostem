

"use client";

import DashboardMainLayout from "@/components/layout/DashboardMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function Layout({ children }: { children: React.ReactNode }) {
  const { instituteId, loading, institute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and there is no institute selected, redirect to the selector
    if (!loading && !instituteId) {
      router.push('/dashboard/institute');
    }
  }, [instituteId, loading, router]);

  useEffect(() => {
    // Apply theme colors dynamically
    if (institute?.primaryColor) {
      const root = document.documentElement;
      root.style.setProperty('--primary', institute.primaryColor);
      // You can derive other colors from the primary or have them as separate fields
      // For simplicity, we'll just set the primary color for now.
    }
  }, [institute]);


  return <DashboardMainLayout>{children}</DashboardMainLayout>;
}
