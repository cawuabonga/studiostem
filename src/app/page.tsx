
"use client";

import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.push('/dashboard');
    } else {
        // Redirección inteligente si el navegador recuerda un instituto
        // Esto asegura que si el usuario entra a la raíz, vea el branding de su instituto inmediatamente
        if (typeof window !== 'undefined') {
            const stickyId = localStorage.getItem('last_institute_id');
            if (stickyId) {
                router.replace(`/login/${stickyId}`);
            }
        }
    }
  }, [user, loading, router]);
  
  return (
    <AuthPageLayout formType="login">
      <LoginForm />
    </AuthPageLayout>
  );
}
