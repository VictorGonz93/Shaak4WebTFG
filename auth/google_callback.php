<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/clave_secreta.php';
session_start();

$clientID = '';
$clientSecret = '';
$redirectUri = 'http://localhost/shaak4/auth/google_callback.php';

$provider = new League\OAuth2\Client\Provider\Google([
    'clientId'     => $clientID,
    'clientSecret' => $clientSecret,
    'redirectUri'  => $redirectUri
]);

if (!isset($_GET['state']) || ($_GET['state'] !== $_SESSION['oauth2state'])) {
    unset($_SESSION['oauth2state']);
    exit('Estado inválido, posible ataque CSRF.');
}

if (!isset($_GET['code'])) {
    exit('No se recibió el código de autorización.');
}

try {
    $token = $provider->getAccessToken('authorization_code', [
        'code' => $_GET['code']
    ]);

    $googleUser = $provider->getResourceOwner($token);
    $userArr = $googleUser->toArray();
    $googleId = $googleUser->getId();
    $email = isset($userArr['email']) ? $userArr['email'] : '';
    $nombre = isset($userArr['name']) ? $userArr['name'] : '';

    // Cifrar email igual que en el registro tradicional
    $email_cifrado = null;
    $stmtCifrado = $conn->prepare("SELECT AES_ENCRYPT(?, ?) AS cifrado");
    $stmtCifrado->bind_param("ss", $email, $clave_secreta);
    $stmtCifrado->execute();
    $resCifrado = $stmtCifrado->get_result();
    if ($rowCifrado = $resCifrado->fetch_assoc()) {
        $email_cifrado = $rowCifrado['cifrado'];
    }
    $stmtCifrado->close();
    if (!$email_cifrado) {
        exit('Error al cifrar el email.');
    }

    // Si el usuario ya está logueado, comprobar duplicados antes de actualizar
    if (isset($_SESSION['usuario_id'])) {
        $usuario_id = $_SESSION['usuario_id'];

        // Obtener email actual descifrado
        $stmtEmail = $conn->prepare('SELECT AES_DECRYPT(email, ?) AS email_descifrado FROM usuarios WHERE id = ?');
        $stmtEmail->bind_param('si', $clave_secreta, $usuario_id);
        $stmtEmail->execute();
        $resEmail = $stmtEmail->get_result();
        $rowEmail = $resEmail->fetch_assoc();
        $stmtEmail->close();

        $email_descifrado = strtolower(trim($rowEmail['email_descifrado'] ?? ''));
        $email_google = strtolower(trim($email));

        // Permite cualquier dominio, pero exige coincidencia exacta de email
        if ($email_descifrado !== $email_google) {
            $conn->close();
            header('Location: ../index.html?error=soloVincularMismoGmail');
            exit;
        }

        // Comprobar si el email ya está en uso por otro usuario
        $stmtCheck = $conn->prepare('SELECT id FROM usuarios WHERE email = AES_ENCRYPT(?, ?) AND id != ?');
        $stmtCheck->bind_param('ssi', $email, $clave_secreta, $usuario_id);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        if ($resCheck->fetch_assoc()) {
            $stmtCheck->close();
            $conn->close();
            header('Location: ../index.html?error=correo_ya_vinculado');
            exit;
        }
        $stmtCheck->close();
        
        // Comprobar si el google_id ya está en uso por otro usuario
        $stmtCheck = $conn->prepare('SELECT id FROM usuarios WHERE google_id = ? AND id != ?');
        $stmtCheck->bind_param('si', $googleId, $usuario_id);
        $stmtCheck->execute();
        $resCheck = $stmtCheck->get_result();
        if ($resCheck->fetch_assoc()) {
            $stmtCheck->close();
            $conn->close();
            header('Location: ../index.html?error=google_ya_vinculado');
            exit;
        }
        $stmtCheck->close();
        // Si no hay duplicados, actualizar
        $stmtUpdate = $conn->prepare('UPDATE usuarios SET email = AES_ENCRYPT(?, ?), google_id = ?, nombre = ?, password = NULL WHERE id = ?');
        $stmtUpdate->bind_param('ssssi', $email, $clave_secreta, $googleId, $nombre, $usuario_id);
        if ($stmtUpdate->execute()) {
            $_SESSION['nombre'] = $nombre;
            $stmtUpdate->close();
            $conn->close();
            header('Location: ../index.html');
            exit;
        } else {
            $stmtUpdate->close();
            $conn->close();
            header('Location: ../index.html?error=actualizar_usuario_google');
            exit;
        }
    }

        // Buscar usuario por email cifrado
        $stmt = $conn->prepare('SELECT id, nombre FROM usuarios WHERE email = ?');
        $stmt->bind_param('s', $email_cifrado);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            // Usuario ya existe, actualizar google_id y SOLO el nombre si está vacío
            if (empty($row['nombre'])) {
                $stmtUpdate = $conn->prepare('UPDATE usuarios SET google_id = ?, password = NULL, nombre = ? WHERE id = ?');
                $stmtUpdate->bind_param('ssi', $googleId, $nombre, $row['id']);
            } else {
                $stmtUpdate = $conn->prepare('UPDATE usuarios SET google_id = ?, password = NULL WHERE id = ?');
                $stmtUpdate->bind_param('si', $googleId, $row['id']);
            }
            $stmtUpdate->execute();
            $stmtUpdate->close();
            // Iniciar sesión
            $_SESSION['usuario_id'] = $row['id'];
            $_SESSION['nombre'] = $row['nombre']; // Mantén el nombre personalizado
            // Obtener y guardar el rol en sesión
            $stmtRol = $conn->prepare('SELECT rol FROM usuarios WHERE id = ?');
            $stmtRol->bind_param('i', $row['id']);
            $stmtRol->execute();
            $stmtRol->bind_result($rol);
            if ($stmtRol->fetch()) {
                $_SESSION['rol'] = $rol;
            }
            $stmtRol->close();
        } else {
            // Crear usuario nuevo con email cifrado y verificado=1
            $stmt = $conn->prepare('INSERT INTO usuarios (nombre, email, google_id, verificado) VALUES (?, ?, ?, 1)');
            $stmt->bind_param('sss', $nombre, $email_cifrado, $googleId);
            if ($stmt->execute()) {
                $_SESSION['usuario_id'] = $stmt->insert_id;
                $_SESSION['nombre'] = $nombre;
                // Obtener y guardar el rol en sesión
                $stmtRol = $conn->prepare('SELECT rol FROM usuarios WHERE id = ?');
                $stmtRol->bind_param('i', $_SESSION['usuario_id']);
                $stmtRol->execute();
                $stmtRol->bind_result($rol);
                if ($stmtRol->fetch()) {
                    $_SESSION['rol'] = $rol;
                }
                $stmtRol->close();
            } else {
                header('Location: ../index.html?error=crear_usuario_google');
                exit;
            }
        }
    $stmt->close();
    $conn->close();
    header('Location: ../index.html');
    exit;
} catch (Exception $e) {
    header('Location: ../index.html?error=autenticar_google');
    exit;
}
