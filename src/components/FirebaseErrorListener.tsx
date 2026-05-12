
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // Ensure we have context to avoid [object Object] errors when logging/throwing
      const context = error?.context || { path: 'unknown', operation: 'unknown' };
      
      if (process.env.NODE_ENV === 'development') {
        const contextualMessage = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify({
          path: context.path,
          method: context.operation,
          data: context.requestResourceData || 'No data'
        }, null, 2)}`;
        
        console.error(contextualMessage);
        // We throw as string if context is missing or generic to help debugging
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
