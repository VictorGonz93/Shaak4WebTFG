<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
require_once __DIR__ . '/../includes/clave_secreta.php';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['exito' => false, 'error' => 'no_auth']);
    exit;
}
$usuario_id = $_SESSION['usuario_id'];

$stmt = $conn->prepare("SELECT nombre, CAST(AES_DECRYPT(email, ?) AS CHAR) AS email, google_id, rol FROM usuarios WHERE id = ?");
$stmt->bind_param("si", $clave_secreta, $usuario_id);
$stmt->execute();
$stmt->bind_result($nombre, $email, $google_id, $rol);
if ($stmt->fetch()) {
    echo json_encode([
        'nombre' => $nombre,
        'email' => $email,
        'google_id' => $google_id,
        'rol' => $rol,
        'exito' => true
    ]);
} else {
    echo json_encode([
        'exito' => false,
        'mensaje' => 'No se encontró el usuario.'
    ]);
}
$stmt->close();
$conn->close();