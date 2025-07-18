
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { EditProfileDialog } from '../profile/EditProfileDialog';
import { useState } from 'react';
import { ValidateProfileDialog } from '../profile/ValidateProfileDialog';

export default function WelcomeMessage() {
  const { user, reloadUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isValidateOpen, setIsValidateOpen] = useState(false);

  if (!user) {
    return null; 
  }

  const handleValidationSuccess = () => {
    setIsValidateOpen(false);
    reloadUser(); // Recarga los datos del usuario para reflejar el nuevo rol e instituto
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
        <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => setIsEditOpen(true)}>Editar Perfil</Button>
            {!user.isVerified && user.role === 'Student' && (
              <Button variant="secondary" onClick={() => setIsValidateOpen(true)}>Validar Perfil</Button>
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

      {user && !user.isVerified && (
        <ValidateProfileDialog 
            isOpen={isValidateOpen}
            onClose={() => setIsValidateOpen(false)}
            onSuccess={handleValidationSuccess}
        />
      )}
    </>
  );
}
