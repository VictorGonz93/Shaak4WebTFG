<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$lang = $input['lang'] ?? (substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es');
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

$nombre = trim($input['nombre'] ?? '');
if (empty($nombre)) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['panelUsuarioNombreObligatorio'] ?? 'El nombre es obligatorio.']);
    exit;
}
if (strlen($nombre) > 50) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['nombreLargo'] ?? 'El nombre no puede superar 50 caracteres.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

$stmt = $conn->prepare("UPDATE usuarios SET nombre = ? WHERE id = ?");
$stmt->bind_param("si", $nombre, $usuario_id);
if ($stmt->execute()) {
    $_SESSION['nombre'] = $nombre;
    // Comprobar si el usuario es de Google
    $stmt2 = $conn->prepare("SELECT google_id FROM usuarios WHERE id = ? LIMIT 1");
    $stmt2->bind_param("i", $usuario_id);
    $stmt2->execute();
    $stmt2->bind_result($google_id);
    $stmt2->fetch();
    $es_google = !empty($google_id);
    $stmt2->close();
    echo json_encode([
        'exito' => true,
        'mensaje' => $trad['panelUsuarioGuardado'] ?? 'Datos actualizados correctamente.',
        'google' => $es_google
    ]);
} else {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['errorInterno'] ?? 'Error al actualizar los datos.']);
}
$stmt->close();
$conn->close();
