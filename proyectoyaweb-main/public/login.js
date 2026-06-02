document.addEventListener('DOMContentLoaded', () => {
    // Referencias Gatekeeper
    const gatekeeperModal = document.getElementById('gatekeeperModal');
    const formGatekeeper = document.getElementById('formGatekeeper');
    const gatekeeperError = document.getElementById('gatekeeperError');
    
    // Referencias Login/Registro
    const signUpButton = document.getElementById('signUpBtn');
    const signInButton = document.getElementById('signInBtn');
    const container = document.getElementById('container');
    const formsesion = document.getElementById('formsesion');
    const formcuenta = document.getElementById('formcuenta');
    const loginerror = document.getElementById('loginerror');
    const registererror = document.getElementById('registererror');

    // --- 1. LÓGICA DEL GATEKEEPER ---
    
    // Función para manejar el envío del código
    formGatekeeper.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('inputCodigoRestaurante').value.trim();
        gatekeeperError.textContent = 'Verificando...';

        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo }),
                credentials: 'include' // Importante para guardar la cookie de sesión
            });

            const data = await res.json();

            if (res.ok) {
                gatekeeperModal.classList.add('oculto');
                const titulo = document.querySelector('.overlaypanel h1');
                if(titulo) titulo.innerText = "Bienvenido";
            } else {
                gatekeeperError.textContent = data.message || 'Código incorrecto.';
            }
        } catch (error) {
            console.error(error);
            gatekeeperError.textContent = 'Error de conexión.';
        }
    });

    async function verificarContextoInicial() {
        try {
            const res = await fetch('/api/auth/status', { credentials: 'include' });
            const data = await res.json();

            // Si ya está logueado como usuario, redirigir
            if (res.ok && data.loggedIn) {
                if (data.rol === 'dueño') window.location.href = '/restaurante.html';
                else if (data.rol === 'cocinero') window.location.href = '/cocina.html';
                else if (data.rol === 'mesero') window.location.href = '/mesero.html';
                return;
            } 
            
            
        } catch (e) {
            console.log("Esperando código de restaurante...");
        }
    }
    verificarContextoInicial();

    signUpButton.addEventListener('click', () => container.classList.add("rightpanelactive"));
    signInButton.addEventListener('click', () => container.classList.remove("rightpanelactive"));

    formcuenta.addEventListener('submit', async (e) => {
        e.preventDefault();
        registererror.textContent = '';
        registererror.style.color = 'red'; 
        
        const nombre = document.getElementById('registername').value.trim();
        const correo = document.getElementById('registeremail').value.trim();
        const contrasena = document.getElementById('registerpassword').value;
        const rol = document.getElementById('registerrol').value;


        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (nombre.length < 3 || !nombreRegex.test(nombre)) {
            registererror.textContent = 'El nombre solo debe contener letras (min 3).';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            registererror.textContent = 'El correo no parece real (falta @ o dominio).';
            return;
        }

        if (contrasena.length < 8) {
            registererror.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            return;
        }
        if (!/\d/.test(contrasena)) { 
            registererror.textContent = 'Agrega al menos un número a tu contraseña.';
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_usuario: nombre, correo_usuario: correo, contra: contrasena, rol: rol }),
                credentials: 'include'
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            alert('Usuario creado en este restaurante.');
            formcuenta.reset();
            container.classList.remove("rightpanelactive");
        } catch (error) {
            registererror.textContent = error.message;
        }
    });

    formsesion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('loginemail').value;
        const contrasena = document.getElementById('loginpassword').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo_usuario: correo, contra: contrasena }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.rol === 'dueño') window.location.href = '/restaurante.html';
            else if (data.rol === 'cocinero') window.location.href = '/cocina.html';
            else if (data.rol === 'mesero') window.location.href = '/mesero.html';

        } catch (error) {
            loginerror.textContent = error.message;
        }
    });
});