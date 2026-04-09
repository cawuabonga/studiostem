
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        const contextualMessage = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify({
          path: error.context.path,
          method: error.context.operation,
          data: error.context.requestResourceData
        }, null, 2)}`;
        
        throw new Error(contextualMessage);
      } else {
        toast({
          title: 'Error de Permisos',
          description: 'No tienes permisos suficientes para realizar esta acción.',
          variant: 'destructive',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
