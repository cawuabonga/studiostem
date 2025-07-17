
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
    // Si la autenticación no está cargando y hay un usuario, redirigir al dashboard.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Mientras se carga o si el usuario ya está logueado y esperando ser redirigido,
  // es mejor mostrar el layout de login para evitar una pantalla en blanco.
  // El useEffect se encargará de la redirección de todas formas.
  
  return (
    <AuthPageLayout title="">
      <LoginForm />
    </AuthPageLayout>
  );
}
