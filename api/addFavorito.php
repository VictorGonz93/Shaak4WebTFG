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

$stmt = $conn->prepare("INSERT IGNORE INTO favoritos (usuario_id, juego_id) VALUES (?, ?)");
$stmt->bind_param("ii", $usuario_id, $juego_id);
if ($stmt->execute()) {
    echo json_encode(['exito' => true, 'mensaje' => 'mensajes.favoritoAnadido']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => 'errores.errorAnadirFavorito']);
}
$stmt->close();
$conn->close();
