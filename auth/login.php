<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once '../includes/conexion.php';
require_once '../includes/clave_secreta.php';
header('Content-Type: application/json; charset=utf-8');

// Detectar idioma
$lang = $_GET['lang'] ?? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es';
$lang = in_array($lang, ['es', 'en']) ? $lang : 'es';

// Cargar traducciones
function getTranslation($langCode = 'es') {
    $langPath = "../scripts/lang/$langCode.json";
    if (!file_exists($langPath)) {
        $langPath = "../scripts/lang/es.json";
    }
    $json = file_get_contents($langPath);
    return json_decode($json, true);
}

$trad = getTranslation($lang);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = json_decode(file_get_contents("php://input"), true);

    if (!isset($inputData['email'], $inputData['password'])) {
        echo json_encode(["exito" => false, "mensaje" => "" . $trad['errores']['datosIncompletos']]);
        exit;
    }

    $email = trim($inputData['email']);
    $password = trim($inputData['password']);

    if (empty($email) || empty($password)) {
        echo json_encode(["exito" => false, "mensaje" => "" . $trad['errores']['camposObligatorios']]);
        exit;
    }
    if (strlen($email) > 80) {
        echo json_encode(["exito" => false, "mensaje" => "El email no puede superar 80 caracteres."]);
        exit;
    }
    if (strlen($password) > 20) {
        echo json_encode(["exito" => false, "mensaje" => "La contraseña no puede superar 20 caracteres."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["exito" => false, "mensaje" => "" . $trad['errores']['correoInvalido']]);
        exit;
    }

    // Cifrar el email para buscarlo en la base de datos
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
        echo json_encode(["exito" => false, "mensaje" => "Error al cifrar el email."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nombre, password, verificado FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email_cifrado);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_assoc();

    if (!$usuario) {
        echo json_encode(["exito" => false, "mensaje" => "" . $trad['errores']['correoNoExiste']]);
        exit;
    }

    if (!$usuario['verificado']) {
        echo json_encode(["exito" => false, "mensaje" => "Debes verificar tu correo antes de iniciar sesión."]);
        exit;
    }

    if (!password_verify($password, $usuario['password'])) {
        echo json_encode(["exito" => false, "mensaje" => "" . $trad['errores']['contrasenaIncorrecta']]);
        exit;
    }

    session_start();
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['nombre'] = $usuario['nombre'];
    // Añadir el rol a la sesión
    $stmtRol = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    $stmtRol->bind_param("i", $usuario['id']);
    $stmtRol->execute();
    $stmtRol->bind_result($rol);
    if ($stmtRol->fetch()) {
        $_SESSION['rol'] = $rol;
    }
    $stmtRol->close();

    echo json_encode(["exito" => true, "mensaje" => "" . $trad['mensajes']['loginExitoso'], "nombre" => $usuario['nombre']]);
}
?>
