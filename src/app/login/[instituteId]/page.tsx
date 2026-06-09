"use client";

import React, { use } from 'react';
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InstituteLoginPage({ params }: { params: Promise<{ instituteId: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { instituteId } = use(params);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  return (
    <AuthPageLayout formType="login" instituteId={instituteId}>
      <LoginForm />
    </AuthPageLayout>
  );
}
