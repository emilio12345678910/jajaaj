# Instrucciones para usar la colección Postman

## 1. Importar la colección
1. Abre Postman.
2. Haz clic en **Import**.
3. Selecciona **File** y elige `postman/YA_postman_collection.json`.
4. Importa la colección.

> Esto carga todos los requests en un solo grupo. No tienes que pegarlos uno por uno.

## 2. Activar manejo de cookies
1. Ve a la esquina superior derecha y activa **Cookies** o asegúrate de que Postman guarde cookies.
2. En la pestaña **Cookies**, verifica que `localhost` pueda almacenar la cookie `sid`.

> El servidor usa sesiones en MySQL, así que es vital que Postman conserve `sid`.

## 3. Ejecutar el flujo
1. Abre la colección `Proyecto YA! - Simulación de flujo completo`.
2. Ejecuta los requests en orden:
   - `1 - Verificar restaurante`
   - `2 - Login dueño`
   - `3 - Ocupar mesa`
   - `4 - Obtener menú móvil`
   - `5 - Crear pedido móvil`
   - `6 - Marcar pedido en proceso`
   - `7 - Marcar pedido completado`
   - `8 - Pedir cuenta desde móvil`
   - `9 - Registrar pago final`
   - `10 - Liberar mesa`
   - `11 - Ver dashboard financiero`
3. Después de cada request, revisa la respuesta para confirmar que no hubo error.

## 4. Qué hace cada request
- **1 - Verificar restaurante**: valida el código `YaYoungFuture5`.
- **2 - Login dueño**: inicia sesión como `hola@gmail.com`.
- **3 - Ocupar mesa**: ocupa la mesa `7` y genera el PIN.
- **4 - Obtener menú móvil**: trae los productos disponibles.
- **5 - Crear pedido móvil**: crea un pedido con el PIN.
- **6 - Marcar pedido en proceso**: indica que la cocina comenzó la preparación.
- **7 - Marcar pedido completado**: marca el pedido como listo.
- **8 - Pedir cuenta desde móvil**: cambia el pedido a `por_pagar`.
- **9 - Registrar pago final**: marca el pedido como `inactivo` y registra `fecha_pago`.
- **10 - Liberar mesa**: libera la mesa y cierra la sesión.
- **11 - Ver dashboard financiero**: muestra el promedio de tiempo.

## 5. Simular 2 minutos
1. Ejecuta `5 - Crear pedido móvil`.
2. Espera 2 minutos reales.
3. Ejecuta `7 - Marcar pedido completado`.
4. Espera otros 2 minutos si quieres que el pago final ocurra aún más tarde.

> El promedio se calcula desde `fecha_creacion` hasta `fecha_pago`, por lo que puedes simular el tiempo con una espera real.

## 6. Si hay error
- Revisa el `response body` del request.
- Asegúrate de que el servidor esté corriendo en `http://localhost:10000`.
- Asegúrate de haber ejecutado `1` y `2` antes de `3`.

## Nota
Si quieres, también puedo generar una colección de Postman con un **runner** automático para ejecutar los 11 requests secuencialmente.
