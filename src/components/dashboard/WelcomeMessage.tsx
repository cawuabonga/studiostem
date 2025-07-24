
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { EditProfileDialog } from '../profile/EditProfileDialog';
import { useState } from 'react';
import { LinkProfileDialog } from '../profile/LinkProfileDialog';

export default function WelcomeMessage() {
  const { user, reloadUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkProfileOpen, setIsLinkProfileOpen] = useState(false);

  if (!user) {
    return null; 
  }
  
  const isUnlinked = !user.documentId && user.role === 'Student';

  const handleProfileLinked = async () => {
    await reloadUser();
    setIsLinkProfileOpen(false);
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
            Has iniciado sesión como {user.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
             {isUnlinked ? (
                <p className="text-center text-accent-foreground bg-accent/20 p-4 rounded-md">
                    ¡Casi listo! Para acceder a todas tus funcionalidades, primero necesitas vincular tu cuenta a tu perfil de estudiante. Haz clic en el botón de abajo.
                </p>
             ) : (
                <p className="text-center text-muted-foreground">
                    {user.instituteId 
                        ? 'Utiliza el menú lateral para navegar por las diferentes secciones de la aplicación.'
                        : 'Este es tu panel de control. Un SuperAdmin debe asignarte un instituto.'
                    }
                </p>
            )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
            {isUnlinked ? (
                 <Button onClick={() => setIsLinkProfileOpen(true)} size="lg">Vincular mi Perfil</Button>
            ) : (
                <Button onClick={() => setIsEditOpen(true)}>Editar Perfil</Button>
            )}
        </CardFooter>
      </Card>

      {user && (
          <EditProfileDialog 
            user={user}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
      )}

      <LinkProfileDialog
        isOpen={isLinkProfileOpen}
        onClose={() => setIsLinkProfileOpen(false)}
        onProfileLinked={handleProfileLinked}
      />
    </>
  );
}
