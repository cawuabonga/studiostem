
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

  const handleProfileLinked = async () => {
    await reloadUser();
    setIsLinkProfileOpen(false);
  }

  if (!user) {
    return null; 
  }
  
  // A user is considered "unlinked" if they don't have a documentId in their profile.
  const isUnlinked = !user.documentId;
  
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
                 <p className="text-center text-muted-foreground p-4 bg-accent/20 rounded-md border border-accent">
                    Parece que tu cuenta aún no está vinculada a un perfil del instituto. 
                    <br/>
                    <strong>Haz clic en "Vincular mi Perfil"</strong> para conectar tu cuenta con tu información de estudiante o personal.
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
            <Button onClick={() => setIsEditOpen(true)}>Editar Perfil</Button>
            {isUnlinked && (
                 <Button variant="secondary" onClick={() => setIsLinkProfileOpen(true)}>Vincular mi Perfil</Button>
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
       {user && isUnlinked && (
        <LinkProfileDialog
          isOpen={isLinkProfileOpen}
          onClose={() => setIsLinkProfileOpen(false)}
          onProfileLinked={handleProfileLinked}
        />
      )}
    </>
  );
}
