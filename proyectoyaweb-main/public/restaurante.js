document.addEventListener('DOMContentLoaded', () => {

    // 1. FUNCIÓN DE SEGURIDAD (ESCAPE HTML)
    function escapeHTML(str) {
        if (!str && str !== 0) return ''; 
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    console.log("Iniciando Sistema de Restaurante Final (Seguro + Límites)...");

    async function verificarAccesoDashboard() {
        try {
            const respuesta = await fetch('/api/auth/status', {credentials: 'include'});
            if (!respuesta.ok) {
                 // window.location.href = '/index.html';
                 console.log('⚠️ No autenticado - modo desarrollo');
                 return;
            }
            
            const data = await respuesta.json();
            
            if (data.rol === 'cocinero') {
                window.location.href = '/cocina.html';
                return;
            }
            if (data.rol === 'mesero') {
                window.location.href = '/mesero.html';
                return;
            }
            
            console.log('✅ Sesión de dueño activa verificada.');
            
        } catch (error) {
            console.error('Error verificando sesión en dashboard:', error);
            // window.location.href = '/index.html';
            console.log('⚠️ Modo desarrollo - sin redireccionamiento');
        }
    }
    verificarAccesoDashboard();

    // ==========================================
    // 2. REFERENCIAS DOM (GLOBALES)
    // ==========================================
    const getEl = (id) => document.getElementById(id);

    // Navegación
    const enlacesMenu = document.querySelectorAll('.menu a');
    const paneles = document.querySelectorAll('.panelContenido');
    const panelBienvenida = getEl('panelBienvenida');
    const botonSalir = document.querySelector('.botonSalir');

    // Módulos Específicos
    const panelPedidosCompletados = getEl('panelPedidosCompletados');
    const listaPedidosCompletados = getEl('listaPedidosCompletados');
    const detallePedidoCompletado = getEl('detallePedidoCompletado');
    const btnVolverALista = getEl('btnVolverALista');
    const btnArchivarTodos = getEl('btnArchivarTodos');
    const btnExportarQR = getEl('btnExportarQR');

    // Finanzas DOM
    const listaFinanzasDias = getEl('listaFinanzasDias');
    const modalDetalleFinanzas = getEl('modalDetalleFinanzas');
    const btnRegistrarGastoExtra = getEl('btnRegistrarGastoExtra');
    // const btnConfigurarGastosFijos se maneja más abajo en su lógica específica
    const btnEjecutarComparacion = getEl('btnEjecutarComparacion');
    const btnCerrarFinanzas = getEl('btnCerrarFinanzas');
    const modalGastoExtra = getEl('modalGastoExtra');
    const formEgresoRapido = getEl('formEgresoRapido');
    const btnCancelarGasto = getEl('btnCancelarGasto');

    // Modal CRUD Principal
    const modal = getEl('modal');
    const tituloModal = getEl('tituloModal');
    const formulario = getEl('formulario');
    const camposDinamicos = getEl('camposDinamicos');
    const botonCancelar = modal ? modal.querySelector('.botonCancelar') : null;    

    // --- ESTADO DE LA APLICACIÓN ---
    let seccionActiva = null;
    let itemSeleccionadoId = null;
    let modoFormulario = 'agregar';
    let filaSeleccionada = null;
    let ingredientesDisponibles = []; 
    let nominaDiariaGlobal = 0;
    let datosFinanzasCache = [];

    // Validar integridad del HTML
    if(!modal) console.error("⚠️ FATAL: No se encontró el #modal en el HTML.");
    if(!formulario) console.error("⚠️ FATAL: No se encontró el #formulario en el HTML.");

    // ==========================================
    // 3. CACHÉ DE INGREDIENTES (Para Recetas)
    // ==========================================
    async function cargarIngredientesCache() {
        try {
            const respuesta = await fetch('/api/ingredientes', { credentials: 'include' });
            if (!respuesta.ok) throw new Error('No se pudieron cargar ingredientes');
            ingredientesDisponibles = await respuesta.json();
            console.log(`📦 ${ingredientesDisponibles.length} ingredientes cargados en caché.`);
        } catch (error) {
            console.error(error);
        }
    }
    cargarIngredientesCache();

    // ==========================================
    // 4. LÓGICA DE NAVEGACIÓN (MENÚ)
    // ==========================================
    enlacesMenu.forEach(enlace => {
        enlace.addEventListener('click', (evento) => {
            evento.preventDefault();
            seccionActiva = enlace.dataset.seccion;
            const targetId = enlace.dataset.target;
            
            // 1. Limpieza de UI
            itemSeleccionadoId = null;
            filaSeleccionada = null;
            enlacesMenu.forEach(link => link.classList.remove('activo'));
            enlace.classList.add('activo');
            
            // 2. Ocultar todos los paneles
            if(panelBienvenida) panelBienvenida.classList.add('oculto');
            paneles.forEach(panel => panel.classList.add('oculto'));
            
            // 3. Mostrar panel objetivo
            const panelAMostrar = getEl(targetId);
            if (panelAMostrar) {
                panelAMostrar.classList.remove('oculto');
                
                // 4. Cargar datos específicos según la sección
                console.log(`Navegando a sección: ${seccionActiva}`);
                if (seccionActiva === 'pedidos_completados') {
                    cargarPedidosCompletados(); 
                } else if (seccionActiva === 'finanzas') {
                      cargarFinanzas(); 
                } else {
                      // Productos, Ingredientes, Empleados, Mesas
                      cargarDatos(seccionActiva);
                }
            } else {
                console.error(`No se encontró el panel con ID: ${targetId}`);
            }
        });
    });

    // ==========================================
    // 5. FUNCIÓN GENÉRICA PARA CARGAR DATOS (CRUD)
    // ==========================================
    async function cargarDatos(seccion) {
        const panel = document.querySelector(`.panelContenido[data-seccion="${seccion}"]`);
        if(!panel) return;
        const cuerpoTabla = panel.querySelector('tbody');
        if(!cuerpoTabla) return; 

        cuerpoTabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando datos...</td></tr>';
        deshabilitarBotones(panel);

        try {
            const respuesta = await fetch(`/api/${seccion}`, { credentials: 'include' });
            if (respuesta.status === 401) return window.location.href = '/index.html';
            if (!respuesta.ok) throw new Error('Error en la API');

            const datos = await respuesta.json();
            cuerpoTabla.innerHTML = '';

            // Actualizar caché si estamos en ingredientes
            if(seccion === 'ingredientes') ingredientesDisponibles = datos;

            datos.forEach(item => {
                const fila = document.createElement('tr');
                let itemId, innerHTML;

                // --- RENDERIZADO POR TIPO ---
                if (seccion === 'productos') {
                    itemId = item.id_producto;
                    fila.dataset.productosData = JSON.stringify(item);
                    innerHTML = `
                        <td>${escapeHTML(item.nombre)}</td>
                        <td>${escapeHTML(item.tipo)}</td>
                        <td>${escapeHTML(item.descripcion || '-')}</td>
                        <td>$${parseFloat(item.precio_venta).toFixed(2)}</td>`;

                } else if (seccion === 'ingredientes') {
                    itemId = item.id_ing;
                    
                    let totalNeto = `${parseFloat(item.cantidad_disponible).toFixed(2)} ${escapeHTML(item.unidad_medida)}`;
                    let stockVisual = '';

                    if(parseFloat(item.cantidad_por_unidad) > 1) {
                        const envasesExactos = parseFloat(item.cantidad_disponible) / parseFloat(item.cantidad_por_unidad);
                        const envasesTotales = Math.ceil(envasesExactos);
                        
                        stockVisual = `${envasesTotales} envases`;
                    } else {
                        stockVisual = `${parseFloat(item.cantidad_disponible).toFixed(0)} pzas`;
                    }

                    fila.dataset.ingredientesData = JSON.stringify(item);
                    
                    innerHTML = `
                        <td style="font-weight:500">${escapeHTML(item.nombre_ing)}</td>
                        <td>${escapeHTML(item.unidad_medida)}</td>
                        <td style="color:#555;">${totalNeto}</td>
                        <td style="font-weight:bold; color: var(--primaryblue); font-size: 1.1em;">${escapeHTML(stockVisual)}</td>`;

                } else if (seccion === 'empleados') {
                    itemId = item.id_empleado;
                    fila.dataset.empleadosData = JSON.stringify(item);
                      innerHTML = `
                        <td>${escapeHTML(item.nombre_empleado)}</td>
                        <td>${escapeHTML(item.rol)}</td>
                        <td>$${parseFloat(item.sueldo).toFixed(2)}</td>`;
                
                } else if (seccion === 'mesas') {
                    itemId = item.id_mesa;
                    fila.dataset.mesasData = JSON.stringify(item);
                    const estadoClass = item.estado === 'ocupada' ? 'color:red; font-weight:bold;' : 'color:green; font-weight:bold;';
                    innerHTML = `
                        <td style="font-size:1.1em;">${escapeHTML(item.numero_mesa)}</td>
                        <td style="${estadoClass}">${escapeHTML(item.estado ? item.estado.toUpperCase() : '')}</td>
                        <td style="font-family:monospace; font-size:1.2em;">${escapeHTML(item.codigo_sesion || '-')}</td>`;
                }
                
                fila.dataset.id = itemId;
                fila.innerHTML = innerHTML;
                cuerpoTabla.appendChild(fila);
            });

        } catch (error) {
            console.error(`Error cargando ${seccion}:`, error);
            cuerpoTabla.innerHTML = `<tr><td colspan="5" style="color:red;">Error cargando datos.</td></tr>`;
        }
    }

    // ==========================================
    // 6. INTERACCIÓN CON TABLAS (SELECCIÓN)
    // ==========================================
    document.querySelectorAll('.tablaDatos tbody').forEach(tbody => {
        tbody.addEventListener('click', (e) => {
            const fila = e.target.closest('tr');
            if (!fila) return;

            const panelActual = fila.closest('.panelContenido');
            const seccion = panelActual.dataset.seccion;
            if (seccion !== seccionActiva) return;

            if (filaSeleccionada) filaSeleccionada.classList.remove('seleccionado');
            
            fila.classList.add('seleccionado');
            filaSeleccionada = fila;
            itemSeleccionadoId = fila.dataset.id;
            
            habilitarBotones(panelActual);
        });
    });

    function habilitarBotones(panel) {
        const btnEditar = panel.querySelector('.botonEditar');
        if(btnEditar) btnEditar.disabled = false;
        
        const btnEliminar = panel.querySelector('.botonEliminar');
        if(btnEliminar) btnEliminar.disabled = false;

        // Nuevo botón de Lotes
        const btnLotes = panel.querySelector('#btnGestionarLotes');
        if(btnLotes) btnLotes.disabled = false;
    }
    
    function deshabilitarBotones(panel) {
        if (!panel) return;
        const btnEditar = panel.querySelector('.botonEditar');
        if(btnEditar) btnEditar.disabled = true;
        
        const btnEliminar = panel.querySelector('.botonEliminar');
        if(btnEliminar) btnEliminar.disabled = true;

        // Nuevo botón de Lotes
        const btnLotes = panel.querySelector('#btnGestionarLotes');
        if(btnLotes) btnLotes.disabled = true;

        if (filaSeleccionada) {
            filaSeleccionada.classList.remove('seleccionado');
            filaSeleccionada = null;
        }
        itemSeleccionadoId = null;
    }

    // ==========================================
    // 7. BOTONES CRUD (AGREGAR, EDITAR, ELIMINAR)
    // ==========================================

    // AGREGAR
    document.querySelectorAll('.botonAgregar').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const panel = e.target.closest('.panelContenido');
            const seccion = panel.dataset.seccion;
            if (seccion !== seccionActiva) return;
            
            modoFormulario = 'agregar';
            tituloModal.textContent = `Agregar ${seccion}`;
            
            // Restaurar el botón de guardar por si fue ocultado por el modal de gastos fijos
            const btnGuardarPrincipal = formulario.querySelector('button[type="submit"]');
            if(btnGuardarPrincipal) btnGuardarPrincipal.style.display = 'block';

            if(formulario) formulario.reset();

            generarCamposModal(seccion);
            if(modal) modal.classList.remove('oculto');
        });
    });

    // EDITAR
    document.querySelectorAll('.botonEditar').forEach(boton => {
        boton.addEventListener('click', (e) => {
            if (!itemSeleccionadoId || !filaSeleccionada) return;
            const panel = e.target.closest('.panelContenido');
            const seccion = panel.dataset.seccion;
            if (seccion !== seccionActiva) return;
            
            modoFormulario = 'editar';
            tituloModal.textContent = `Editar ${seccion}`;

            // Restaurar el botón de guardar por si fue ocultado
            const btnGuardarPrincipal = formulario.querySelector('button[type="submit"]');
            if(btnGuardarPrincipal) btnGuardarPrincipal.style.display = 'block';
            
            const datos = JSON.parse(filaSeleccionada.dataset[seccion + 'Data']);
            generarCamposModal(seccion, datos);
            if(modal) modal.classList.remove('oculto');
        });
    });

    // ELIMINAR
    document.querySelectorAll('.botonEliminar').forEach(boton => {
        boton.addEventListener('click', async (e) => {
            if (e.target.id === 'btnArchivarTodos' || e.target.closest('#btnArchivarTodos')) return;

            if (!itemSeleccionadoId) return;
            const panel = e.target.closest('.panelContenido');
            const seccion = panel.dataset.seccion;

            if (confirm(`¿Estás seguro de eliminar este elemento?`)) {
                try {
                    const respuesta = await fetch(`/api/${seccion}/${itemSeleccionadoId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    if (!respuesta.ok) throw new Error('No se pudo eliminar.');
                    
                    cargarDatos(seccion);
                    if (seccion === 'ingredientes') await cargarIngredientesCache();

                } catch (error) {
                    console.error('Error al eliminar:', error);
                    alert('Error al eliminar. Puede tener dependencias.');
                }
            }
        });
    });

    async function generarCamposModal(seccion, datos = {}) {
        if(!camposDinamicos) return;
        camposDinamicos.innerHTML = '';

        // *** APLICACIÓN DE LÍMITES Y ATRIBUTOS MIN/MAX ***
        if (seccion === 'productos') {
            camposDinamicos.innerHTML = `
                <label>Nombre:</label>
                <input type="text" name="nombre" value="${escapeHTML(datos.nombre || '')}" required>
                <label>Descripción:</label>
                <textarea name="descripcion">${escapeHTML(datos.descripcion || '')}</textarea>
                <label>Precio:</label>
                <input type="number" name="precio_venta" step="0.01" min="1" max="10000" value="${datos.precio_venta || ''}" required>
                <label>Tipo:</label>
                <select name="tipo" required>
                    <option value="platillo" ${datos.tipo === 'platillo' ? 'selected' : ''}>Platillo</option>
                    <option value="bebida" ${datos.tipo === 'bebida' ? 'selected' : ''}>Bebida</option>
                    <option value="postre" ${datos.tipo === 'postre' ? 'selected' : ''}>Postre</option>
                </select>
                
                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="margin:0; font-size:1.1em; color:var(--primaryblue);">Receta</h3>
                    <button type="button" class="boton" id="btnAnadirIngrediente" style="padding: 5px 10px; font-size: 0.85em;">+ Ingrediente</button>
                </div>

                <div id="contenedorReceta" style="max-height: 150px; overflow-y: auto; padding-right: 5px; margin-bottom: 15px; border: 1px solid #f0f0f0; border-radius: 5px; padding: 10px;"></div>
            `;

            const contenedorReceta = getEl('contenedorReceta');
            const opcionesSelect = ingredientesDisponibles.map(ing => 
                `<option value="${ing.id_ingrediente}">${escapeHTML(ing.nombre_ing)} (${escapeHTML(ing.unidad_medida)})</option>`
            ).join('');

            const anadirFilaReceta = (ingredienteReceta = {}) => {
                const divFila = document.createElement('div');
                divFila.classList.add('filaReceta');
                divFila.style.cssText = "display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f9f9f9;";

                // Límite en receta también (Min 0.01, Max 5000)
                divFila.innerHTML = `
                    <select class="receta_id_ingrediente" style="flex: 2; margin: 0; padding: 5px;" required>
                        <option value="">-- Seleccionar --</option>
                        ${opcionesSelect}
                    </select>
                    <input type="number" class="receta_cantidad" placeholder="Cant." value="${ingredienteReceta.cantidad_usada || ''}" step="0.01" min="0.01" max="5000" style="flex: 1; margin: 0; padding: 5px;" required>
                    <button type="button" class="btnQuitarIngrediente" style="background: #e74c3c; color: white; border: none; width: 30px; height: 30px; border-radius: 5px;">X</button>
                `;

                if (ingredienteReceta.id_ingrediente) {
                    divFila.querySelector('.receta_id_ingrediente').value = ingredienteReceta.id_ingrediente;
                }

                divFila.querySelector('.btnQuitarIngrediente').addEventListener('click', () => divFila.remove());
                contenedorReceta.appendChild(divFila);
                contenedorReceta.scrollTop = contenedorReceta.scrollHeight;
            };

            getEl('btnAnadirIngrediente').addEventListener('click', () => anadirFilaReceta());

            if (modoFormulario === 'editar' && datos.id_producto) {
                try {
                    const res = await fetch(`/api/recetas/${datos.id_producto}`, { credentials: 'include' });
                    if(res.ok) {
                        const recetaExistente = await res.json();
                        recetaExistente.forEach(item => anadirFilaReceta(item));
                    }
                } catch(e) { console.error(e); }
            } else {
                anadirFilaReceta();
            }

        } else if (seccion === 'ingredientes') {
             let costoCaja = '';
             if (datos.costo_ing && datos.cantidad_por_unidad) {
                costoCaja = (parseFloat(datos.costo_ing) * parseFloat(datos.cantidad_por_unidad)).toFixed(2);
             }

            camposDinamicos.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label>Nombre del Insumo:</label>
                        <input type="text" name="nombre" value="${escapeHTML(datos.nombre_ing || '')}" required>
                    </div>
                    <div>
                        <label>Unidad de Medida (Uso):</label>
                        <select name="unidad_medida" required>
                            <option value="gr" ${datos.unidad_medida === 'gr' ? 'selected' : ''}>Gramos</option>
                            <option value="ml" ${datos.unidad_medida === 'ml' ? 'selected' : ''}>Mililitros</option>
                            <option value="pza" ${datos.unidad_medida === 'pza' ? 'selected' : ''}>Piezas</option>
                        </select>
                    </div>
                </div>

                <div style="background:#f0f4f8; padding:15px; margin-top:10px; border-radius:8px; border:1px solid #dae1e7;">
                    <h4 style="margin-top:0; color:var(--primaryblue); margin-bottom:10px;">
                        <ion-icon name="cube-outline"></ion-icon> Configuración del Envase
                    </h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>Contenido por Envase:</label>
                            <input type="number" name="cantidad_por_unidad" value="${datos.cantidad_por_unidad || 1}" step="0.01" min="0.1" max="5000" required>
                        </div>
                        <div>
                            <label>Costo del Envase ($):</label>
                            <input type="number" name="costo_compra" value="${costoCaja}" step="0.01" min="0" max="50000" required>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <label style="font-weight:bold; color: var(--primaryorange);">Días de Caducidad (Promedio):</label>
                        <input type="number" name="dias_caducidad_estimado" value="${datos.dias_caducidad_estimado || 15}" min="1" max="365" required>
                        <small style="color:#7f8c8d; display:block; margin-top:5px;">* ¿Cuántos días dura este producto normalmente desde que lo compras? Esto ayudará a la IA a predecir fechas.</small>
                    </div>
                </div>`;

        } else if (seccion === 'empleados') {
            camposDinamicos.innerHTML = `
                <label>Nombre:</label><input type="text" name="nombre_empleado" value="${escapeHTML(datos.nombre_empleado || '')}" required>
                <label>Rol:</label>
                <select name="rol" required>
                    <option value="Cocinero" ${datos.rol === 'Cocinero' ? 'selected' : ''}>Cocinero</option>
                    <option value="Mesero" ${datos.rol === 'Mesero' ? 'selected' : ''}>Mesero</option>
                    <option value="Cajero" ${datos.rol === 'Cajero' ? 'selected' : ''}>Cajero</option>
                </select>
                <label>Sueldo Diario:</label><input type="number" name="sueldo" value="${datos.sueldo || ''}" min="1" max="10000" required>
            `;
        } else if (seccion === 'mesas') {
            camposDinamicos.innerHTML = `
                <label>Identificador de Mesa:</label>
                <input type="text" name="numero_mesa" value="${escapeHTML(datos.numero_mesa || '')}" placeholder="Ej. Mesa 1, Barra 2" required>
            `;
        }
    }

    // ==========================================
    // 9. ENVÍO DE FORMULARIO (POST/PUT)
    // ==========================================
    if(formulario) formulario.addEventListener('submit', async (e) => {
        // Ignorar si el botón principal está oculto (caso Gastos Fijos)
        const btnMain = formulario.querySelector('button[type="submit"]');
        if(btnMain && btnMain.style.display === 'none') return;

        e.preventDefault();
        const formData = new FormData(formulario);
        const datos = Object.fromEntries(formData.entries());
        
        if (seccionActiva === 'productos') {
            datos.receta = [];
            document.querySelectorAll('.filaReceta').forEach(fila => {
                const id = fila.querySelector('.receta_id_ingrediente').value;
                const cant = fila.querySelector('.receta_cantidad').value;
                if (id && cant) datos.receta.push({ id_ingrediente: parseInt(id), cantidad_usada: parseFloat(cant) });
            });
        }

        let url = `/api/${seccionActiva}`;
        let method = 'POST';
        if (modoFormulario === 'editar') {
            url += `/${itemSeleccionadoId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(datos)
            });
            if (!res.ok) throw new Error('Error al guardar.');

            modal.classList.add('oculto');
            cargarDatos(seccionActiva);
            if (seccionActiva === 'ingredientes') await cargarIngredientesCache();

        } catch (error) {
            console.error(error);
            alert('Error al guardar los datos (Ver consola).');
        }
    });

    if(botonCancelar) botonCancelar.addEventListener('click', () => {
        modal.classList.add('oculto');
        // Restaurar botón principal al cerrar por si acaso
        const btnMain = formulario.querySelector('button[type="submit"]');
        if(btnMain) btnMain.style.display = 'block';
    });

   // --- VARIABLES GLOBALES PARA GRÁFICAS ---
    let chartVentasInstancia = null;
    let chartCocinaInstancia = null;
    let chartMesasInstancia = null;

    async function cargarFinanzas() {
        if(!listaFinanzasDias) return;
        listaFinanzasDias.innerHTML = '<p style="text-align:center;">Cargando panel financiero...</p>';
        
        try {
            // Pedimos los datos del nuevo dashboard y el historial al mismo tiempo para mayor velocidad
            const [resDashboard, resResumen] = await Promise.all([
                fetch('/api/finanzas/dashboard', { credentials: 'include' }),
                fetch('/api/finanzas/resumen', { credentials: 'include' })
            ]);

            if(!resDashboard.ok || !resResumen.ok) throw new Error("Error obteniendo datos financieros");
            
            const dashboard = await resDashboard.json();
            const dias = await resResumen.json();
            
            console.log('Dashboard data:', dashboard);
            console.log('Meseros data:', dashboard.meseros);
            
            datosFinanzasCache = dias;
            
            // 1. Llenar KPIs
            llenarKPIs(dashboard.kpis);
            
            // 2. Llenar Métricas Operativas
            llenarOperativa(dashboard.operativa);
            llenarEficienciaMeseros(dashboard.meseros || []);
            
            // 3. Dibujar Gráficas
            renderizarGraficaVentas(dashboard.grafica7Dias);
            renderizarGraficasEficiencia(dashboard.operativa);

            // 4. Llenar Historial Inferior y Comparador (Tu código original intacto)
            renderizarFinanzas(dias);
            llenarSelectoresComparacion(dias);

        } catch (error) {
            console.error('Error:', error);
            listaFinanzasDias.innerHTML = '<p style="color:red; text-align:center;">Error de conexión con el dashboard.</p>';
        }
    }

    function llenarKPIs(kpis) {
        const ingresosHoy = kpis.hoy.ingresos;
        const egresosHoy = kpis.hoy.egresos;
        const utilidadHoy = ingresosHoy - egresosHoy;

        getEl('kpiIngresos').textContent = `$${ingresosHoy.toFixed(2)}`;
        getEl('kpiEgresos').textContent = `$${egresosHoy.toFixed(2)}`;
        getEl('kpiUtilidad').textContent = `$${utilidadHoy.toFixed(2)}`;
        getEl('kpiOrdenes').textContent = kpis.hoy.ordenes;

        // Calcular Tendencias
        const calcTendencia = (hoy, ayer) => {
            if (ayer === 0) return hoy > 0 ? 100 : 0;
            return ((hoy - ayer) / ayer) * 100;
        };

        const tendIngresos = calcTendencia(ingresosHoy, kpis.ayer.ingresos);
        const tendEgresos = calcTendencia(egresosHoy, kpis.ayer.egresos);

        const spanTendIngresos = getEl('kpiIngresosTendencia');
        spanTendIngresos.textContent = `${Math.abs(tendIngresos).toFixed(1)}%`;
        spanTendIngresos.parentElement.style.color = tendIngresos >= 0 ? '#27ae60' : '#c0392b';

        const spanTendEgresos = getEl('kpiEgresosTendencia');
        spanTendEgresos.textContent = `${Math.abs(tendEgresos).toFixed(1)}%`;
        // En gastos, si suben es malo (rojo), si bajan es bueno (verde)
        spanTendEgresos.parentElement.style.color = tendEgresos <= 0 ? '#27ae60' : '#c0392b';
    }

    function llenarOperativa(operativa) {
        getEl('textoTiempoCocina').textContent = operativa.promedioCocinaMin;
        getEl('textoTiempoMesas').textContent = operativa.promedioMesaMin;

        getEl('platilloRapido').textContent = operativa.platilloRapido ? `${operativa.platilloRapido.nombre} (${operativa.platilloRapido.tiempo}m)` : 'Sin datos hoy';
        getEl('platilloLento').textContent = operativa.platilloLento ? `${operativa.platilloLento.nombre} (${operativa.platilloLento.tiempo}m)` : 'Sin datos hoy';
        
        const badgeCaducidad = getEl('ingredientesCaducidad');
        badgeCaducidad.textContent = `${operativa.lotesEnRiesgo} Lotes en riesgo`;
        badgeCaducidad.style.color = operativa.lotesEnRiesgo > 0 ? '#e74c3c' : '#27ae60';
    }
//eficiencia por mesero con num de pedidos atendidos y tiempo promedio de servicio
    function llenarEficienciaMeseros(meseros) {
        const contenedor = getEl('meseroEficienciaList');
        if (!contenedor) return;

        if (!meseros || meseros.length === 0) {
            contenedor.innerHTML = `<div style="grid-column:1/-1; padding: 20px; background: #f9f9f9; border-radius: 12px; text-align:center; color:#7f8c8d;">No hay meseros registrados para mostrar métricas.</div>`;
            return;
        }

        contenedor.innerHTML = meseros.map(mesero => `
            <div style="background: #ffffff; border: 1px solid #ecf0f1; border-radius: 12px; padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
                    <div>
                        <div style="font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.08em; color: #95a5a6;">Mesero</div>
                        <strong style="font-size: 1.05em; color: #2c3e50;">${escapeHTML(mesero.nombre)}</strong>
                    </div>
                    <span style="font-size: 0.75em; color: #7f8c8d; background:#ecf0f1; padding: 6px 10px; border-radius: 999px;">${escapeHTML(mesero.rol)}</span>
                </div>
                <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
                    <div style="background:#f8f9fa; border-radius: 10px; padding:14px; text-align:center;">
                        <div style="font-size:0.8em; color:#7f8c8d;">Pedidos atendidos hoy</div>
                        <div style="font-size:1.4em; font-weight:700; color:#2c3e50; margin-top:5px;">${mesero.pedidosAtendidosHoy}</div>
                    </div>
                    <div style="background:#f8f9fa; border-radius: 10px; padding:14px; text-align:center;">
                        <div style="font-size:0.8em; color:#7f8c8d;">Promedio de servicio</div>
                        <div style="font-size:1.4em; font-weight:700; color:#2c3e50; margin-top:5px;">${mesero.promedioServicioMin} min</div>
                    </div>
                </div>
                <div style="margin-top: 14px; font-size: 0.82em; color: #7f8c8d;">${escapeHTML(mesero.nota)}</div>
            </div>
        `).join('');
    }

    function renderizarGraficaVentas(datos7Dias) {
        const ctx = getEl('chartVentas');
        if(!ctx) return;

        if (chartVentasInstancia) chartVentasInstancia.destroy();

        // Extraer etiquetas y datos (asegurando el orden cronológico)
        const labels = datos7Dias.map(d => d.dia.slice(5)); // Solo mes y día
        const dataIngresos = datos7Dias.map(d => parseFloat(d.ingresos));
        const dataEgresos = datos7Dias.map(d => parseFloat(d.egresos));

        chartVentasInstancia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: dataIngresos,
                        backgroundColor: '#3498db',
                        borderRadius: 4
                    },
                    {
                        label: 'Egresos',
                        data: dataEgresos,
                        backgroundColor: '#e74c3c',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    function renderizarGraficasEficiencia(operativa) {
        const ctxCocina = getEl('chartEficienciaCocina');
        const ctxMesas = getEl('chartEficienciaMesas');

        if (chartCocinaInstancia) chartCocinaInstancia.destroy();
        if (chartMesasInstancia) chartMesasInstancia.destroy();

        // Parámetro visual: Asumimos que más de 45 min en cocina es "exceso" para llenar la dona
        const maxCocina = 45;
        const valorCocina = Math.min(operativa.promedioCocinaMin, maxCocina);

        if(ctxCocina) {
            chartCocinaInstancia = new Chart(ctxCocina, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [valorCocina, maxCocina - valorCocina],
                        backgroundColor: ['#f39c12', '#ecf0f1'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '80%', responsive: true, maintainAspectRatio: false, plugins: { tooltip: { enabled: false } } }
            });
        }

        // Parámetro visual: Asumimos que más de 90 min en mesa es "exceso"
        const maxMesa = 90;
        const valorMesa = Math.min(operativa.promedioMesaMin, maxMesa);

        if(ctxMesas) {
            chartMesasInstancia = new Chart(ctxMesas, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [valorMesa, maxMesa - valorMesa],
                        backgroundColor: ['#9b59b6', '#ecf0f1'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '80%', responsive: true, maintainAspectRatio: false, plugins: { tooltip: { enabled: false } } }
            });
        }
    }

    // MODIFICACIÓN: Renderizar Tarjetas Mini (Estilo Calendario)
    function renderizarFinanzas(dias) {
        listaFinanzasDias.innerHTML = '';
        
        listaFinanzasDias.style.display = 'grid';
        listaFinanzasDias.style.gridTemplateColumns = 'repeat(auto-fill, minmax(110px, 1fr))';
        listaFinanzasDias.style.gap = '15px';
        listaFinanzasDias.style.padding = '10px';

        if (dias.length === 0) {
            listaFinanzasDias.style.display = 'block';
            listaFinanzasDias.innerHTML = '<p style="text-align:center;">Iniciando sistema... no hay registros previos.</p>';
            return;
        }

        dias.forEach(dia => {
            const ingresos = parseFloat(dia.total_ingresos);
            const egresos = parseFloat(dia.total_egresos);
            const utilidad = ingresos - egresos;
            const esGanancia = utilidad >= 0;

            const fechaObj = new Date(dia.fecha);
            fechaObj.setMinutes(fechaObj.getMinutes() + fechaObj.getTimezoneOffset());
            const diaNum = fechaObj.getDate();
            const mes = fechaObj.toLocaleString('es-MX', { month: 'short' }).replace('.','');

            const card = document.createElement('div');
            card.style.cssText = `
                background-color: #fff;
                border-top: 5px solid ${esGanancia ? '#2ecc71' : '#e74c3c'};
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                padding: 15px 10px;
                text-align: center;
                cursor: pointer;
                transition: transform 0.2s;
            `;
            
            card.innerHTML = `
                <div style="font-size: 0.85em; color: #7f8c8d; text-transform: uppercase; letter-spacing:1px; margin-bottom:5px;">
                    ${diaNum} ${escapeHTML(mes)}
                </div>
                <div style="font-size: 1.4em; font-weight: bold; color: ${esGanancia ? '#27ae60' : '#c0392b'};">
                    $${Math.round(utilidad)}
                </div>
            `;

            card.onmouseover = () => card.style.transform = 'translateY(-3px)';
            card.onmouseout = () => card.style.transform = 'translateY(0)';
            card.onclick = () => verDetalleDia(dia.fecha, ingresos, egresos, utilidad);

            listaFinanzasDias.appendChild(card);
        });
    }

    function llenarSelectoresComparacion(dias) {
        const selA = getEl('fechaA');
        const selB = getEl('fechaB');
        if(!selA || !selB) return; 

        if(selA.tagName === 'SELECT') {
            const opts = dias.map(d => {
                const f = d.fecha.split('T')[0];
                return `<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`;
            }).join('');
            selA.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
            selB.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
        }
    }

    // Ver Detalle Día (Modal)
    async function verDetalleDia(fechaRaw, ingresos, egresosManuales, utilidad) {
        if(!modalDetalleFinanzas) return;
        listaFinanzasDias.classList.add('oculto');
        modalDetalleFinanzas.classList.remove('oculto');
        
        const fechaAPI = fechaRaw.split('T')[0]; 

        getEl('tituloDetalleFinanzas').textContent = `Corte del ${fechaAPI}`;
        getEl('detIngresos').textContent = `$${ingresos.toFixed(2)}`;
        getEl('detEgresos').textContent = `$${(egresosManuales + nominaDiariaGlobal).toFixed(2)}`;
        getEl('detUtilidad').textContent = `$${utilidad.toFixed(2)}`;

        const listaMov = getEl('listaMovimientosDia');
        listaMov.innerHTML = '<p>Cargando detalles...</p>';

        try {
            const res = await fetch(`/api/finanzas/detalle/${fechaAPI}`, { credentials: 'include' });
            const movimientos = await res.json();
            
            listaMov.innerHTML = '';
            
            if(nominaDiariaGlobal > 0) {
                const liNomina = document.createElement('li');
                liNomina.style.borderLeft = '4px solid #e74c3c';
                liNomina.style.backgroundColor = '#fff5f5';
                liNomina.style.padding = '10px';
                liNomina.style.marginBottom = '5px';
                liNomina.innerHTML = `<div style="display:flex; justify-content:space-between;"><span>Nómina/Fijos (Auto)</span> <span style="color:#e74c3c; font-weight:bold;">-$${nominaDiariaGlobal.toFixed(2)}</span></div>`;
                listaMov.appendChild(liNomina);
            }

            if(movimientos.length === 0 && nominaDiariaGlobal === 0) {
                listaMov.innerHTML = '<p>Sin movimientos registrados.</p>';
            } else {
                movimientos.forEach(mov => {
                    const li = document.createElement('li');
                    const esIngreso = mov.tipo === 'ingreso';
                    li.style.borderLeft = esIngreso ? '4px solid #2ecc71' : '4px solid #e74c3c';
                    li.style.padding = '10px';
                    li.style.backgroundColor = '#fff';
                    li.style.marginBottom = '5px';
                    
                    li.innerHTML = `
                        <div style="display:flex; justify-content:space-between;">
                            <span>${escapeHTML(mov.descripcion)}</span> 
                            <span style="color:${esIngreso ? '#27ae60' : '#e74c3c'}; font-weight:bold;">
                                ${esIngreso ? '+' : '-'}$${parseFloat(mov.monto).toFixed(2)}
                            </span>
                        </div>`;
                    listaMov.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
            listaMov.innerHTML = '<p>Error al obtener detalle.</p>';
        }
    }

    if(btnCerrarFinanzas) btnCerrarFinanzas.addEventListener('click', () => {
        modalDetalleFinanzas.classList.add('oculto');
        listaFinanzasDias.classList.remove('oculto');
    });

    if(btnRegistrarGastoExtra) btnRegistrarGastoExtra.addEventListener('click', () => {
        if(modalGastoExtra) modalGastoExtra.classList.remove('oculto');
    });

    if(btnCancelarGasto) btnCancelarGasto.addEventListener('click', () => {
        if(modalGastoExtra) modalGastoExtra.classList.add('oculto');
    });

    if(formEgresoRapido) formEgresoRapido.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descripcion = getEl('descEgreso').value;
        const monto = parseFloat(getEl('montoEgreso').value);
        
        // Validación lógica extra para Gastos Extras
        if (monto > 50000) {
            alert('El monto máximo para un gasto extra es de $50,000.');
            return;
        }

        try {
            const res = await fetch('/api/finanzas/egreso', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ descripcion, monto })
            });
            if(res.ok) {
                modalGastoExtra.classList.add('oculto');
                formEgresoRapido.reset();
                cargarFinanzas(); 
                alert('Gasto registrado con éxito.');
            }
        } catch(e) { console.error(e); }
    });

    if(btnEjecutarComparacion) btnEjecutarComparacion.addEventListener('click', () => {
        const fA = getEl('fechaA').value;
        const fB = getEl('fechaB').value;
        const resDiv = getEl('resultadoComparacion');

        if(!fA || !fB) return alert("Selecciona dos fechas.");

        const diaA = datosFinanzasCache.find(d => d.fecha.startsWith(fA));
        const diaB = datosFinanzasCache.find(d => d.fecha.startsWith(fB));

        if(!diaA || !diaB) {
            resDiv.innerHTML = '<span style="color:red">Datos insuficientes para comparar.</span>';
            return;
        }

        const utilidadA = parseFloat(diaA.total_ingresos) - (parseFloat(diaA.total_egresos) + nominaDiariaGlobal);
        const utilidadB = parseFloat(diaB.total_ingresos) - (parseFloat(diaB.total_egresos) + nominaDiariaGlobal);

        let diff = 0;
        if(utilidadA !== 0) diff = ((utilidadB - utilidadA) / Math.abs(utilidadA)) * 100;
        
        const esMejor = diff >= 0;
        
        resDiv.innerHTML = `
            <div style="padding:15px; background:${esMejor ? '#eafaf1' : '#fdedec'}; border:1px solid ${esMejor ? 'green' : 'red'}; border-radius:8px;">
                Diferencia: <b style="font-size:1.2em; color:${esMejor?'green':'red'}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}%</b><br>
                <small>($${utilidadB.toFixed(2)} vs $${utilidadA.toFixed(2)})</small>
            </div>
        `;
    });

    // ==========================================
    // 8. CONFIGURACIÓN DE GASTOS FIJOS (REPARADO)
    // ==========================================
    const btnConfigGastos = document.getElementById('btnConfigurarGastosFijos'); 
    
    if (btnConfigGastos) {
        btnConfigGastos.addEventListener('click', () => {
            abrirModalGastosFijos();
        });
    }

    async function abrirModalGastosFijos() {
        // 1. Ocultar el botón "Guardar" grande del modal (el del formulario principal)
        const btnGuardarPrincipal = formulario.querySelector('button[type="submit"]');
        if(btnGuardarPrincipal) btnGuardarPrincipal.style.display = 'none';

        // 2. Título
        tituloModal.textContent = "Configuración de Gastos Fijos";
        
        // 3. INYECTAR EL NUEVO DISEÑO HTML
        if(!camposDinamicos) return;
        
        camposDinamicos.innerHTML = `
            <div class="gastos-wrapper">
                
                <div class="gastos-form-card">
                    <div class="gastos-input-row">
                        <div class="input-group-item" style="flex: 2;">
                            <label>Concepto</label>
                            <input type="text" id="conceptoGasto" placeholder="Ej. Luz, Renta..." autocomplete="off">
                        </div>
                        
                        <div class="input-group-item" style="flex: 1.2;">
                            <label>Diario ($)</label>
                            <input type="number" id="montoGasto" placeholder="0.00" min="1" step="0.01">
                        </div>

                        <button type="button" id="btnGuardarGastoFijo" class="btn-add-fix" title="Agregar">
                            <ion-icon name="add-outline"></ion-icon>
                        </button>
                    </div>
                    <p style="margin: 8px 0 0 0; font-size: 0.75rem; color: #95a5a6; text-align: center;">
                        * Este monto se descontará automáticamente al abrir caja.
                    </p>
                </div>

                <div>
                    <div class="lista-header">GASTOS ACTIVOS</div>
                    <div id="listaGastosFijosContainer" class="lista-gastos-scroll">
                        <div style="padding: 20px; text-align: center; color: #aaa;">Cargando...</div>
                    </div>
                </div>
            </div>
        `;

        // 4. Mostrar el modal
        if(modal) modal.classList.remove('oculto');

        // ===========================================
        // LÓGICA (CARGAR, GUARDAR, BORRAR)
        // ===========================================

        // A. CARGAR LISTA
        const cargarLista = async () => {
            const container = document.getElementById('listaGastosFijosContainer');
            try {
                const res = await fetch('/api/finanzas/gastos-fijos');
                if(!res.ok) throw new Error("Error API");
                const lista = await res.json();

                if(lista.length === 0) {
                    container.innerHTML = `
                        <div class="estado-vacio">
                            <ion-icon name="wallet-outline"></ion-icon>
                            <span>No hay gastos configurados.</span>
                        </div>`;
                    return;
                }

                let html = '';
                lista.forEach(g => {
                    // CUIDADO AQUÍ: Usamos 'id_gasto_fijo' como viene de la BD
                    html += `
                        <div class="gasto-item-row">
                            <div class="gasto-nombre">
                                ${escapeHTML(g.concepto)}
                            </div>
                            <div class="gasto-acciones">
                                <span class="precio-negativo">-$${parseFloat(Math.abs(g.monto)).toFixed(2)}</span>
                                <button type="button" class="btn-trash btnEliminarGF" data-id="${g.id_gasto_fijo}">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>`;
                });
                container.innerHTML = html;

                // Eventos Borrar
                container.querySelectorAll('.btnEliminarGF').forEach(btn => {
                    btn.addEventListener('click', () => eliminarGastoFijo(btn.dataset.id));
                });

            } catch (e) {
                console.error(e);
                container.innerHTML = '<p style="color:red; text-align:center;">Error de conexión.</p>';
            }
        };

        // B. GUARDAR (Click en el botón +)
        const btnGuardar = document.getElementById('btnGuardarGastoFijo');
        if(btnGuardar) {
            btnGuardar.onclick = async () => {
                const conceptoInput = document.getElementById('conceptoGasto');
                const montoInput = document.getElementById('montoGasto');
                
                const concepto = conceptoInput.value.trim();
                const monto = parseFloat(montoInput.value);
                
                if(!concepto) return alert("Escribe un nombre para el gasto.");
                if(!monto || monto <= 0) return alert("El monto debe ser mayor a 0.");

                // Efecto visual de carga
                const iconoOriginal = btnGuardar.innerHTML;
                btnGuardar.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon>';
                btnGuardar.disabled = true;

                try {
                    const res = await fetch('/api/finanzas/gastos-fijos', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({concepto, monto })
                    });

                    if(res.ok) {
                        conceptoInput.value = '';
                        montoInput.value = '';
                        conceptoInput.focus(); // Regresar foco al input
                        cargarLista(); 
                    } else {
                        alert("Error al guardar.");
                    }
                } catch(e) { console.error(e); }
                
                // Restaurar botón
                btnGuardar.innerHTML = iconoOriginal;
                btnGuardar.disabled = false;
            };
        }

        // C. BORRAR
        const eliminarGastoFijo = async (id) => {
            if(!id || id === 'undefined') return alert("Error de ID. Recarga la página.");
            
            if(!confirm('¿Dejar de descontar este gasto diario?')) return;
            
            try {
                const res = await fetch(`/api/finanzas/gastos-fijos/${id}`, { method: 'DELETE' });
                if(res.ok) {
                    cargarLista();
                } else {
                    alert("No se pudo eliminar.");
                }
            } catch(e) { console.error(e); }
        };

        // Inicializar
        cargarLista();
    }

    async function cargarPedidosCompletados() {
        if(!listaPedidosCompletados) return;
        listaPedidosCompletados.classList.remove('oculto');
        if(detallePedidoCompletado) detallePedidoCompletado.classList.add('oculto');
        listaPedidosCompletados.innerHTML = '<p>Cargando historial...</p>';

        try {
            const res = await fetch('/api/pedidos/completados', { credentials: 'include' });
            const text = await res.text();
            let pedidos = [];
            try {
                pedidos = JSON.parse(text);
            } catch(e) {
                console.error("Respuesta inválida servidor:", text);
                listaPedidosCompletados.innerHTML = '<p style="color:red">Error del servidor al obtener historial.</p>';
                return;
            }

            listaPedidosCompletados.innerHTML = '';
            if(!Array.isArray(pedidos) || pedidos.length === 0) {
                listaPedidosCompletados.innerHTML = '<p>No hay historial disponible.</p>';
                return;
            }

            pedidos.forEach(p => {
                const div = document.createElement('div');
                div.classList.add('pedido-item');
                div.innerHTML = `
                    <h3>${escapeHTML(p.mesa)}</h3>
                    <p>Total: $${parseFloat(p.total_calculado).toFixed(2)}</p>
                    <small>${new Date(p.fecha_creacion).toLocaleString()}</small>
                `;
                div.onclick = () => mostrarDetallePedido(p.id_pedido);
                listaPedidosCompletados.appendChild(div);
            });
        } catch(e) { 
            console.error(e); 
            listaPedidosCompletados.innerHTML = '<p style="color:red">Error de conexión.</p>';
        }
    }

    async function mostrarDetallePedido(id) {
         if (!listaPedidosCompletados || !detallePedidoCompletado) return;
         
         listaPedidosCompletados.classList.add('oculto');
         detallePedidoCompletado.classList.remove('oculto');
         
         getEl('detallePedidoTitulo').textContent = 'Cargando...';
         getEl('detalleProductosLista').innerHTML = '';
         getEl('detalleIngredientesLista').innerHTML = '';

         try {
            const res = await fetch(`/api/pedidos/completados/${id}`, {credentials: 'include'});
            if (!res.ok) throw new Error('Error al cargar detalle');

            const data = await res.json();

            getEl('detallePedidoTitulo').textContent = `Pedido: ${data.info.mesa}`;
            getEl('detallePedidoTotal').innerHTML = `
                Total Cobrado: <b>$${parseFloat(data.info.total_calculado).toFixed(2)}</b><br>
                <small>Fecha: ${new Date(data.info.fecha_creacion).toLocaleString()}</small>
            `;

            const listaProd = getEl('detalleProductosLista');
            data.productos.forEach(prod => {
                const li = document.createElement('li');
                li.innerHTML = `${prod.cantidad}x ${escapeHTML(prod.nombre)} <span style="float:right">$${prod.precio_en_pedido}</span>`;
                listaProd.appendChild(li);
            });

            const listaIng = getEl('detalleIngredientesLista');
            if (data.ingredientes.length === 0) {
                listaIng.innerHTML = '<li style="color:#888">Sin descuento de inventario.</li>';
            } else {
                data.ingredientes.forEach(ing => {
                    const li = document.createElement('li');
                    li.style.borderLeft = "3px solid #e74c3c"; 
                    li.style.backgroundColor = "#fff5f5";
                    li.style.padding = "5px";
                    li.style.marginBottom = "5px";
                    li.innerHTML = `
                        <b>${escapeHTML(ing.nombre)}</b>
                        <span style="float:right; color:#c0392b">-${parseFloat(ing.total_gastado).toFixed(2)} ${escapeHTML(ing.unidad_medida)}</span>
                    `;
                    listaIng.appendChild(li);
                });
            }
         } catch(e) {
             console.error(e);
             alert('No se pudo cargar el detalle.');
             detallePedidoCompletado.classList.add('oculto');
             listaPedidosCompletados.classList.remove('oculto');
         }
    }

    if(btnVolverALista) btnVolverALista.addEventListener('click', () => {
        detallePedidoCompletado.classList.add('oculto');
        listaPedidosCompletados.classList.remove('oculto');
    });

    if(btnArchivarTodos) btnArchivarTodos.addEventListener('click', async () => {
        if(!confirm('¿Estás seguro de archivar todo el historial visual?')) return;
        await fetch('/api/pedidos/archivar-completados', { method: 'PUT', credentials: 'include' });
        cargarPedidosCompletados();
    });

    // ==========================================
    // 10. LÓGICA DEL ASISTENTE IA
    // ==========================================
    const formChatIA = getEl('formChatIA');
    const inputChatIA = getEl('inputChatIA');
    const chatBox = getEl('chatBox');
    const bienvenidaIA = getEl('bienvenidaIA');
    const btnEnviarIA = getEl('btnEnviarIA');

    if (formChatIA) {
        formChatIA.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mensaje = inputChatIA.value.trim();
            if (!mensaje) return;

            // 1. Eliminar bienvenida del DOM si es el primer mensaje
            if (bienvenidaIA) {
                bienvenidaIA.remove();
            }

            // 2. Renderizar mensaje del usuario
            agregarBurbujaChat(mensaje, 'usuario');
            inputChatIA.value = '';
            
            // 3. Bloquear input y mostrar que la IA está "pensando"
            inputChatIA.disabled = true;
            btnEnviarIA.disabled = true;
            const idPensando = agregarBurbujaChat("Pensando...", 'ia', true);

            try {
                // 4. Enviar a tu ruta backend existente
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ mensaje })
                });

                const data = await res.json();
                
                // 5. Quitar mensaje de "Pensando" y poner la respuesta real
                const burbujaPensando = getEl(idPensando);
                if (burbujaPensando) burbujaPensando.remove();

                if (res.ok) {
                    agregarBurbujaChat(data.respuesta, 'ia');
                } else {
                    agregarBurbujaChat("Error: " + (data.error || "No me pude conectar."), 'ia');
                }

            } catch (error) {
                console.error("Error en Chat IA:", error);
                const burbujaPensando = getEl(idPensando);
                if (burbujaPensando) burbujaPensando.remove();
                agregarBurbujaChat("Error de conexión con el servidor.", 'ia');
            } finally {
                // 6. Desbloquear input
                inputChatIA.disabled = false;
                btnEnviarIA.disabled = false;
                inputChatIA.focus();
            }
        });
    }

    function agregarBurbujaChat(texto, emisor, esTemporal = false) {
        const div = document.createElement('div');
        div.classList.add('mensaje-chat');
        div.classList.add(emisor === 'usuario' ? 'mensaje-usuario' : 'mensaje-ia');
        
        // Blindaje HTML para la respuesta
        div.innerHTML = escapeHTML(texto);
        
        // Si es el mensaje temporal de "pensando", le damos un ID para borrarlo luego
        if (esTemporal) {
            const tempId = 'temp-' + Date.now();
            div.id = tempId;
            // Un poco de estilo sutil para el estado de espera
            div.style.opacity = '0.6';
            div.style.fontStyle = 'italic';
        }

        chatBox.appendChild(div);
        
        // Auto-scroll hacia el final
        chatBox.scrollTop = chatBox.scrollHeight;
        
        return div.id;
    }

    if(btnExportarQR) btnExportarQR.addEventListener('click', () => {
        const canvas = getEl('qrCanvas');
        if(!canvas) return alert("Falta canvas QR en HTML");
        
        const dataApp = JSON.stringify({
            accion: 'cargar_menu',
            id_restaurante: 1,
            nombre: 'Restaurante YA',
            api_url: window.location.origin
        });

        if(typeof QRious === 'undefined') return alert("Librería QRious no cargada.");

        const qr = new QRious({
            element: canvas,
            value: dataApp,
            size: 500,
            background: 'white',
            foreground: 'black',
            level: 'H'
        });

        const link = document.createElement('a');
        link.download = 'QR-Restaurante.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    if(botonSalir) botonSalir.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/index.html';
    });
    // --- LÓGICA DE GESTIÓN DE LOTES ---
const btnGestionarLotes = document.getElementById('btnGestionarLotes');

if (btnGestionarLotes) {
    btnGestionarLotes.addEventListener('click', () => {
        if (!itemSeleccionadoId) return;
        abrirModalGestionLotes(itemSeleccionadoId);
    });
}

async function abrirModalGestionLotes(idIngrediente) {
    // 1. Preparar el Modal (Reutilizamos el modal principal pero cambiamos el contenido)
    const btnGuardarPrincipal = formulario.querySelector('button[type="submit"]');
    if (btnGuardarPrincipal) btnGuardarPrincipal.style.display = 'none'; // Ocultamos el guardar del CRUD normal

    const nombreIng = filaSeleccionada.querySelector('td:first-child').textContent;
    tituloModal.textContent = `Gestión de Lotes: ${nombreIng}`;
    camposDinamicos.innerHTML = '<p style="text-align:center;">Cargando información de inventario...</p>';
    modal.classList.remove('oculto');

    try {
        // 2. Obtener datos del ingrediente y sus lotes
        const res = await fetch(`/api/ingredientes/${idIngrediente}/detalle-completo`, { credentials: 'include' });
        if (!res.ok) throw new Error("Error al obtener detalles");
        const data = await res.json(); // { info: {...}, lotes: [...] }

        // 3. Dibujar la Interfaz de Lotes
        renderizarInterfazLotes(idIngrediente, data);

    } catch (e) {
        console.error(e);
        camposDinamicos.innerHTML = '<p style="color:red; text-align:center;">Error al conectar con el servidor.</p>';
    }
}

function renderizarInterfazLotes(id, data) {
    const { info, lotes } = data;
    
    // Generamos la tabla de lotes actuales
    let tablaLotesHTML = `
        <div style="margin-bottom:20px;">
            <h4 style="color:var(--primaryblue); border-bottom:1px solid #eee; padding-bottom:5px;">LOTES ACTIVOS EN COCINA</h4>
            <div style="max-height:200px; overflow-y:auto; border:1px solid #eee; border-radius:5px;">
                <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <thead style="background:#f9f9f9; position:sticky; top:0;">
                        <tr>
                            <th style="padding:8px; text-align:left;">Ingreso</th>
                            <th style="padding:8px; text-align:left;">Caducidad</th>
                            <th style="padding:8px; text-align:right;">Restante</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (lotes.length === 0) {
        tablaLotesHTML += `<tr><td colspan="3" style="padding:20px; text-align:center; color:#999;">No hay lotes disponibles. Registra una compra abajo.</td></tr>`;
    } else {
        lotes.forEach(l => {
            const fechaCad = new Date(l.fecha_caducidad).toLocaleDateString();
            const diasRestantes = Math.ceil((new Date(l.fecha_caducidad) - new Date()) / (1000 * 60 * 60 * 24));
            const colorCad = diasRestantes <= 3 ? 'color:#e74c3c; font-weight:bold;' : 'color:#27ae60;';
            
            tablaLotesHTML += `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:8px;">${new Date(l.fecha_compra).toLocaleDateString()}</td>
                    <td style="padding:8px; ${colorCad}">${fechaCad} (${diasRestantes}d)</td>
                    <td style="padding:8px; text-align:right;">${parseFloat(l.cantidad_actual).toFixed(1)} ${info.unidad_medida}</td>
                </tr>
            `;
        });
    }

    tablaLotesHTML += `</tbody></table></div></div>`;

    // Formulario de Nueva Entrada
    const formEntradaHTML = `
        <div style="background:#f0f4f8; padding:15px; border-radius:10px; border:1px solid #dae1e7;">
            <h4 style="margin-top:0; color:var(--primaryorange);">
                <ion-icon name="add-circle-outline"></ion-icon> REGISTRAR NUEVA COMPRA
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <label style="font-size:0.8em; font-weight:bold;">ENVASES:</label>
                    <input type="number" id="nuevosEnvases" placeholder="Ej. 5" style="width:100%; padding:8px; margin-top:5px;">
                </div>
                <div>
                    <label style="font-size:0.8em; font-weight:bold;">CADUCIDAD:</label>
                    <input type="date" id="nuevaCaducidad" style="width:100%; padding:8px; margin-top:5px;">
                </div>
            </div>
            <button type="button" id="btnGuardarLote" class="boton" style="width:100%; margin-top:15px; background:var(--primaryorange);">
                Añadir al Inventario
            </button>
        </div>
    `;

    camposDinamicos.innerHTML = tablaLotesHTML + formEntradaHTML;

    // Lógica del botón Guardar Lote
    document.getElementById('btnGuardarLote').onclick = async () => {
        const cant = document.getElementById('nuevosEnvases').value;
        const cad = document.getElementById('nuevaCaducidad').value;

        if (!cant || !cad) return alert("Por favor llena la cantidad y la fecha.");

        try {
            const res = await fetch(`/api/ingredientes/${id}/lotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ envases: cant, fecha_caducidad: cad }),
                credentials: 'include'
            });

            if (res.ok) {
                alert("Inventario actualizado correctamente.");
                modal.classList.add('oculto');
                cargarDatos('ingredientes'); // Recarga la tabla principal
            }
        } catch (e) { console.error(e); }
    };
}
});