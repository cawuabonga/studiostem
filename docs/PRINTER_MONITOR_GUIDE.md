
# Guía de Monitoreo de Hardware para Point Print (EDA)

Este documento explica cómo conectar el estado de la impresora física de tu PC con la plataforma STEM V2.

## 1. El Puente de Comunicación (Python Script)

Necesitas ejecutar un pequeño script en la computadora a la que está conectada la impresora. Este script leerá el estado de Windows y lo enviará a tu servidor Next.js.

### Requisitos:
1. Instalar Python 3.
2. Instalar librerías: `pip install pywin32 requests`

### Script `printer_monitor.py`:

```python
import win32print
import requests
import time
import json

# ============================================================
# CONFIGURACIÓN
# ============================================================
POINT_ID = "EDA-001" # Debe coincidir con el Hard-ID en el panel de admin

# IMPORTANTE: La URL DEBE comenzar con https://
SERVER_URL = "https://tu-dominio-aqui.com/api/eda/printer-status"

PRINTER_NAME = "" # Deja vacío para usar la impresora predeterminada de Windows

def get_printer_status():
    try:
        # 0. Obtener la impresora
        if not PRINTER_NAME:
            p_handle = win32print.OpenPrinter(win32print.GetDefaultPrinter())
        else:
            p_handle = win32print.OpenPrinter(PRINTER_NAME)
        
        # 1. Obtener info de nivel 2 (estado de spooler)
        info = win32print.GetPrinter(p_handle, 2)
        status_code = info['Status']
        
        # Mapeo de códigos de Windows a STEM
        status = "Online"
        paper = "OK"
        
        if status_code & win32print.PRINTER_STATUS_OFFLINE: status = "Offline"
        if status_code & win32print.PRINTER_STATUS_ERROR: status = "Error"
        if status_code & win32print.PRINTER_STATUS_PAPER_OUT: paper = "Empty"
        if status_code & win32print.PRINTER_STATUS_PAPER_JAM: paper = "Jam"
        if status_code & win32print.PRINTER_STATUS_PRINTING: status = "Printing"
        
        win32print.ClosePrinter(p_handle)
        return status, paper
    except Exception as e:
        return "Offline", "OK"

def sync_to_cloud():
    print(f"Iniciando monitor para {POINT_ID}...")
    print(f"Enviando datos a: {SERVER_URL}")
    
    while True:
        status, paper = get_printer_status()
        
        payload = {
            "pointId": POINT_ID,
            "status": status,
            "paper": paper,
            "toner": 85, # Simulado
            "printerName": "Impresora Local"
        }
        
        try:
            r = requests.post(SERVER_URL, json=payload, timeout=5)
            print(f"[{time.strftime('%H:%M:%S')}] Sync: {status} | Paper: {paper} | HTTP: {r.status_code}")
        except Exception as e:
            print(f"Error conectando con el servidor STEM: {e}")
            
        time.sleep(10) # Sincronizar cada 10 segundos

if __name__ == "__main__":
    sync_to_cloud()
```

## 2. Solución de Problemas Comunes

*   **Error "No scheme supplied"**: Asegúrate de que la variable `SERVER_URL` comience con `https://`.
*   **Error 404**: Verifica que el `POINT_ID` en el script sea idéntico al registrado en el panel de administración de la web.
*   **HTTP 200 pero no hay cambios**: Verifica que el índice de Firestore (Collection Group) para `pointId` esté habilitado en la consola de Firebase.

## 3. Visualización en el Kiosko
Una vez que el script esté corriendo con el código `HTTP: 200`, el componente `KioskView` en la web detectará los cambios en segundos y mostrará un mensaje de advertencia si la impresora se apaga o se queda sin papel, bloqueando el botón de impresión para evitar cargos fallidos.
