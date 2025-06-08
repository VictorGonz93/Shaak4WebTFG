<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once '../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$lang = $inputData['lang'] ?? ($_GET['lang'] ?? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es');
$lang = in_array($lang, ['es', 'en']) ? $lang : 'es';
function getTranslation($langCode = 'es') {
    $langPath = "../scripts/lang/$langCode.json";
    if (!file_exists($langPath)) {
        $langPath = "../scripts/lang/es.json";
    }
    $json = file_get_contents($langPath);
    return json_decode($json, true);
}
$trad = getTranslation($lang);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['metodoNoPermitido'] ?? 'Método no permitido.']);
    exit;
}

$inputData = json_decode(file_get_contents('php://input'), true);
$token = trim($inputData['token'] ?? '');
$password = trim($inputData['password'] ?? '');
if (strlen($password) < 6) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['passCorta'] ?? 'La contraseña debe tener al menos 6 caracteres.']);
    exit;
}
if (strlen($password) > 20) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['cambiarPassLarga'] ?? 'La contraseña no puede superar 20 caracteres.']);
    exit;
}

$stmt = $conn->prepare('SELECT id, token_recuperacion_expira FROM usuarios WHERE token_recuperacion = ?');
$stmt->bind_param('s', $token);
$stmt->execute();
$res = $stmt->get_result();
$usuario = $res->fetch_assoc();
$stmt->close();

if (!$usuario) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['tokenInvalido'] ?? 'Token inválido o expirado.']);
    exit;
}
if (strtotime($usuario['token_recuperacion_expira']) < time()) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['tokenExpirado'] ?? 'El enlace ha expirado. Solicita uno nuevo.']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('UPDATE usuarios SET password = ?, token_recuperacion = NULL, token_recuperacion_expira = NULL WHERE id = ?');
$stmt->bind_param('si', $hash, $usuario['id']);
if ($stmt->execute()) {
    echo json_encode(['exito' => true, 'mensaje' => $trad['mensajes']['passRestablecida'] ?? 'Contraseña restablecida correctamente.']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['errorActualizarPass'] ?? 'Error al actualizar la contraseña.']);
}
$stmt->close();
$conn->close();
