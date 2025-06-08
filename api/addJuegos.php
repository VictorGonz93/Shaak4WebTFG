<?php
require_once __DIR__ . '/../includes/sesion.php';
require_once __DIR__ . '/../includes/conexion.php';

// Solo admin
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['exito' => false, 'mensaje' => 'No autorizado']);
    exit;
}

$exito = true;
$errores = [];
for ($i = 0; isset($_FILES['imagen']['name'][$i]); $i++) {
    $nombre = trim($_POST['nombre'][$i]);
    $url = trim($_POST['url'][$i]);
    $imgTmp = $_FILES['imagen']['tmp_name'][$i];
    $imgName = basename($_FILES['imagen']['name'][$i]);
    $imgPath = '../imgs/' . uniqid() . '_' . $imgName;
    if (move_uploaded_file($imgTmp, $imgPath)) {
        $imgDb = 'imgs/' . basename($imgPath);
        $stmt = $conn->prepare('INSERT INTO juegos (nombre, enlace, imagen) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $nombre, $url, $imgDb);
        if (!$stmt->execute()) {
            $exito = false;
            $errores[] = $nombre;
        }
        $stmt->close();
    } else {
        $exito = false;
        $errores[] = $nombre;
    }
}
$conn->close();
echo json_encode([
    'exito' => $exito,
    'mensaje' => $exito ? 'Juegos añadidos correctamente.' : 'Error en: ' . implode(', ', $errores)
]);