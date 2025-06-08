<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/clave_secreta.php';
header('Content-Type: application/json; charset=utf-8');

// Detectar idioma
$lang = $_GET['lang'] ?? $_POST['lang'] ?? 'es';
$lang = in_array($lang, ['es', 'en']) ? $lang : 'es';
function getTranslation($langCode = 'es') {
    $langPath = __DIR__ . "/../scripts/lang/$langCode.json";
    if (!file_exists($langPath)) {
        $langPath = __DIR__ . "/../scripts/lang/es.json";
    }
    $json = file_get_contents($langPath);
    return json_decode($json, true);
}
$trad = getTranslation($lang);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['metodoNoPermitido'] ?? 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['actual'], $input['nueva'])) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['datosIncompletos'] ?? 'Datos incompletos.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$pass_actual = $input['actual'];
$pass_nueva = $input['nueva'];

$stmt = $conn->prepare("SELECT password FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$res = $stmt->get_result();
if (!$row = $res->fetch_assoc()) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['errorInterno'] ?? 'Usuario no encontrado.']);
    exit;
}
$stmt->close();

if (!password_verify($pass_actual, $row['password'])) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['cambiarPassActualIncorrecta'] ?? 'La contraseña actual no es correcta.']);
    exit;
}

if (strlen($pass_nueva) < 6) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['cambiarPassCorta'] ?? 'La nueva contraseña debe tener al menos 6 caracteres.']);
    exit;
}

if (strlen($pass_nueva) > 20) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['cambiarPassLarga'] ?? 'La nueva contraseña no puede superar 20 caracteres.']);
    exit;
}

$hash_nueva = password_hash($pass_nueva, PASSWORD_DEFAULT);
$stmt2 = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
$stmt2->bind_param("si", $hash_nueva, $usuario_id);
if ($stmt2->execute()) {
    echo json_encode(['exito' => true, 'mensaje' => $trad['mensajes']['cambiarPassExito'] ?? 'Contraseña cambiada correctamente.']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => $trad['mensajes']['cambiarPassError'] ?? 'Error al actualizar la contraseña.']);
}
$stmt2->close();
$conn->close();
?>
