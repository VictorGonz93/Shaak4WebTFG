// Funcion Menu Ofertas Especiales
document.addEventListener("DOMContentLoaded", () => {
    const topbar = document.querySelector(".topbar");
    const mainContainer = document.querySelector(".main-container");
    let isAnimating = false; // Variable para controlar si se está animando

    topbar.addEventListener("click", () => {
        if (isAnimating) return; // Si está animando, no hace nada
        isAnimating = true; // Bloquea hasta que termine la animación

        if (topbar.classList.contains("open")) {
            // Ocultar el topbar y desplazar el contenido hacia arriba
            topbar.classList.remove("open");
            topbar.classList.add("closing");
            mainContainer.classList.remove("shifted");
            mainContainer.classList.add("regressing");

            setTimeout(() => {
                topbar.classList.remove("closing");
                mainContainer.classList.remove("regressing");
                topbar.querySelector(".topbar-content").style.display = "none";
                isAnimating = false; // Desbloquea después de la animación
            }, 500); // Duración de la animación
        } else {
            // Mostrar el topbar y desplazar el contenido hacia abajo
            topbar.classList.add("open");
            mainContainer.classList.add("shifted");
            topbar.querySelector(".topbar-content").style.display = "block";

            setTimeout(() => {
                isAnimating = false; // Desbloquea después de la animación
            }, 500); // Duración de la animación
        }
    });
});

// *************** GESTIÓN DE IDIOMAS (dinámica con JSON) ******************
// Inicialización correcta al cargar página y cambio de idioma
document.addEventListener("DOMContentLoaded", () => {
    const languageIcons = document.querySelectorAll(".language-icon");
    const defaultLang = localStorage.getItem("preferredLanguage") || navigator.language.slice(0, 2) || "es";

    cargarIdioma(defaultLang);

    languageIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            const selectedLang = icon.getAttribute("data-lang");
            localStorage.setItem("preferredLanguage", selectedLang);
            cargarIdioma(selectedLang);
        });
    });

    document.querySelectorAll('.language-flag').forEach(flag => {
        flag.addEventListener('click', () => {
            document.querySelectorAll('.language-flag').forEach(f => f.classList.remove('selected'));
            flag.classList.add('selected');
            const lang = flag.querySelector('.language-icon').getAttribute('data-lang');
            localStorage.setItem("preferredLanguage", lang);
            cargarIdioma(lang);
        });
    });
});

// Función para cargar archivo JSON según idioma seleccionado
let langDataGlobal = {};

function cargarIdioma(lang) {
    fetch(`scripts/lang/${lang}.json`)
        .then(res => res.json())
        .then(data => {
            window.langDataGlobal = data;
            aplicarTraducciones(data);
            // Resalta la bandera activa SOLO en el div.language-flag
            document.querySelectorAll('.language-flag').forEach(flag => {
                const img = flag.querySelector('.language-icon');
                if (img && img.getAttribute('data-lang') === lang) {
                    flag.classList.add('selected');
                } else {
                    flag.classList.remove('selected');
                }
            });
            mostrarErrorPorParametro();
        });
}

// Función para aplicar traducciones en la página
function aplicarTraducciones(langData) {
    document.querySelectorAll("[data-lang]").forEach(elem => {
        const key = elem.getAttribute("data-lang");
        if (langData[key]) {
            elem.innerHTML = langData[key];
        }
    });

    document.querySelectorAll("[data-lang-placeholder]").forEach(elem => {
        const key = elem.getAttribute("data-lang-placeholder");
        if (langData[key]) {
            elem.setAttribute("placeholder", langData[key]);
        }
    });

    if (langData["tituloPagina"]) {
        document.title = langData["tituloPagina"];
    }

    // Actualizar botón y menú de compartir ya generados
    document.querySelectorAll(".share-button").forEach(btn => {
        btn.textContent = langData["botonCompartir"] || "Compartir";
    });

    document.querySelectorAll(".share-menu").forEach(menu => {
        const enlaces = menu.querySelectorAll("a");
        const redes = langData["compartirEn"] || {};
        if (enlaces.length === 3) {
            enlaces[0].textContent = redes.x || "X";
            enlaces[1].textContent = redes.telegram || "Telegram";
            enlaces[2].textContent = redes.whatsapp || "WhatsApp";
        }
    });

    // Si el modal admin está abierto, actualiza solo los textos de los campos existentes
    const adminModal = document.getElementById("admin-add-games-modal");
    if (adminModal && adminModal.style.display !== "none") {
        const adminGamesFields = document.getElementById("admin-games-fields");
        if (adminGamesFields) {
            adminGamesFields.querySelectorAll('.admin-game-field').forEach(div => {
                // Nombre del juego
                const labelNombre = div.querySelector('input[name="nombre[]"]')?.previousElementSibling;
                if (labelNombre) labelNombre.textContent = langData['adminNombreJuego'] || 'Nombre del juego';
                const inputNombre = div.querySelector('input[name="nombre[]"]');
                if (inputNombre) inputNombre.placeholder = langData['adminNombreJuego'] || 'Nombre del juego';

                // URL del juego
                const labelUrl = div.querySelector('input[name="url[]"]')?.previousElementSibling;
                if (labelUrl) labelUrl.textContent = langData['adminUrlJuego'] || 'URL del juego';
                const inputUrl = div.querySelector('input[name="url[]"]');
                if (inputUrl) inputUrl.placeholder = langData['adminUrlJuego'] || 'URL del juego';

                // Imagen
                const labelImagen = div.querySelector('.admin-file-dropzone label');
                if (labelImagen) labelImagen.textContent = langData['adminImagenJuego'] || 'Imagen';

                // Botón seleccionar imagen
                const customFileLabel = div.querySelector('.custom-file-label');
                const inputImg = div.querySelector('input[type="file"]');
                if (customFileLabel) {
                    if (inputImg && inputImg.files && inputImg.files.length > 0) {
                        customFileLabel.textContent = inputImg.files[0].name;
                    } else {
                        customFileLabel.textContent = langData['adminSeleccionarImagen'] || 'Seleccionar imagen';
                    }
                }

                // Botón eliminar
                const removeBtn = div.querySelector('.remove-game-field-btn');
                if (removeBtn) removeBtn.title = langData['adminEliminarJuego'] || 'Eliminar';
            });
        }
    }

    // Regenerar los botones de compartir con el idioma actual
    if (typeof actualizarTarjetasCompartir === 'function') {
        actualizarTarjetasCompartir();
    }
}

// ******************************************************************

// ******************** ABRIR ENLACES EN OTRA PESTAÑA ********************
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a[href]");

    links.forEach(link => {
        const href = link.getAttribute("href");

        // Detecta si es un enlace externo (que no empieza por # ni por tu propio dominio)
        const isExternal = href.startsWith("http") && !href.includes(window.location.hostname);

        if (isExternal) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        }
    });

    // === Botón flotante Ir Arriba ===
    let btnIrArriba = document.getElementById('btn-ir-arriba');
    if (!btnIrArriba) {
        btnIrArriba = document.createElement('button');
        btnIrArriba.id = 'btn-ir-arriba';
        btnIrArriba.title = 'Ir arriba';
        btnIrArriba.innerHTML = `<span class="flecha-arriba">\
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="15" fill="none"/>
                <path d="M16 23V9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
                <path d="M9.5 15.5L16 9L22.5 15.5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>`;
        document.body.appendChild(btnIrArriba);
    }
    const topbar = document.querySelector('.topbar') || document.querySelector('.filters-bar') || document.getElementById('search-box');
    function mostrarBotonArriba() {
        if (window.scrollY > 180) {
            btnIrArriba.classList.add('visible');
        } else {
            btnIrArriba.classList.remove('visible');
        }
    }
    window.addEventListener('scroll', mostrarBotonArriba);
    mostrarBotonArriba();
    btnIrArriba.addEventListener('click', function () {
        if (topbar && typeof topbar.scrollIntoView === 'function') {
            topbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // --- Lógica botón ir arriba mejorada ---
    const searchContainer = document.querySelector('.search-container');
    if (btnIrArriba && searchContainer) {
        // Usar IntersectionObserver para detectar sticky
        const observer = new IntersectionObserver(
            ([e]) => {
                if (window.scrollY > 180 && e.intersectionRatio === 0) {
                    btnIrArriba.classList.add('visible');
                } else {
                    btnIrArriba.classList.remove('visible');
                }
            },
            { threshold: [0], rootMargin: "0px 0px 0px 0px" }
        );
        observer.observe(searchContainer);
        // Scroll suave al hacer click
        btnIrArriba.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// ******************************************************************

// Boton ir a pagina inicial
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        section.classList.add('highlight');
        setTimeout(() => {
            section.classList.remove('highlight');
        }, 500); // Elimina el resaltado después de 1 segundo
    }
}

// ************************** INFO ***********************************
document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".accordion-item");

    items.forEach(item => {
        const button = item.querySelector(".accordion-button");

        button.addEventListener("click", () => {
            const isActive = item.classList.contains("active");

            // Cierra todos los FAQ primero
            items.forEach(i => i.classList.remove("active"));

            // Si no estaba activo antes del clic, lo abrimos
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });
});

function actualizarAccordion() {
    // Reasigna los listeners o actualiza el contenido si lo necesitas
    aplicarTraducciones(langDataGlobal);
}

// *******************************************************************

// ********************** MANEJO LOGIN Y REGISTRO *********************************************
document.addEventListener("DOMContentLoaded", () => {
    fetch('auth/checkSession.php')
        .then(res => res.json())
        .then(data => {
            window.usuarioLogueado = !!data.logueado;
            window.nombreUsuario = data.nombre || '';
            window.usuarioGoogle = !!data.google;
            actualizarEstadoSesion();
            cargarJuegos();
            // Lógica para panel de usuario Google
            if (window.usuarioGoogle) {
                // Ocultar formulario de cambio de contraseña
                const formCambiarPass = document.getElementById("form-cambiar-pass");
                if (formCambiarPass) formCambiarPass.style.display = "none";
                // En eliminar cuenta: ocultar input y mostrar solo botón eliminar
                const formEliminarCuenta = document.getElementById("form-eliminar-cuenta");
                const inputEliminarPass = document.getElementById("eliminar-cuenta-pass");
                const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");
                const btnCancelarEliminar = document.getElementById("cancelar-eliminar-cuenta");
                if (formEliminarCuenta && inputEliminarPass && btnEliminarCuenta && btnCancelarEliminar) {
                    // Estado inicial: solo mostrar el botón eliminar cuenta
                    formEliminarCuenta.style.display = "none";
                    btnEliminarCuenta.style.display = "inline-block";
                    inputEliminarPass.style.display = "none";
                    btnCancelarEliminar.style.display = "inline-block"; // Necesario para que luego funcione el display, pero oculto en el form
                    // Mostrar formulario solo al pulsar eliminar
                    btnEliminarCuenta.onclick = function () {
                        formEliminarCuenta.style.display = "block";
                        btnEliminarCuenta.style.display = "none";
                    };
                    btnCancelarEliminar.onclick = function () {
                        formEliminarCuenta.style.display = "none";
                        btnEliminarCuenta.style.display = "inline-block";
                    };
                    // Cambiar el submit: solo confirma, no pide pass
                    formEliminarCuenta.onsubmit = function (e) {
                        e.preventDefault();
                        const msgEliminarCuenta = document.getElementById("eliminar-cuenta-message");
                        const langData = window.langDataGlobal || {};
                        msgEliminarCuenta.textContent = langData['errores']?.['procesando'] || 'Procesando...';
                        msgEliminarCuenta.style.color = '#37474f';
                        fetch('api/deleteUsuario.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: '' // No se envía contraseña
                        })
                            .then(res => res.json())
                            .then(respuesta => {
                                if (respuesta.exito) {
                                    msgEliminarCuenta.textContent = langData['panelUsuarioEliminarExito'] || langData[respuesta.mensaje] || respuesta.mensaje;
                                    msgEliminarCuenta.style.color = '#4caf50';
                                    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
                                } else {
                                    msgEliminarCuenta.textContent = langData['panelUsuarioEliminarError'] || langData[respuesta.mensaje] || respuesta.mensaje;
                                    msgEliminarCuenta.style.color = '#e53935';
                                }
                            })
                            .catch(() => {
                                msgEliminarCuenta.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                                msgEliminarCuenta.style.color = '#e53935';
                            });
                    };
                }
            } else {
                // Si no es Google, mostrar los campos normalmente
                const formCambiarPass = document.getElementById("form-cambiar-pass");
                if (formCambiarPass) formCambiarPass.style.display = "block";
                const inputEliminarPass = document.getElementById("eliminar-cuenta-pass");
                const btnCancelarEliminar = document.getElementById("cancelar-eliminar-cuenta");
                if (inputEliminarPass) inputEliminarPass.style.display = "block";
                if (btnCancelarEliminar) btnCancelarEliminar.style.display = "inline-block";
            }
        });

    const popupLogin = document.getElementById("popup-login");
    const popupRegistro = document.getElementById("popup-registro");
    const popupRecuperar = document.getElementById("popup-recuperar");
    const popupRestablecer = document.getElementById("popup-restablecer");
    const mensajeLogin = document.getElementById("login-message");
    const mensajeRegistro = document.getElementById("registro-message");

    function mostrarPopup(popup) {
        popup.style.display = "flex";
        document.body.classList.add('popup-abierto');
    }
    function cerrarTodosPopups() {
        popupLogin.style.display = "none";
        popupRegistro.style.display = "none";
        popupRecuperar.style.display = "none";
        popupRestablecer.style.display = "none";
        if (typeof popupPanelUsuario !== 'undefined' && popupPanelUsuario) popupPanelUsuario.style.display = "none";
        document.body.classList.remove('popup-abierto');
    }
    document.getElementById("login-btn").addEventListener("click", () => {
        mostrarPopup(popupLogin);
    });
    document.getElementById("registro-btn").addEventListener("click", () => {
        mostrarPopup(popupRegistro);
    });
    document.querySelectorAll(".close-popup").forEach(button => {
        button.addEventListener("click", function () {
            cerrarTodosPopups();
            // Si se cierra el popup de restablecer, quitamos el token de la URL
            if (button.closest('#popup-restablecer')) {
                const url = new URL(window.location.href);
                if (url.searchParams.has('token')) {
                    url.searchParams.delete('token');
                    window.history.replaceState({}, document.title, url.pathname + url.search);
                }
            }
        });
    });
    window.onclick = function (event) {
        if (event.target === popupRestablecer) return;
        if (
            event.target === popupLogin ||
            event.target === popupRegistro ||
            event.target === popupRecuperar ||
            (typeof popupPanelUsuario !== 'undefined' && event.target === popupPanelUsuario)
        ) {
            cerrarTodosPopups();
        }
    };

    // Manejo del Login
    document.getElementById("form-login").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-pass").value;
        const langData = window.langDataGlobal || {};
        mensajeLogin.textContent = '';
        mensajeLogin.style.color = '';
        if (email.length > 80) {
            mensajeLogin.textContent = langData['errores']?.['emailLargo'] || 'El email no puede superar 80 caracteres.';
            mensajeLogin.style.color = '#f44336';
            return;
        }
        if (password.length > 20) {
            mensajeLogin.textContent = langData['errores']?.['cambiarPassLarga'] || 'La contraseña no puede superar 20 caracteres.';
            mensajeLogin.style.color = '#f44336';
            return;
        }
        const data = {
            email,
            password
        };

        fetch('auth/login.php?lang=' + (localStorage.getItem("preferredLanguage") || "es"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(respuesta => {
                mensajeLogin.textContent = respuesta.mensaje;
                mensajeLogin.style.color = respuesta.exito ? '#4caf50' : '#f44336';
                if (respuesta.exito) {
                    localStorage.setItem('nombre', respuesta.nombre);
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            })
            .catch(() => {
                mensajeLogin.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                mensajeLogin.style.color = '#f44336';
            });
    });

    // Manejo del Registro
    document.getElementById("form-registro").addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("registro-nombre").value;
        const email = document.getElementById("registro-email").value;
        const password = document.getElementById("registro-pass").value;
        const langData = window.langDataGlobal || {};
        mensajeRegistro.textContent = '';
        mensajeRegistro.style.color = '';
        if (nombre.length > 50) {
            mensajeRegistro.textContent = langData['errores']?.['nombreLargo'] || 'El nombre no puede superar 50 caracteres.';
            mensajeRegistro.style.color = '#f44336';
            return;
        }
        if (email.length > 80) {
            mensajeRegistro.textContent = langData['errores']?.['emailLargo'] || 'El email no puede superar 80 caracteres.';
            mensajeRegistro.style.color = '#f44336';
            return;
        }
        if (password.length > 20) {
            mensajeRegistro.textContent = langData['errores']?.['cambiarPassLarga'] || 'La contraseña no puede superar 20 caracteres.';
            mensajeRegistro.style.color = '#f44336';
            return;
        }
        const data = {
            nombre,
            email,
            password,
            lang: localStorage.getItem("preferredLanguage") || navigator.language.slice(0, 2) || "es"
        };

        fetch('auth/registro.php?lang=' + data.lang, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(respuesta => {
                mensajeRegistro.textContent = respuesta.mensaje;
                mensajeRegistro.style.color = respuesta.exito ? '#4caf50' : '#f44336';
                if (respuesta.exito) {
                    setTimeout(() => {
                        popupRegistro.style.display = "none";
                    }, 500);
                }
            })
            .catch(() => {
                mensajeRegistro.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                mensajeRegistro.style.color = '#f44336';
            });
    });

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => {
        fetch('auth/logout.php')
            .then(() => {
                localStorage.removeItem('nombre');
                window.location.reload();
            });
    });

    // Estado de sesión
    function actualizarEstadoSesion() {
        // Usar SIEMPRE las variables globales sincronizadas con el backend
        if (window.usuarioLogueado) {
            document.getElementById("login-btn").style.display = "none";
            document.getElementById("registro-btn").style.display = "none";
            document.getElementById("usuario-info").style.display = "inline";
            document.getElementById("nombre-usuario").innerText = window.nombreUsuario || '';
        } else {
            document.getElementById("login-btn").style.display = "inline";
            document.getElementById("registro-btn").style.display = "inline";
            document.getElementById("usuario-info").style.display = "none";
        }
        // Slider de favoritos
        const favoritosSlider = document.getElementById('filter-favoritos');
        if (favoritosSlider) {
            if (!window.usuarioLogueado) {
                favoritosSlider.disabled = true;
                favoritosSlider.parentElement.classList.add('slider-disabled');
                favoritosSlider.checked = false;
            } else {
                favoritosSlider.disabled = false;
                favoritosSlider.parentElement.classList.remove('slider-disabled');
            }
        }
    }

    // Recuperación de contraseña con popup independiente
    const enlaceOlvidePass = document.getElementById("enlace-olvide-pass");
    const volverLogin = document.getElementById("volver-login");
    const mensajeOlvidePass = document.getElementById("mensaje-olvide-pass");
    enlaceOlvidePass.addEventListener("click", (e) => {
        e.preventDefault();
        popupLogin.style.display = "none";
        mostrarPopup(popupRecuperar);
        mensajeOlvidePass.textContent = "";
    });
    volverLogin.addEventListener("click", (e) => {
        e.preventDefault();
        popupRecuperar.style.display = "none";
        mostrarPopup(popupLogin);
        mensajeOlvidePass.textContent = "";
    });
    document.getElementById("form-solicitar-recuperacion").addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("recuperar-email").value;
        const lang = localStorage.getItem("preferredLanguage") || navigator.language.slice(0, 2) || "es";
        const langData = window.langDataGlobal || {};
        mensajeOlvidePass.textContent = langData['errores']?.['procesando'] || "Procesando...";
        mensajeOlvidePass.style.color = "#37474f";
        if (email.length > 80) {
            mensajeOlvidePass.textContent = langData['errores']?.['emailLargo'] || 'El email no puede superar 80 caracteres.';
            mensajeOlvidePass.style.color = '#f44336';
            return;
        }
        fetch('auth/solicitar_recuperacion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang })
        })
            .then(res => res.json())
            .then(respuesta => {
                mensajeOlvidePass.textContent = respuesta.mensaje;
                mensajeOlvidePass.style.color = respuesta.exito ? '#4caf50' : '#f44336';
                if (respuesta.exito) {
                    document.getElementById("form-solicitar-recuperacion").reset();
                }
            })
            .catch(() => {
                mensajeOlvidePass.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                mensajeOlvidePass.style.color = '#f44336';
            });
    });

    // --- Restablecimiento de contraseña desde index.html ---
    function getTokenFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token') || '';
    }
    if (getTokenFromUrl()) {
        popupLogin.style.display = "none";
        popupRegistro.style.display = "none";
        popupRecuperar.style.display = "none";
        mostrarPopup(popupRestablecer);
    }
    // Traducción para mensajes del popup de restablecer
    let langDataRest = {};
    const langRest = localStorage.getItem('preferredLanguage') || navigator.language.slice(0, 2) || 'es';
    fetch(`scripts/lang/${langRest}.json`)
        .then(res => res.json())
        .then(data => { langDataRest = data; });
    function tRest(clave, def) {
        return (langDataRest && langDataRest[clave]) ? langDataRest[clave] : (def || clave);
    }
    // Lógica del formulario de restablecer
    const formRestablecer = document.getElementById('form-restablecer');
    if (formRestablecer) {
        formRestablecer.addEventListener('submit', function (e) {
            e.preventDefault();
            const pass1 = document.getElementById('nueva-pass').value;
            const pass2 = document.getElementById('confirmar-pass').value;
            const msg = document.getElementById('reset-message');
            const langData = window.langDataGlobal || {};
            msg.textContent = '';
            if (pass1.length < 6) {
                msg.textContent = langData['errores']?.['passCorta'] || 'La contraseña debe tener al menos 6 caracteres.';
                msg.style.color = '#f44336';
                return;
            }
            if (pass1.length > 20) {
                msg.textContent = langData['errores']?.['cambiarPassLarga'] || 'La contraseña no puede superar 20 caracteres.';
                msg.style.color = '#f44336';
                return;
            }
            if (pass1 !== pass2) {
                msg.textContent = langData['errores']?.['passNoCoincide'] || 'Las contraseñas no coinciden.';
                msg.style.color = '#f44336';
                return;
            }
            msg.textContent = langData['errores']?.['procesando'] || 'Procesando...';
            msg.style.color = '#37474f';
            fetch('auth/restablecer.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: getTokenFromUrl(), password: pass1, lang: langRest })
            })
                .then(res => res.json())
                .then(respuesta => {
                    msg.textContent = respuesta.mensaje;
                    msg.style.color = respuesta.exito ? '#4caf50' : '#f44336';
                    if (respuesta.exito) {
                        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                    }
                })
                .catch(() => {
                    msg.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                    msg.style.color = '#f44336';
                });
        });
    }

    // ================= PANEL DE USUARIO =====================
    const panelUsuarioBtn = document.getElementById("panel-usuario-btn");
    const popupPanelUsuario = document.getElementById("popup-panel-usuario");
    const formPanelUsuario = document.getElementById("form-panel-usuario");
    const panelNombre = document.getElementById("panel-nombre");
    const panelUsuarioMessage = document.getElementById("panel-usuario-message");
    // --- Cambio de contraseña ---
    const formCambiarPass = document.getElementById("form-cambiar-pass");
    const passActual = document.getElementById("pass-actual");
    const passNueva = document.getElementById("pass-nueva");
    const passNueva2 = document.getElementById("pass-nueva2");
    const panelPassMessage = document.getElementById("panel-pass-message");

    if (formPanelUsuario) {
        formPanelUsuario.addEventListener("submit", function (e) {
            e.preventDefault();
            panelUsuarioMessage.textContent = '';
            panelUsuarioMessage.style.color = '';
            const nombre = panelNombre.value.trim();
            const lang = localStorage.getItem("preferredLanguage") || "es";
            const langData = window.langDataGlobal || {};
            if (!nombre) {
                panelUsuarioMessage.textContent = langData['panelUsuarioNombreObligatorio'] || 'El nombre es obligatorio.';
                panelUsuarioMessage.style.color = '#f44336';
                return;
            }
            if (nombre.length > 50) {
                panelUsuarioMessage.textContent = langData['errores']?.['nombreLargo'] || 'El nombre no puede superar 50 caracteres.';
                panelUsuarioMessage.style.color = '#f44336';
                return;
            }
            panelUsuarioMessage.textContent = langData['panelUsuarioGuardando'] || 'Guardando...';
            panelUsuarioMessage.style.color = '#37474f';
            fetch('api/updateUsuario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, lang })
            })
                .then(res => res.json())
                .then(data => {
                    panelUsuarioMessage.textContent = data.mensaje;
                    panelUsuarioMessage.style.color = data.exito ? '#4caf50' : '#f44336';
                })
                .catch(() => {
                    panelUsuarioMessage.textContent = langData['panelUsuarioErrorConexion'] || 'Error de conexión.';
                    panelUsuarioMessage.style.color = '#f44336';
                });
        });
    }

    if (formCambiarPass) {
        formCambiarPass.addEventListener("submit", function (e) {
            e.preventDefault();
            panelPassMessage.textContent = '';
            panelPassMessage.style.color = '';
            const actual = passActual.value.trim();
            const nueva = passNueva.value.trim();
            const nueva2 = passNueva2.value.trim();
            const langData = window.langDataGlobal || {};
            if (!actual || !nueva || !nueva2) {
                panelPassMessage.textContent = langData['errores']?.['camposObligatorios'] || 'Todos los campos son obligatorios.';
                panelPassMessage.style.color = '#f44336';
                return;
            }
            if (nueva.length < 6) {
                panelPassMessage.textContent = langData['errores']?.['cambiarPassCorta'] || 'La nueva contraseña debe tener al menos 6 caracteres.';
                panelPassMessage.style.color = '#f44336';
                return;
            }
            if (nueva.length > 20) {
                panelPassMessage.textContent = langData['errores']?.['cambiarPassLarga'] || 'La nueva contraseña no puede superar 20 caracteres.';
                panelPassMessage.style.color = '#f44336';
                return;
            }
            if (nueva !== nueva2) {
                panelPassMessage.textContent = langData['errores']?.['cambiarPassNoCoincide'] || 'Las nuevas contraseñas no coinciden.';
                panelPassMessage.style.color = '#f44336';
                return;
            }
            panelPassMessage.textContent = langData['errores']?.['procesando'] || 'Procesando...';
            panelPassMessage.style.color = '#37474f';
            fetch('api/cambiarPassword.php?lang=' + (localStorage.getItem("preferredLanguage") || "es"), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actual, nueva })
            })
                .then(res => res.json())
                .then(data => {
                    panelPassMessage.textContent = data.mensaje;
                    panelPassMessage.style.color = data.exito ? '#4caf50' : '#f44336';
                    if (data.exito) {
                        formCambiarPass.reset();
                    }
                })
                .catch(() => {
                    panelPassMessage.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                    panelPassMessage.style.color = '#f44336';
                });
        });
    }

    if (panelUsuarioBtn && popupPanelUsuario && formPanelUsuario) {
        panelUsuarioBtn.addEventListener("click", () => {
            // Obtener datos actualizados del usuario
            fetch('api/getUsuario.php')
                .then(res => res.json())
                .then(data => {
                    if (data.exito) {
                        panelNombre.value = data.nombre || '';
                    } else {
                        panelNombre.value = '';
                    }

                    panelUsuarioMessage.textContent = '';
                    // --- Adaptar panel según si es Google ---
                    if (window.usuarioGoogle) {
                        // Ocultar formulario y título de cambio de contraseña
                        const formCambiarPass = document.getElementById("form-cambiar-pass");
                        const tituloCambiarPass = document.querySelector('[data-lang="cambiarPassTitulo"]');
                        if (formCambiarPass) formCambiarPass.style.display = "none";
                        if (tituloCambiarPass) tituloCambiarPass.style.display = "none";
                        // En eliminar cuenta: ocultar input y mostrar solo botón eliminar
                        const formEliminarCuenta = document.getElementById("form-eliminar-cuenta");
                        const inputEliminarPass = document.getElementById("eliminar-cuenta-pass");
                        const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");
                        const btnCancelarEliminar = document.getElementById("cancelar-eliminar-cuenta");
                        if (formEliminarCuenta && inputEliminarPass && btnEliminarCuenta && btnCancelarEliminar) {
                            // Estado inicial: solo mostrar el botón eliminar cuenta
                            formEliminarCuenta.style.display = "none";
                            btnEliminarCuenta.style.display = "inline-block";
                            inputEliminarPass.style.display = "none";
                            btnCancelarEliminar.style.display = "inline-block"; // Necesario para que luego funcione el display, pero oculto en el form
                            // Mostrar formulario solo al pulsar eliminar
                            btnEliminarCuenta.onclick = function () {
                                formEliminarCuenta.style.display = "block";
                                btnEliminarCuenta.style.display = "none";
                            };
                            btnCancelarEliminar.onclick = function () {
                                formEliminarCuenta.style.display = "none";
                                btnEliminarCuenta.style.display = "inline-block";
                            };
                            // Cambiar el submit: solo confirma, no pide pass
                            formEliminarCuenta.onsubmit = function (e) {
                                e.preventDefault();
                                const msgEliminarCuenta = document.getElementById("eliminar-cuenta-message");
                                const langData = window.langDataGlobal || {};
                                msgEliminarCuenta.textContent = langData['errores']?.['procesando'] || 'Procesando...';
                                msgEliminarCuenta.style.color = '#37474f';
                                fetch('api/deleteUsuario.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: '' // No se envía contraseña
                                })
                                    .then(res => res.json())
                                    .then(respuesta => {
                                        if (respuesta.exito) {
                                            msgEliminarCuenta.textContent = langData['panelUsuarioEliminarExito'] || langData[respuesta.mensaje] || respuesta.mensaje;
                                            msgEliminarCuenta.style.color = '#4caf50';
                                            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
                                        } else {
                                            msgEliminarCuenta.textContent = langData['panelUsuarioEliminarError'] || langData[respuesta.mensaje] || respuesta.mensaje;
                                            msgEliminarCuenta.style.color = '#e53935';
                                        }
                                    })
                                    .catch(() => {
                                        msgEliminarCuenta.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                                        msgEliminarCuenta.style.color = '#e53935';
                                    });
                            };
                        }
                    } else {
                        // Si no es Google, mostrar los campos normalmente
                        const formCambiarPass = document.getElementById("form-cambiar-pass");
                        const tituloCambiarPass = document.querySelector('[data-lang="cambiarPassTitulo"]');
                        if (formCambiarPass) formCambiarPass.style.display = "block";
                        if (tituloCambiarPass) tituloCambiarPass.style.display = "block";
                        const inputEliminarPass = document.getElementById("eliminar-cuenta-pass");
                        const btnCancelarEliminar = document.getElementById("cancelar-eliminar-cuenta");
                        const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");
                        if (inputEliminarPass) inputEliminarPass.style.display = "block";
                        if (btnCancelarEliminar) btnCancelarEliminar.style.display = "inline-block";
                        if (btnEliminarCuenta) btnEliminarCuenta.style.display = "inline-block";
                    }
                    // El botón de eliminar cuenta no está activado de base
                    const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");
                    if (btnEliminarCuenta) btnEliminarCuenta.style.display = "inline-block";

                    // === BOTÓN VINCULAR/DESVINCULAR GOOGLE ===
                    let btnGoogle = document.getElementById('btn-google-vincular');
                    let spanGoogle = btnGoogle ? btnGoogle.querySelector('span[data-lang]') : null;
                    // Guardar el estado de vinculación para usarlo fuera
                    let tieneGoogleVinculado = !!data.google_id;

                    if (tieneGoogleVinculado && spanGoogle) {
                        spanGoogle.setAttribute('data-lang', 'desvincularGoogle');
                        spanGoogle.textContent = window.langDataGlobal['desvincularGoogle'] || 'Desvincular Google';
                        btnGoogle.onclick = function () {
                            // Mostrar modal para nueva contraseña solo si está vinculado
                            const modalDesvincular = document.getElementById('popup-desvincular-google');
                            const formDesvincular = document.getElementById('form-desvincular-google');
                            const msgDesvincular = document.getElementById('msg-desvincular-google');
                            const btnCancelarDesvincular = document.getElementById('cancelar-desvincular-google');
                            // Ocultar el panel de usuario antes de mostrar el popup de desvincular
                            popupPanelUsuario.style.display = "none";
                            // Usar la función mostrarPopup para centrar y aplicar z-index correcto
                            mostrarPopup(modalDesvincular);
                            msgDesvincular.textContent = '';
                            formDesvincular.reset();

                            btnCancelarDesvincular.onclick = function () {
                                modalDesvincular.style.display = 'none';
                                document.body.classList.remove('popup-abierto');
                            };

                            formDesvincular.onsubmit = function (e) {
                                e.preventDefault();
                                const pass1 = document.getElementById('nueva-pass-desvincular').value.trim();
                                const pass2 = document.getElementById('nueva-pass2-desvincular').value.trim();
                                if (!pass1 || !pass2) {
                                    msgDesvincular.textContent = window.langDataGlobal['errores']?.['camposObligatorios'] || 'Todos los campos son obligatorios.';
                                    msgDesvincular.style.color = '#f44336';
                                    return;
                                }
                                if (pass1.length < 6) {
                                    msgDesvincular.textContent = window.langDataGlobal['errores']?.['cambiarPassCorta'] || 'La contraseña debe tener al menos 6 caracteres.';
                                    msgDesvincular.style.color = '#f44336';
                                    return;
                                }
                                if (pass1 !== pass2) {
                                    msgDesvincular.textContent = window.langDataGlobal['errores']?.['cambiarPassNoCoincide'] || 'Las contraseñas no coinciden.';
                                    msgDesvincular.style.color = '#f44336';
                                    return;
                                }
                                msgDesvincular.textContent = window.langDataGlobal['procesando'] || 'Procesando...';
                                msgDesvincular.style.color = '#37474f';

                                fetch('api/desvincularGoogle.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ nueva_pass: pass1 })
                                })
                                    .then(res => res.json())
                                    .then(respuesta => {
                                        msgDesvincular.textContent = getTranslationByKey(respuesta.mensaje);
                                        msgDesvincular.style.color = respuesta.exito ? '#4caf50' : '#f44336';
                                        if (respuesta.exito) setTimeout(() => window.location.reload(), 1200);
                                    })
                                    .catch(() => {
                                        msgDesvincular.textContent = window.langDataGlobal['panelUsuarioErrorConexion'] || 'Error de conexión.';
                                        msgDesvincular.style.color = '#f44336';
                                    });
                            };
                        };
                    } else if (spanGoogle && btnGoogle) {
                        spanGoogle.setAttribute('data-lang', 'vincularGoogle');
                        spanGoogle.textContent = window.langDataGlobal['vincularGoogle'] || 'Vincular Google';
                        btnGoogle.onclick = function () {
                            window.location.href = 'auth/google_login.php';
                        };
                    }
                    mostrarPopup(popupPanelUsuario);
                })
                .catch(() => {
                    panelNombre.value = '';
                    const langData = window.langDataGlobal || {};
                    panelUsuarioMessage.textContent = langData['panelUsuarioErrorConexion'] || 'Error al cargar los datos.';
                    panelUsuarioMessage.style.color = '#f44336';
                    mostrarPopup(popupPanelUsuario);
                });
        });
    }

    /* ************************* ADMIN AÑADIR JUEGO ************************** */

    // --- ELIMINAR CUENTA ---
    const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");
    const formEliminarCuenta = document.getElementById("form-eliminar-cuenta");
    const inputEliminarPass = document.getElementById("eliminar-cuenta-pass");
    const msgEliminarCuenta = document.getElementById("eliminar-cuenta-message");
    const btnCancelarEliminar = document.getElementById("cancelar-eliminar-cuenta");

    if (btnEliminarCuenta && formEliminarCuenta && inputEliminarPass && msgEliminarCuenta && btnCancelarEliminar) {
        btnEliminarCuenta.addEventListener("click", () => {
            formEliminarCuenta.style.display = "block";
            btnEliminarCuenta.style.display = "none";
            msgEliminarCuenta.textContent = '';
            inputEliminarPass.value = '';
        });
        btnCancelarEliminar.addEventListener("click", () => {
            formEliminarCuenta.style.display = "none";
            btnEliminarCuenta.style.display = "block";
            msgEliminarCuenta.textContent = '';
            inputEliminarPass.value = '';
        });
        formEliminarCuenta.addEventListener("submit", function (e) {
            e.preventDefault();
            const langData = window.langDataGlobal || {};
            msgEliminarCuenta.textContent = langData['errores']?.['procesando'] || 'Procesando...';
            msgEliminarCuenta.style.color = '#37474f';
            const pass = inputEliminarPass.value.trim();
            if (!pass) {
                msgEliminarCuenta.textContent = langData['panelUsuarioPassObligatoria'] || 'Debes introducir tu contraseña.';
                msgEliminarCuenta.style.color = '#e53935';
                return;
            }
            fetch('api/deleteUsuario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'password=' + encodeURIComponent(pass)
            })
                .then(res => res.json())
                .then(respuesta => {
                    // Usar claves de traducción para mensajes de éxito y error
                    if (respuesta.exito) {
                        msgEliminarCuenta.textContent = langData['panelUsuarioEliminarExito'] || langData[respuesta.mensaje] || respuesta.mensaje;
                        msgEliminarCuenta.style.color = '#4caf50';
                        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
                    } else {
                        msgEliminarCuenta.textContent = langData['panelUsuarioEliminarError'] || langData[respuesta.mensaje] || respuesta.mensaje;
                        msgEliminarCuenta.style.color = '#e53935';
                    }
                })
                .catch(() => {
                    msgEliminarCuenta.textContent = langData['errores']?.['errorConexion'] || 'Error de conexión.';
                    msgEliminarCuenta.style.color = '#e53935';
                });
        });
    }

    var googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function () {
            window.location.href = 'auth/google_login.php';
        });
    }
    // Permitir que el botón de registro de Google use el mismo script
    var googleRegisterBtn = document.getElementById('google-register-btn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', function () {
            window.location.href = 'auth/google_login.php';
        });
    }
});

function mostrarToast(mensaje, color = "#333") {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.style.backgroundColor = color;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.style.display = "none";
        }, 500);
    }, 3000);

    toast.style.display = "block";
}

function mostrarMensajeEmergente(texto, esExito = true) {
    const langData = window.langDataGlobal || {};
    const traduccion = langData[texto] || texto;

    const colorFondo = esExito
        ? getComputedStyle(document.documentElement).getPropertyValue('--success-color')
        : getComputedStyle(document.documentElement).getPropertyValue('--error-color');

    mostrarToast(traduccion, colorFondo);
}

// Función robusta para obtener traducción por clave anidada
function getTranslationByKey(key) {
    if (!window.langDataGlobal) return key;
    const keys = key.split('.');
    let value = window.langDataGlobal;
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return key;
    }
    return value;
}

function mostrarErrorPorParametro() {
    const errorMap = {
        'correo_ya_vinculado': 'errores.correoYaVinculado',
        'google_ya_vinculado': 'errores.googleYaVinculado',
        'actualizar_usuario_google': 'errores.actualizarUsuarioGoogle',
        'nombre_no_coincide': 'errores.nombreNoCoincide',
        'crear_usuario_google': 'errores.crearUsuarioGoogle',
        'autenticar_google': 'errores.autenticarGoogle',
        'soloVincularMismoGmail': 'errores.soloVincularMismoGmail'

    };
    function getParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }
    function removeParam(name) {
        const url = new URL(window.location.href);
        url.searchParams.delete(name);
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }
    const error = getParam('error');
    if (error && errorMap[error]) {
        const mensaje = getTranslationByKey(errorMap[error]);
        mostrarToast(mensaje, '#e53935');
        removeParam('error');
    }
}

// *************************************************************************************************

// ****************** ASIGNAR ATRIBUTOS AUTOMATICAMENTE ***************************************
let pagination = {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1
};

function renderPaginationControls() {
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    const pagesDiv = document.getElementById('pagination-pages');
    const sizeSelect = document.getElementById('pagination-size');
    const langData = window.langDataGlobal || {};

    // Actualizar textos internacionalizados

    const label = document.querySelector('.pagination-size-selector label');
    if (label) label.textContent = langData['porPagina'] || 'Por página:';

    // Botones prev/next
    prevBtn.disabled = pagination.page <= 1;
    nextBtn.disabled = pagination.page >= pagination.totalPages;

    // Números de página (máx 5 visibles, con ... si hay muchas)
    pagesDiv.innerHTML = '';
    let start = Math.max(1, pagination.page - 1);
    let end = Math.min(pagination.totalPages, pagination.page + 1);

    // Ajustar para mostrar siempre 3 páginas si es posible
    if (pagination.page === 1) {
        end = Math.min(3, pagination.totalPages);
    }
    if (pagination.page === pagination.totalPages) {
        start = Math.max(1, pagination.totalPages - 2);
    }
    if (start > 1) {
        const first = document.createElement('button');
        first.className = 'pagination-page-number';
        first.textContent = '1';
        first.onclick = () => goToPage(1);
        pagesDiv.appendChild(first);
        if (start > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.margin = '0 4px';
            pagesDiv.appendChild(dots);
        }
    }
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-page-number' + (i === pagination.page ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => goToPage(i);
        pagesDiv.appendChild(btn);
    }
    if (end < pagination.totalPages) {
        if (end < pagination.totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.margin = '0 4px';
            pagesDiv.appendChild(dots);
        }
        const last = document.createElement('button');
        last.className = 'pagination-page-number';
        last.textContent = pagination.totalPages;
        last.onclick = () => goToPage(pagination.totalPages);
        pagesDiv.appendChild(last);
    }
    // Actualizar selector de tamaño
    if (sizeSelect) sizeSelect.value = pagination.pageSize;
}

function goToPage(page) {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.page = page;
    cargarJuegos();
    renderPaginationControls();
}

function changePageSize(size) {
    pagination.pageSize = parseInt(size);
    pagination.page = 1;
    cargarJuegos();
}

document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    const sizeSelect = document.getElementById('pagination-size');
    if (prevBtn) prevBtn.addEventListener('click', function () {
        if (pagination.page > 1) goToPage(pagination.page - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
        if (pagination.page < pagination.totalPages) goToPage(pagination.page + 1);
    });
    if (sizeSelect) sizeSelect.addEventListener('change', function (e) {
        changePageSize(e.target.value);
    });
});

// ================= MODIFICAR CARGA DE JUEGOS =====================
// 2) Tu función solo limpia + rellena. NO vuelve a enlazar listeners.
function cargarJuegos() {
    const gridContainer = document.querySelector(".grid");
    gridContainer.innerHTML = '';

    const limit = pagination.pageSize;
    const offset = (pagination.page - 1) * limit;
    const search = encodeURIComponent(document.getElementById('search-box').value);
    const cross = document.getElementById('filter-crossbuy').checked ? 1 : 0;
    const fav = document.getElementById('filter-favoritos').checked ? 1 : 0;
    const cat = encodeURIComponent(document.getElementById('filtro-categoria').value);

    // 1) Cargo favoritos
    fetch('api/getFavoritos.php')
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
        .then(favs => {
            window.favoritosIds = new Set((Array.isArray(favs) ? favs : []).map(j => j.id));

            // 2) Petición con filtros (menos favoritos) y paginación
            const url = `api/getJuegos.php`
                + `?limit=${limit}&offset=${offset}`
                + `&search=${search}`
                + `&crossbuy=${cross}`
                + `&categoria=${cat}`;

            return fetch(url);
        })
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar los datos');
            return res.json();
        })
        .then(data => {
            let { total = 0, juegos = [] } = data;

            // 3) Filtrar por favoritos en cliente si está activo
            if (fav === 1) {
                juegos = juegos.filter(j => window.favoritosIds.has(j.id));
            }

            // 4) Ajustar paginación (opcional recálculo local)
            pagination.total = fav === 1 ? juegos.length : total;
            pagination.totalPages = Math.max(1, Math.ceil(pagination.total / limit));
            renderPaginationControls();

            if (juegos.length === 0) {
                // Si el filtro de favoritos está activo y no hay juegos, mostrar tarjeta de aviso reutilizando el bloque de traducción
                if (fav === 1) {
                    // Elimina mensaje anterior si existe
                    let mensaje = document.querySelector('.mensaje-favoritos-vacio');
                    if (!mensaje) {
                        mensaje = document.createElement('div');
                        mensaje.className = 'mensaje-favoritos-vacio';
                        mensaje.style.display = 'flex';
                        mensaje.style.flexDirection = 'column';
                        mensaje.style.alignItems = 'center';
                        mensaje.style.justifyContent = 'center';
                        mensaje.style.width = '100%';
                        mensaje.style.height = '320px';
                        mensaje.style.background = 'linear-gradient(135deg, #f7fafc 60%, #e3f2fd 100%)';
                        mensaje.style.borderRadius = '18px';
                        mensaje.style.boxShadow = '0 4px 24px rgba(53,144,178,0.10)';
                        mensaje.style.border = '2.5px solid #ffde59';
                        mensaje.style.margin = '0 auto';
                        mensaje.style.color = '#37474f';
                        mensaje.style.fontFamily = "'League Spartan', Arial, sans-serif";
                        mensaje.style.textAlign = 'center';
                        gridContainer.appendChild(mensaje);
                    }
                    // Reutilizar el bloque de traducción
                    const langData = window.langDataGlobal || {};
                    const titulo = langData['favoritosVacioTitulo'] || '¡No tienes juegos en favoritos todavía!';
                    const subtitulo = langData['favoritosVacioSub'] || 'Haz clic en el corazón para añadir tus juegos favoritos.';
                    mensaje.innerHTML = `
                        <span style=\"font-size:2.5em; margin-bottom: 10px;\">🖤</span>
                        <p style=\"font-size:1.25em; font-weight: 600; margin-bottom: 8px; color: #3590b2;\">${titulo}</p>
                        <span style=\"font-size:1em; color:#888;\">${subtitulo}</span>
                    `;
                }
                return;
            }

            juegos.forEach((juego, index) => {
                const gridItem = document.createElement("div");
                gridItem.className = "card grid-item";
                gridItem.setAttribute("data-name", juego.nombre);
                gridItem.setAttribute("data-index", index + 1 + offset);
                gridItem.setAttribute("data-id", juego.id);
                gridItem.setAttribute("data-categoria", juego.categoria || ""); // <-- Añadido para filtro de categoría
                if (juego.crossbuy) {
                    gridItem.setAttribute("data-crossbuy", "true");
                }
                // Corazón de favoritos
                const esFavorito = window.favoritosIds.has(juego.id);
                const corazon = document.createElement('span');
                corazon.className = 'corazon-favorito';
                corazon.innerHTML = esFavorito ? '❤️' : '🩶';
                corazon.title = esFavorito ? 'Eliminar de favoritos' : 'Añadir a favoritos';
                corazon.style.cursor = 'pointer';
                corazon.style.fontSize = '1.5em';
                corazon.style.position = 'absolute';
                corazon.style.bottom = '1px';
                corazon.style.left = '10px';
                corazon.style.userSelect = 'none';
                corazon.style.transition = 'transform 0.18s cubic-bezier(.4,2,.6,1), filter 0.18s';
                corazon.addEventListener('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    const langData = window.langDataGlobal || {};
                    if (!window.usuarioLogueado) {
                        mostrarMensajeEmergente(langData['favoritosNecesitaLogin'] || 'Debes iniciar sesión para usar favoritos', false);
                        return;
                    }
                    corazon.style.transform = 'scale(1.3)';
                    corazon.style.filter = 'drop-shadow(0 0 6px #ffde59)';
                    setTimeout(() => {
                        corazon.style.transform = '';
                        corazon.style.filter = '';
                    }, 180);
                    if (!window.favoritosIds.has(juego.id)) {
                        fetch('api/addFavorito.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'juego_id=' + encodeURIComponent(juego.id)
                        })
                            .then(res => res.json())
                            .then(res => {
                                if (res.exito) {
                                    corazon.innerHTML = '❤️';
                                    corazon.title = 'Eliminar de favoritos';
                                    mostrarMensajeEmergente(langData['favoritosAnadido'] || 'Añadido a favoritos', true);
                                    window.favoritosIds.add(juego.id);
                                    applyCombinedFilters();
                                } else {
                                    mostrarMensajeEmergente(res.mensaje, false);
                                }
                            });
                    } else {
                        fetch('api/removeFavorito.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'juego_id=' + encodeURIComponent(juego.id)
                        })
                            .then(res => res.json())
                            .then(res => {
                                if (res.exito) {
                                    corazon.innerHTML = '🩶';
                                    corazon.title = 'Añadir a favoritos';
                                    mostrarMensajeEmergente(langData['favoritosEliminado'] || 'Eliminado de favoritos', true);
                                    window.favoritosIds.delete(juego.id);
                                    applyCombinedFilters();
                                } else {
                                    mostrarMensajeEmergente(res.mensaje, false);
                                }
                            });
                    }
                });
                gridItem.innerHTML = `
                        <a href="${juego.enlace}" target="_blank">
                            <img loading="lazy" class="lazy" data-src="${juego.imagen}" alt="${juego.nombre}">
                        </a>
                        <h4>${juego.nombre}</h4>
                        <div class="share-placeholder"></div>
                        `;
                gridItem.appendChild(corazon);
                const shareButtonContainer = crearBotonCompartir(juego.nombre, juego.enlace);
                gridItem.querySelector(".share-placeholder").appendChild(shareButtonContainer);
                gridContainer.appendChild(gridItem);
            });

            initLazyLoading();
            applyCombinedFilters();
        })
        .catch(err => {
            console.error(err);
            document.querySelector(".grid").innerHTML = '<p>Error al cargar juegos.</p>';
        });
}

// 1) REGISTRA LOS LISTENERS UNA VEZ, al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Cuando cambie páginaSize o offset, también tienes que recargar
    document.getElementById("search-box")
        .addEventListener("input", () => { pagination.page = 1; cargarJuegos(); });
    document.getElementById("filter-crossbuy")
        .addEventListener("change", () => { pagination.page = 1; cargarJuegos(); });
    document.getElementById("filter-favoritos")
        .addEventListener("change", () => { pagination.page = 1; cargarJuegos(); });
    document.getElementById("filtro-categoria")
        .addEventListener("change", () => { pagination.page = 1; cargarJuegos(); });

});

// Función para inicializar lazy loading usando IntersectionObserver
let lazyObserver = null;

function initLazyLoading() {
    // Si ya había un observer, desconéctalo
    if (lazyObserver) {
        lazyObserver.disconnect();
    }

    lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const dataSrc = img.getAttribute("data-src");

                // Si no hay data-src válido, dejamos de observar
                if (!dataSrc || dataSrc === "null") {
                    observer.unobserve(img);
                    return;
                }

                img.src = dataSrc;
                img.removeAttribute("data-src");
                img.onload = () => {
                    img.classList.add("loaded");
                    img.classList.remove("lazy");
                };
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: "100px",
        threshold: 0.1
    });

    document.querySelectorAll("img.lazy").forEach(img => {
        // Sólo observa aquellas con data-src distinto de "null"
        const dataSrc = img.getAttribute("data-src");
        if (dataSrc && dataSrc !== "null") {
            lazyObserver.observe(img);
        }
    });
}


// ***************** FUNCIONES BUSCADOR Y FILTROS **********************
function applyCombinedFilters() {
    const searchValue = document.getElementById('search-box').value.toLowerCase();
    const crossbuyChecked = document.getElementById('filter-crossbuy').checked;
    const favoritosChecked = document.getElementById('filter-favoritos').checked;
    const categoriaSelect = document.getElementById('filtro-categoria');
    const categoriaSeleccionada = categoriaSelect ? categoriaSelect.value : '';
    const items = document.querySelectorAll('.grid-item');
    let favoritosIds = window.favoritosIds || new Set();
    let visibleCount = 0;

    items.forEach(item => {
        const matchesSearch = item.getAttribute('data-name').toLowerCase().includes(searchValue);
        const isCrossbuy = item.getAttribute('data-crossbuy') === 'true';
        const isFavorito = favoritosIds.has(Number(item.getAttribute('data-id')));
        const categoriaItem = item.getAttribute('data-categoria') || '';
        let mostrar = (matchesSearch || searchValue === '');
        if (crossbuyChecked) mostrar = mostrar && isCrossbuy;
        if (favoritosChecked) mostrar = mostrar && isFavorito;
        if (categoriaSeleccionada) {
            mostrar = mostrar && (categoriaItem === categoriaSeleccionada);
        }
        if (mostrar) {
            item.style.removeProperty('display');
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    const gridContainer = document.querySelector(".grid");
    // Eliminar mensaje anterior si existe
    const mensajeVacio = document.querySelector('.mensaje-favoritos-vacio');
    if (mensajeVacio) mensajeVacio.remove();
    // Si no hay visibles y el filtro de favoritos está activado, mostrar mensaje
    if (visibleCount === 0 && favoritosChecked) {
        const mensaje = document.createElement('div');
        mensaje.className = 'mensaje-favoritos-vacio';
        mensaje.style.display = 'flex';
        mensaje.style.flexDirection = 'column';
        mensaje.style.alignItems = 'center';
        mensaje.style.justifyContent = 'center';
        mensaje.style.width = '100%';
        mensaje.style.height = '320px';
        mensaje.style.background = 'linear-gradient(135deg, #f7fafc 60%, #e3f2fd 100%)';
        mensaje.style.borderRadius = '18px';
        mensaje.style.boxShadow = '0 4px 24px rgba(53,144,178,0.10)';
        mensaje.style.border = '2.5px solid #ffde59';
        mensaje.style.margin = '0 auto';
        mensaje.style.color = '#37474f';
        mensaje.style.fontFamily = "'League Spartan', Arial, sans-serif";
        mensaje.style.textAlign = 'center';
        // Traducción
        const langData = window.langDataGlobal || {};
        const titulo = langData['favoritosVacioTitulo'] || '¡No tienes juegos en favoritos todavía!';
        const subtitulo = langData['favoritosVacioSub'] || 'Haz clic en el corazón para añadir tus juegos favoritos.';
        mensaje.innerHTML = `
            <span style="font-size:2.5em; margin-bottom: 10px;">🖤</span>
            <p style="font-size:1.25em; font-weight: 600; margin-bottom: 8px; color: #3590b2;">${titulo}</p>
            <span style="font-size:1em; color:#888;">${subtitulo}</span>
        `;
        gridContainer.appendChild(mensaje);
    }
}

// Añadir event listener para el filtro de categoría (si no existe ya)
document.addEventListener('DOMContentLoaded', () => {
    const categoriaSelect = document.getElementById('filtro-categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', applyCombinedFilters);
        // Reutilizar clase de estilo si no está aplicada
        if (!categoriaSelect.classList.contains('filter-select')) {
            categoriaSelect.classList.add('filter-select');
        }
    }
});

// Vincular el filtro de categoría a los filtros combinados

document.addEventListener('DOMContentLoaded', function () {
    const categoriaSelect = document.getElementById('filtro-categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', applyCombinedFilters);
        // Estilizar el select acorde a la web (reutiliza clases si existen)
        categoriaSelect.classList.add('filtro-categoria-estilizado');
    }
});

// Función para ordenar y aplicar filtros combinados
function applyFilter(filterType) {
    const gridContainer = document.querySelector(".grid");
    const gridItems = Array.from(document.querySelectorAll(".grid-item"));

    // Ordenar según el filtro seleccionado
    if (filterType === "alphabetical") {
        gridItems.sort((a, b) =>
            a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"))
        );
    } else if (filterType === "reverse-alphabetical") {
        gridItems.sort((a, b) =>
            b.getAttribute("data-name").localeCompare(a.getAttribute("data-name"))
        );
    } else if (filterType === "recent") {
        gridItems.sort((a, b) =>
            parseInt(a.getAttribute("data-index")) - parseInt(b.getAttribute("data-index"))
        );
    }

    // Reorganizar el DOM
    const fragment = document.createDocumentFragment();
    gridItems.forEach(item => fragment.appendChild(item));
    gridContainer.appendChild(fragment);

    // Reaplicar los filtros combinados
    applyCombinedFilters();
}

// Dropdown para seleccionar filtros
document.querySelectorAll('.dropdown-content button').forEach(button => {
    button.addEventListener('click', (e) => {
        const filterType = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
        applyFilter(filterType);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const tooltipIcons = document.querySelectorAll(".tooltip-icon");

    tooltipIcons.forEach(icon => {
        const tooltipText = icon.nextElementSibling;

        icon.addEventListener("click", event => {
            event.stopPropagation(); // Evita que el clic afecte al checkbox

            // Alterna la visibilidad del tooltip
            if (tooltipText.style.visibility === "visible") {
                tooltipText.style.visibility = "hidden";
                tooltipText.style.opacity = "0";
            } else {
                tooltipText.style.visibility = "visible";
                tooltipText.style.opacity = "1";
            }
        });

        document.addEventListener("click", () => {
            // Ocultar el tooltip al hacer clic fuera
            tooltipText.style.visibility = "hidden";
            tooltipText.style.opacity = "0";
        });
    });
});

//************************************************************************

// ********************* IMPLEMENTAR COMPARTIR EN REDES SOCIALES *************************************
function actualizarTarjetasCompartir() {
    document.querySelectorAll(".grid-item").forEach(item => {
        const gameName = item.getAttribute("data-name");
        const gameLink = item.querySelector("a").href;

        // Remover botón anterior
        const botonAnterior = item.querySelector(".share-button-container");
        if (botonAnterior) botonAnterior.remove();

        // Crear nuevo botón traducido
        const nuevoBoton = crearBotonCompartir(gameName, gameLink);
        item.appendChild(nuevoBoton);
    });
}

function crearBotonCompartir(gameName, gameLink) {
    const langData = window.langDataGlobal || {};

    const shareButtonContainer = document.createElement("div");
    shareButtonContainer.className = "share-button-container";

    const shareButton = document.createElement("button");
    shareButton.className = "share-button";
    shareButton.textContent = langData["botonCompartir"] || "Compartir";

    const shareMenu = document.createElement("div");
    shareMenu.className = "share-menu";

    const mensajeCompartir = langData["mensajeCompartir"] || "¡Mira este juego con descuento proporcionado por Shaak4!";
    const message = encodeURIComponent(`${mensajeCompartir}\n${gameName}\n${gameLink}`);

    const redesTextos = langData["compartirEn"] || {
        x: "X",
        telegram: "Telegram",
        whatsapp: "WhatsApp"
    };

    const redes = [
        { nombre: redesTextos.x, href: `https://x.com/intent/tweet?text=${message}` },
        { nombre: redesTextos.telegram, href: `https://t.me/share/url?url=${encodeURIComponent(gameLink)}&text=${message}` },
        { nombre: redesTextos.whatsapp, href: `https://wa.me/?text=${message}` }
    ];

    redes.forEach(opcion => {
        const enlace = document.createElement("a");
        enlace.href = opcion.href;
        enlace.target = "_blank";
        enlace.textContent = opcion.nombre;
        shareMenu.appendChild(enlace);
    });

    shareButton.addEventListener("click", (e) => {
        e.stopPropagation();
        shareMenu.classList.toggle("visible");
    });

    shareButtonContainer.addEventListener("mouseleave", () => {
        shareMenu.classList.remove("visible");
    });

    shareButtonContainer.appendChild(shareButton);
    shareButtonContainer.appendChild(shareMenu);

    return shareButtonContainer;
}

// ================= ADMIN PANEL: AÑADIR JUEGOS =====================
document.addEventListener("DOMContentLoaded", () => {
    // --- Mostrar botón admin solo si el usuario es admin ---
    const adminBtn = document.getElementById("admin-add-games-btn");
    const adminModal = document.getElementById("admin-add-games-modal");
    const closeAdminModal = document.getElementById("close-admin-add-games");
    const addGameFieldBtn = document.getElementById("add-game-field-btn");
    const adminGamesFields = document.getElementById("admin-games-fields");
    const adminAddGamesForm = document.getElementById("admin-add-games-form");
    const adminAddGamesMsg = document.getElementById("admin-add-games-message");
    const cancelAdminAddGames = document.getElementById("cancel-admin-add-games");

    // Utilidad para traducción
    function t(key, def) {
        return getTranslationByKey(key) || def || key;
    }

    // Petición para saber si el usuario es admin
    fetch('api/getUsuario.php')
        .then(res => res.ok ? res.json() : { exito: false })
        .then(data => {
            if (data.exito && data.rol === 'admin') {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
        });

    // --- Lógica de apertura/cierre del modal ---
    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', () => {
            adminModal.style.display = 'flex';
            document.body.classList.add('popup-abierto');
            resetAdminGamesForm();
        });
    }
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', () => {
            adminModal.style.display = 'none';
            document.body.classList.remove('popup-abierto');
        });
    }

    if (cancelAdminAddGames) {
        cancelAdminAddGames.addEventListener('click', () => {
            adminModal.style.display = 'none';
            document.body.classList.remove('popup-abierto');
        });
    }

    // --- Añadir campos dinámicos de juegos ---
    function crearCampoJuego(idx) {
        const div = document.createElement('div');
        div.className = 'admin-game-field';
        div.style.marginBottom = '22px';
        const inputId = 'admin-file-' + idx + '-' + Math.floor(Math.random() * 100000);
        div.innerHTML = `
            <div class="admin-game-field-inner" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;background:#f7fafc;padding:14px 10px 10px 10px;border-radius:12px;border:1.5px solid #e3f2fd;box-shadow:0 1px 4px #3590b211;position:relative;">
                <div style='flex:2;min-width:120px;'>
                    <label style='font-size:1em;color:#3590b2;font-weight:600;margin-bottom:4px;display:block;'>${t('adminNombreJuego', 'Nombre del juego')}</label>
                    <input type="text" name="nombre[]" placeholder="${t('adminNombreJuego', 'Nombre del juego')}" maxlength="80" required style="width:100%;padding:8px 12px;border-radius:7px;border:1.5px solid #b0bec5;font-size:1em;">
                </div>
                <div style='flex:3;min-width:180px;'>
                    <label style='font-size:1em;color:#3590b2;font-weight:600;margin-bottom:4px;display:block;'>${t('adminUrlJuego', 'URL del juego')}</label>
                    <input type="url" name="url[]" placeholder="${t('adminUrlJuego', 'URL del juego')}" maxlength="255" required style="width:100%;padding:8px 12px;border-radius:7px;border:1.5px solid #b0bec5;font-size:1em;">
                </div>
                <div class="admin-file-dropzone" style='flex:2;min-width:120px;position:relative;'>
                    <label style='font-size:1em;color:#3590b2;font-weight:600;margin-bottom:4px;display:block;'>${t('adminImagenJuego', 'Imagen')}</label>
                    <input type="file" id="${inputId}" name="imagen[]" accept="image/*">
                    <label for="${inputId}" class="custom-file-label">${t('adminSeleccionarImagen', 'Seleccionar imagen')}</label>
                </div>
                <button type="button" class="remove-game-field-btn" title="${t('adminEliminarJuego', 'Eliminar')}" style="background:#e53935;color:#fff;border:none;border-radius:7px;padding:7px 10px;font-size:1.05em;cursor:pointer;margin-left:8px;">✖</button>
            </div>
            <div class="admin-image-preview" style="margin-top:8px;"></div>
        `;
        // Eliminar campo
        div.querySelector('.remove-game-field-btn').onclick = () => {
            div.remove();
        };
        // Preview imagen y drag&drop
        const inputImg = div.querySelector('input[type="file"]');
        const preview = div.querySelector('.admin-image-preview');
        const dropzone = div.querySelector('.admin-file-dropzone');
        const label = div.querySelector('.custom-file-label');

        function mostrarPreview(file) {

            preview.innerHTML = '';
            if (file) {
                const img = document.createElement('img');
                img.style.maxWidth = '110px';
                img.style.maxHeight = '70px';
                img.style.borderRadius = '8px';
                img.style.boxShadow = '0 1px 4px #3590b222';
                preview.appendChild(img);
                img.src = URL.createObjectURL(file);
                label.textContent = file.name;
            } else {
                label.textContent = file ? file.name : t('adminSeleccionarImagen', 'Seleccionar imagen');
            }
        }
        inputImg.addEventListener('change', function () {
            mostrarPreview(this.files && this.files[0]);
        });
        // Drag & Drop
        dropzone.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', function (e) {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                // Solo aceptar imágenes
                if (file.type.startsWith('image/')) {
                    // Asignar el archivo al input file
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    inputImg.files = dataTransfer.files;
                    mostrarPreview(file);
                } else {
                    label.textContent = 'Archivo no válido';
                }
            }
        });
        return div;
    }

    function resetAdminGamesForm() {
        adminGamesFields.innerHTML = '';
        adminAddGamesMsg.textContent = '';
        adminGamesFields.appendChild(crearCampoJuego(0));
    }
    if (addGameFieldBtn) {
        addGameFieldBtn.addEventListener('click', () => {
            adminGamesFields.appendChild(crearCampoJuego(Date.now()));
        });
    }
    // --- Envío del formulario ---
    if (adminAddGamesForm) {
        adminAddGamesForm.addEventListener('submit', function (e) {
            e.preventDefault();
            adminAddGamesMsg.textContent = t('errores.procesando', 'Procesando...');
            adminAddGamesMsg.style.color = '#37474f';
            const formData = new FormData(adminAddGamesForm);
            fetch('api/addJuegos.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(respuesta => {
                    if (respuesta.exito) {
                        adminAddGamesMsg.textContent = t('adminJuegosSubidos', 'Juegos añadidos correctamente.');
                        adminAddGamesMsg.style.color = '#4caf50';
                        resetAdminGamesForm();
                        setTimeout(() => {
                            adminModal.style.display = 'none';
                            document.body.classList.remove('popup-abierto');
                            if (typeof cargarJuegos === 'function') cargarJuegos();
                        }, 1200);
                    } else {
                        adminAddGamesMsg.textContent = t(respuesta.mensaje) || t('errores.errorInterno', 'Error interno.');
                        adminAddGamesMsg.style.color = '#e53935';
                    }
                })
                .catch(() => {
                    adminAddGamesMsg.textContent = t('errores.errorConexion', 'Error de conexión.');
                    adminAddGamesMsg.style.color = '#e53935';
                });
        });
    }
});