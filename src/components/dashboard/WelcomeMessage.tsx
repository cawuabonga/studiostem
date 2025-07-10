"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomeMessage() {
  const { user } = useAuth();

  if (!user) {
    return null; 
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.[0] || 'U'}`} alt={user.displayName || "Avatar de usuario"} data-ai-hint="profile avatar" />
          <AvatarFallback className="text-3xl">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-headline">¡Bienvenido, {user.displayName || 'Usuario'}!</CardTitle>
        <CardDescription className="text-lg">
          Has iniciado sesión como <span className="font-semibold text-primary">{user.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          Este es tu panel de control. Las futuras actualizaciones y funcionalidades específicas para tu rol aparecerán aquí.
        </p>
        {/* Placeholder for future content based on role */}
        {user.role === 'Admin' && (
          <p className="mt-4 text-center text-sm text-accent-foreground bg-accent/20 p-2 rounded-md">
            Las herramientas y opciones específicas de administrador estarán disponibles aquí.
          </p>
        )}
         {user.role === 'Teacher' && (
          <p className="mt-4 text-center text-sm">
            Accede a tus cursos, entregas de estudiantes y herramientas de calificación.
          </p>
        )}
         {user.role === 'Student' && (
          <p className="mt-4 text-center text-sm">
            Visualiza tus cursos matriculados, tareas y calificaciones.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
