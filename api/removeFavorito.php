<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_POST['juego_id'])) {
    echo json_encode(['exito' => false, 'mensaje' => 'errores.faltaIdJuego']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$juego_id = intval($_POST['juego_id']);

$stmt = $conn->prepare("DELETE FROM favoritos WHERE usuario_id = ? AND juego_id = ?");
$stmt->bind_param("ii", $usuario_id, $juego_id);
if ($stmt->execute()) {
    echo json_encode(['exito' => true, 'mensaje' => 'mensajes.favoritoEliminado']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => 'errores.errorEliminarFavorito']);
}
$stmt->close();
$conn->close();
