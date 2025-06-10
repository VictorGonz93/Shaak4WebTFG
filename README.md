
# Shaak4 VR

**Shaak4 VR** es una plataforma web que centraliza descuentos en juegos de realidad virtual, pensada para comunidades de gamers que buscan ofertas actualizadas y organizadas en un solo sitio.

---

## 🌐 Características principales

- Catálogo dinámico de juegos en oferta.
- Gestión de usuarios con login vía Google o por email/contraseña.
- Favoritos personalizados.
- Panel de administración para añadir juegos.
- Interfaz responsive y multilenguaje.

---

## 🛠️ Requisitos del sistema

- PHP 8.0 o superior
- MySQL/MariaDB
- Composer (para instalar dependencias)
- Servidor web (como Apache)

---

## 📦 Instalación

### 1. Clona el repositorio
```bash
git clone https://github.com/usuario/shaak4.git
cd shaak4
```

### 2. Instala las dependencias PHP
Asegúrate de tener Composer instalado. Luego ejecuta:
```bash
composer install
```

Esto instalará:
- `phpmailer/phpmailer`
- `league/oauth2-client`
- `league/oauth2-google`
- `psr/log`

---

## ⚙️ Configuración

### 1. Base de datos

Crea manualmente las tablas necesarias (`usuarios`, `juegos`, `favoritos`, etc.) según el modelo de datos del proyecto.  
(Consulta el documento del TFG o contacta con el autor para el script `.sql` original si es necesario).


### 2. Archivos sensibles (no incluidos)

Debes crear un archivo `.env.php` en el directorio `includes/` con contenido similar al siguiente:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'shaak4');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');

define('GOOGLE_CLIENT_ID', 'tu_client_id_google');
define('GOOGLE_CLIENT_SECRET', 'tu_secret');
define('GOOGLE_REDIRECT_URI', 'http://localhost/shaak4/auth/google_callback.php');
?>
```

## 👥 Funcionalidades principales

### Usuario anónimo
- Ver catálogo

### Usuario registrado
- Añadir a favoritos
- Editar perfil
- Cambiar idioma

### Administrador
- Añadir juegos nuevos desde el panel admin

---

## 📂 Estructura de carpetas

- `/api`: Endpoints PHP (GET/POST) para acciones dinámicas
- `/auth`: Gestión de login, registro, verificación
- `/includes`: Archivos de conexión y configuración
- `/imgs`: Almacenamiento de imágenes de juegos
- `/estilo`: Archivos CSS
- `/scripts`: Archivos JavaScript
- `/vendor`: Librerías PHP instaladas con Composer

---

## 🧪 Pruebas

- Se ha probado la funcionalidad de login (email/Google), favoritos, y gestión de catálogo.
- Se recomienda usar `xampp` en entorno local para pruebas iniciales.

---

## 📈 Mejoras futuras

- Panel de analítica para administradores
- Soporte para alertas personalizadas
- Sistema de comentarios y reviews

---

## 📝 Licencia

Proyecto académico para IES Ribera del Tajo, bajo uso educativo.
