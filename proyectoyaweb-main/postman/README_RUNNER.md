# Runner automático (Newman) - Proyecto YA!

Esto ejecuta la colección `YA_postman_collection_runner.json` de forma secuencial y aplica un delay de 1 minuto entre cada request (útil para simular tiempos de servicio).

Requisitos:
- Node.js instalado
- Newman instalado globalmente: 

```bash
npm install -g newman
```

Instrucciones rápidas:
1. Abre una terminal en la carpeta `postman` del proyecto.
2. (Opcional) Verifica la colección existe:

```powershell
ls YA_postman_collection_runner.json
```

3. Ejecuta el script PowerShell (Windows):

```powershell
.\run_newman_runner.ps1
```

O ejecuta Newman directamente:

```bash
newman run YA_postman_collection_runner.json --delay-request 60000 --verbose
```

Notas:
- El script usa un `delay-request` global de 60000 ms (1 minuto) entre cada request.
- Asegúrate de que el servidor Node esté corriendo en `http://localhost:10000` antes de ejecutar el runner.
- La colección usa las credenciales de `mesero2@gmail.com` con contraseña `2`.
