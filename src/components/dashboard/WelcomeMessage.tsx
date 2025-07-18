
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

  const isUnverifiedStudent = user.role === 'Student' && !user.isVerified;

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
             {isUnverifiedStudent
                ? "Para continuar, necesitas validar tu perfil."
                : `Has iniciado sesión como ${user.role}.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isUnverifiedStudent ? (
                <p className="text-center text-muted-foreground">
                    Haz clic en "Validar Perfil" e ingresa el DNI y el código de activación que te proporcionó tu instituto para desbloquear todas las funciones.
                </p>
            ) : (
                 <p className="text-center text-muted-foreground">
                    {user.instituteId 
                        ? 'Utiliza el menú lateral para navegar por las diferentes secciones de la aplicación.'
                        : 'Este es tu panel de control. Aún no estás asignado a un instituto.'
                    }
                </p>
            )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
            {isUnverifiedStudent ? (
                 <Button onClick={() => setIsValidateOpen(true)}>Validar Perfil</Button>
            ) : (
                <>
                    <Button onClick={() => setIsEditOpen(true)}>Editar Perfil</Button>
                    {!user.isVerified && (user.role === 'Teacher' || user.role === 'Admin' || user.role === 'Coordinator') && (
                       <Button variant="secondary" onClick={() => setIsValidateOpen(true)}>Validar Perfil</Button>
                    )}
                </>
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
