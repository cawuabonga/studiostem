
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  protect?: boolean; // Requiere autenticación
  redirectIfAuthenticated?: boolean; // Redirige si ya está logueado (ej: en el login)
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { 
    redirectTo = '', 
    protect = false, 
    redirectIfAuthenticated = false 
  } = options;

  useEffect(() => {
    if (loading) {
      return;
    }

    // Lógica para proteger rutas (si no hay sesión)
    if (protect && !user) {
      let finalRedirect = '/';
      
      // Buscamos si hay una marca de instituto guardada en el navegador
      if (typeof window !== 'undefined') {
          const stickyInstituteId = localStorage.getItem('last_institute_id');
          // Si el navegador recuerda un instituto, lo mandamos a ese login específico
          if (stickyInstituteId) {
              finalRedirect = `/login/${stickyInstituteId}`;
          }
      }
      
      const target = redirectTo || finalRedirect;
      if (pathname !== target) {
          router.push(target);
      }
      return;
    }
    
    // Si ya está autenticado y trata de entrar al login, lo mandamos al dashboard
    if (redirectIfAuthenticated && user) {
      router.push(redirectTo || '/dashboard');
    }

  }, [user, loading, router, protect, redirectIfAuthenticated, redirectTo, pathname]);

  return { user, loading };
}
