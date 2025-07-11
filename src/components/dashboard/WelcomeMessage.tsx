"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { EditProfileDialog } from '../profile/EditProfileDialog';
import { useState } from 'react';

export default function WelcomeMessage() {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) {
    return null; 
  }

  return (
    <>
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
            Este es tu panel de control. Utiliza el menú lateral para navegar por las diferentes secciones de la aplicación.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button onClick={() => setIsEditOpen(true)}>Editar Perfil</Button>
        </CardFooter>
      </Card>
      {user && (
          <EditProfileDialog 
            user={user}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
      )}
    </>
  );
}
