
# Guía de Monitoreo de Hardware para Point Print (EDA)

Este documento explica cómo conectar el estado de la impresora física de tu PC con la plataforma STEM V2.

## 1. El Puente de Comunicación (Python Script)

Necesitas ejecutar este script en la computadora a la que está conectada la impresora.

### Requisitos:
1. Instalar Python 3.
2. Instalar librerías: `pip install pywin32 requests`

### Script `printer_monitor.py` (Versión Final con Depuración):

```python
import win32print
import requests
import time
import json

# ============================================================
# CONFIGURACIÓN
# ============================================================
POINT_ID = "EDA-001" 

# IMPORTANTE: Usa tu dominio oficial de producción
SERVER_URL = "https://studiostem--stem-v2-4y6a0.us-east4.hosted.app/api/eda/printer-status"

CHECK_INTERVAL = 5
TONER_LEVEL = 85

def get_printer_status():
    try:
        p_name = win32print.GetDefaultPrinter()
        p_handle = win32print.OpenPrinter(p_name)
        info = win32print.GetPrinter(p_handle, 2)
        status_code = info['Status']
        
        status = "Online"
        paper = "OK"
        
        if status_code & win32print.PRINTER_STATUS_OFFLINE: status = "Offline"
        if status_code & win32print.PRINTER_STATUS_ERROR: status = "Error"
        if status_code & win32print.PRINTER_STATUS_PAPER_OUT: paper = "Empty"
        if status_code & win32print.PRINTER_STATUS_PAPER_JAM: paper = "Jam"
        if status_code & win32print.PRINTER_STATUS_PRINTING: status = "Printing"
        
        win32print.ClosePrinter(p_handle)
        return status, paper, p_name
    except Exception as e:
        return "Offline", "OK", "No Printer"

def sync_to_cloud():
    print("="*60)
    print("STEM POINT PRINT - MONITOR ACTIVO")
    print("="*60)
    
    last_state = None
    
    while True:
        status, paper, p_name = get_printer_status()
        current_state = f"{status}-{paper}-{p_name}"
        
        if current_state != last_state:
            payload = {
                "pointId": POINT_ID,
                "status": status,
                "paper": paper,
                "toner": TONER_LEVEL,
                "printerName": p_name
            }
            
            try:
                r = requests.post(SERVER_URL, json=payload, timeout=5)
                
                print(f"[{time.strftime('%H:%M:%S')}] CAMBIO DETECTADO")
                print(f" > Estado: {status} | Papel: {paper}")
                print(f" > HTTP: {r.status_code}")
                
                if r.status_code == 200:
                    data = r.json()
                    print(f" > Guardado en: {data['debug']['fullPath']}")
                else:
                    try:
                        err_data = r.json()
                        print(f" > Error: {err_data.get('message', 'Desconocido')}")
                    except:
                        print(f" > Error de servidor (500)")
                
                last_state = current_state
            except Exception as e:
                print(f"Error de red: {e}")
            
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    sync_to_cloud()
```

## 2. Verificación
Cuando el script diga `HTTP: 200` y muestre `Guardado en: institutes/...`, ve a esa ruta exacta en tu consola de Firebase para confirmar que los datos están ahí. La pantalla del Kiosko se actualizará sola en ese instante.
