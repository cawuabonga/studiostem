"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';

/**
 * @fileOverview Botón cliente para manejar la impresión del manual técnico
 * utilizando un iframe oculto para evitar la apertura de pestañas adicionales.
 */

export function PrintManualButton() {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        const iframeId = 'manual-print-iframe';
        let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
        
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = iframeId;
            // El iframe debe estar en el DOM pero ser invisible
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }
        
        // Cargamos la ruta de impresión en el iframe
        // La propia página de impresión tiene un script para disparar window.print()
        iframe.src = '/dashboard/superadmin/documentation/print';
        
        // Liberamos el estado después de un tiempo para permitir re-impresión
        // y dar feedback visual de que el proceso ha terminado o se ha enviado
        setTimeout(() => {
            setIsPrinting(false);
        }, 10000);
    };

    return (
        <Button onClick={handlePrint} disabled={isPrinting} className="shadow-lg">
            {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Printer className="mr-2 h-4 w-4" />
            )}
            {isPrinting ? 'Generando PDF...' : 'Generar Manual Técnico (PDF)'}
        </Button>
    );
}
