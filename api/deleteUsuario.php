<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$usuario_id = $_SESSION['usuario_id'];
$password = isset($_POST['password']) ? $_POST['password'] : '';

// Obtener el hash de la contraseña del usuario
$stmt = $conn->prepare('SELECT password FROM usuarios WHERE id = ?');
$stmt->bind_param('i', $usuario_id);
$stmt->execute();
$stmt->bind_result($hash);
if (!$stmt->fetch()) {
    echo json_encode(['exito' => false, 'mensaje' => 'panelUsuarioEliminarError']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Si el usuario es Google (sin contraseña), no pedir password
if ($hash === null || $hash === '') {
    // Eliminar datos relacionados (favoritos, etc.)
    $stmt = $conn->prepare('DELETE FROM favoritos WHERE usuario_id = ?');
    $stmt->bind_param('i', $usuario_id);
    $stmt->execute();
    $stmt->close();
    // Eliminar usuario
    $stmt = $conn->prepare('DELETE FROM usuarios WHERE id = ?');
    $stmt->bind_param('i', $usuario_id);
    if ($stmt->execute()) {
        session_destroy();
        echo json_encode(['exito' => true, 'mensaje' => 'panelUsuarioEliminarExito']);
    } else {
        echo json_encode(['exito' => false, 'mensaje' => 'panelUsuarioEliminarError']);
    }
    $stmt->close();
    $conn->close();
    exit;
}

// Usuario normal: verificar que se envió password
if ($password === '') {
    echo json_encode(['exito' => false, 'mensaje' => 'panelUsuarioPassObligatoria']);
    $conn->close();
    exit;
}

// Usuario normal: verificar contraseña
if (!password_verify($password, $hash)) {
    echo json_encode(['exito' => false, 'mensaje' => 'panelUsuarioEliminarError']);
    $conn->close();
    exit;
}

// Eliminar datos relacionados (favoritos, etc.)
$stmt = $conn->prepare('DELETE FROM favoritos WHERE usuario_id = ?');
$stmt->bind_param('i', $usuario_id);
$stmt->execute();
$stmt->close();

// Eliminar usuario
$stmt = $conn->prepare('DELETE FROM usuarios WHERE id = ?');
$stmt->bind_param('i', $usuario_id);
if ($stmt->execute()) {
    session_destroy();
    echo json_encode(['exito' => true, 'mensaje' => 'panelUsuarioEliminarExito']);
} else {
    echo json_encode(['exito' => false, 'mensaje' => 'panelUsuarioEliminarError']);
}
$stmt->close();
$conn->close();
