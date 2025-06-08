<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$usuario_id = $_SESSION['usuario_id'];
$data = json_decode(file_get_contents('php://input'), true);
$nueva_pass = $data['nueva_pass'] ?? '';

if (!$nueva_pass || strlen($nueva_pass) < 6) {
    echo json_encode(['exito' => false, 'mensaje' => 'errores.passMinCaracteres']);
    exit;
}

$hash = password_hash($nueva_pass, PASSWORD_DEFAULT);

$stmt = $conn->prepare('UPDATE usuarios SET password = ?, google_id = NULL WHERE id = ?');
$stmt->bind_param('si', $hash, $usuario_id);
if ($stmt->execute()) {
    echo json_encode(['exito' => true, 'mensaje' => 'mensajes.googleDesvinculada']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => 'errores.errorDesvincularGoogle']);
}
$stmt->close();
$conn->close();