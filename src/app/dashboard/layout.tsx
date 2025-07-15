
"use client";

import DashboardMainLayout from "@/components/layout/DashboardMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function Layout({ children }: { children: React.ReactNode }) {
  const { instituteId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and there is no institute selected, redirect to the selector
    if (!loading && !instituteId) {
      router.push('/dashboard/institute');
    }
  }, [instituteId, loading, router]);


  return <DashboardMainLayout>{children}</DashboardMainLayout>;
}
