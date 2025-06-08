<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (isset($_SESSION['usuario_id']) && isset($_SESSION['nombre'])) {
    require_once __DIR__ . '/../includes/conexion.php';
    $usuario_id = $_SESSION['usuario_id'];
    $stmt = $conn->prepare("SELECT google_id FROM usuarios WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $stmt->bind_result($google_id);
    $stmt->fetch();
    $stmt->close();
    $conn->close();
    $esGoogle = !is_null($google_id);
    echo json_encode([
        'logueado' => true,
        'nombre' => $_SESSION['nombre'],
        'google' => $esGoogle
    ]);
} else {
    echo json_encode([
        'logueado' => false
    ]);
}
