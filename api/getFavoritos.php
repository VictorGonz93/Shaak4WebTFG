<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['exito' => false, 'error' => 'no_auth']);
    exit;
}
$usuario_id = $_SESSION['usuario_id'];

$stmt = $conn->prepare("SELECT j.id, j.nombre, j.enlace, j.imagen, j.crossbuy FROM favoritos f JOIN juegos j ON f.juego_id = j.id WHERE f.usuario_id = ? ORDER BY f.fecha_agregado DESC");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result = $stmt->get_result();

$favoritos = [];
while ($row = $result->fetch_assoc()) {
    $favoritos[] = [
        'id' => (int)$row['id'],
        'nombre' => $row['nombre'],
        'enlace' => $row['enlace'],
        'imagen' => $row['imagen'],
        'crossbuy' => $row['crossbuy'] ? true : false
    ];
}

echo json_encode($favoritos);

$stmt->close();
$conn->close();
