document.addEventListener('DOMContentLoaded', () => {
    // 1. FUNCIÓN DE SEGURIDAD (Blindaje contra virus/XSS)
    function escapeHTML(str) {
        if (!str && str !== 0) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const listaMesas = document.getElementById('listaMesas');
    const botonSalir = document.querySelector('.botonSalir');

    // --- Verificar Sesión (Blindaje) ---
    async function verificarAcceso() {
        try {
            const res = await fetch('/api/auth/status', { credentials: 'include' });
            if (!res.ok) return window.location.href = '/index.html';
            
            const data = await res.json();
            
            if (data.rol === 'cocinero') {
                window.location.href = '/cocina.html';
                return;
            }
            if (data.rol === 'dueño') {
                // El dueño si quiere puede ver esto, pero idealmente tiene su dashboard
                window.location.href = '/restaurante.html'; 
                return;
            }
            // Si es mesero, continuamos
        } catch (e) { window.location.href = '/index.html'; }
    }
    verificarAcceso();
    cargarMesas();

    // --- Cargar Mesas ---
    async function cargarMesas() {
        try {
            const res = await fetch('/api/mesas', { credentials: 'include' });
            const mesas = await res.json();
            renderizarMesas(mesas);
        } catch (error) {
            console.error(error);
            listaMesas.innerHTML = '<p>Error al cargar mesas. Revisa tu conexión.</p>';
        }
    }

    function renderizarMesas(mesas) {
        listaMesas.innerHTML = '';
        if (mesas.length === 0) {
            listaMesas.innerHTML = '<p>No hay mesas configuradas.</p>';
            return;
        }

        mesas.forEach(mesa => {
            const esOcupada = mesa.estado === 'ocupada';
            const card = document.createElement('div');
            card.classList.add('pedido-item'); 
            
            let iconoEstadoHTML = '';
            let claseAnimacion = '';
            let colorBorde = '#2ecc71'; // Verde (Libre) por defecto

            if (esOcupada) {
                // CASO 1: PIDIERON LA CUENTA (¡PRIORIDAD!)
                if (mesa.estado_pedido === 'por_pagar') {
                    claseAnimacion = 'parpadeo'; 
                    colorBorde = '#f39c12'; // Naranja Alerta
                    
                    // Texto claro y directo
                    if (mesa.metodo_pago === 'tarjeta') {
                        iconoEstadoHTML = `<div class="icono-estado tarjeta"><ion-icon name="card-outline"></ion-icon> PAGO CON TARJETA</div>`;
                    } else {
                        iconoEstadoHTML = `<div class="icono-estado efectivo"><ion-icon name="cash-outline"></ion-icon> PAGO EN EFECTIVO</div>`;
                    }
                } 
                // CASO 2: PEDIDO SERVIDO (Comiendo)
                // Aquí usamos 'completado' de la BD pero mostramos 'SERVIDO' o 'DISFRUTANDO'
                else if (mesa.estado_pedido === 'completado') {
                    colorBorde = '#3498db'; // Azul calmado
                    iconoEstadoHTML = `<div class="icono-estado ok" style="background-color:#3498db;"><ion-icon name="restaurant-outline"></ion-icon> COMIENDO</div>`;
                }
                // CASO 3: EN COCINA (Esperando)
                else {
                    colorBorde = '#e74c3c'; // Rojo (Ocupado/Cocinando)
                    iconoEstadoHTML = `<div class="icono-estado reloj"><ion-icon name="time-outline"></ion-icon> COCINANDO...</div>`;
                }
            }
            
            card.style.borderLeft = `8px solid ${colorBorde}`;
            if (claseAnimacion) card.classList.add(claseAnimacion);

            // AQUI SE APLICA EL BLINDAJE CON escapeHTML
            card.innerHTML = `
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="font-size: 2em; margin:0; color: #2c3e50;">${escapeHTML(mesa.numero_mesa)}</h3>
                </div>

                <div style="display:flex; justify-content:center; margin-bottom: 15px;">
                    ${esOcupada ? iconoEstadoHTML : '<div style="color:#2ecc71; font-weight:bold;">LIBRE</div>'}
                </div>

                ${esOcupada ? `
                    <div style="background: #f4f6f7; padding: 10px; border-radius: 8px; text-align: center;">
                        <span style="display:block; font-size: 0.8em; color: #7f8c8d; letter-spacing: 1px;">CÓDIGO CLIENTE</span>
                        <span style="font-size: 1.8em; font-weight: bold; color: #333; letter-spacing: 3px;">${escapeHTML(mesa.codigo_sesion)}</span>
                    </div>
                    <button class="boton botonEliminar btnLiberar" data-id="${mesa.id_mesa}" style="width: 100%; margin-top: 15px; padding: 12px; font-size: 1em;">
                        <ion-icon name="lock-open-outline"></ion-icon> Liberar
                    </button>
                ` : `
                    <button class="boton botonAgregar btnOcupar" data-id="${mesa.id_mesa}" style="width: 100%; padding: 15px; margin-top: auto;">
                        <ion-icon name="key-outline"></ion-icon> Ocupar
                    </button>
                `}
            `;
            listaMesas.appendChild(card);
        });
    }
    // --- Eventos ---
    listaMesas.addEventListener('click', async (e) => {
        // Usamos closest para asegurar que detecte el clic aunque le den al icono
        const btnOcupar = e.target.closest('.btnOcupar');
        const btnLiberar = e.target.closest('.btnLiberar');

        if (btnOcupar) {
            const id = btnOcupar.dataset.id;
            if(!confirm('¿Generar código y ocupar esta mesa?')) return;
            await accionMesa(id, 'ocupar');
        }
        
        if (btnLiberar) {
            const id = btnLiberar.dataset.id;
            if(!confirm('¿Estás seguro de liberar la mesa? Esto cerrará la sesión del cliente.')) return;
            await accionMesa(id, 'liberar');
        }
    });

    async function accionMesa(id, accion) {
        try {
            const res = await fetch(`/api/mesas/${id}/${accion}`, { 
                method: 'POST',
                credentials: 'include'
            });
            
            if(res.ok) {
                cargarMesas(); // Recargar para ver cambios
            } else {
                alert('Error al procesar la acción');
            }
        } catch (e) { console.error(e); }
    }

    botonSalir.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/index.html';
    });

    // Auto recarga cada 10 segundos para mantener sincronizados a todos los meseros
    setInterval(cargarMesas, 10000);
});