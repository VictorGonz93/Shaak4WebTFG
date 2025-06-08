<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../includes/conexion.php';

// Parámetros
$limit     = isset($_GET['limit'])     ? intval($_GET['limit'])     : 25;
$offset    = isset($_GET['offset'])    ? intval($_GET['offset'])    : 0;
$search    = isset($_GET['search'])    ? trim($_GET['search'])      : '';
$crossbuy  = isset($_GET['crossbuy'])  ? intval($_GET['crossbuy'])  : 0;
$categoria = isset($_GET['categoria']) ? trim($_GET['categoria'])   : '';

// Sanitiza paginación
if ($limit < 1)  $limit = 25;
if ($offset < 0) $offset = 0;

// Construir filtro dinámico
$where     = [];
$types     = '';
$params    = [];

// Búsqueda por nombre
if ($search !== '') {
    $where[]   = "nombre LIKE ?";
    $types    .= 's';
    $params[]  = '%' . $search . '%';
}

// Solo crossbuy
if ($crossbuy === 1) {
    $where[] = "crossbuy = 1";
}

// Filtrar por categoría exacta (o podrías usar LIKE)
if ($categoria !== '') {
    $where[]   = "categoria = ?";
    $types    .= 's';
    $params[]  = $categoria;
}

// Montar SQL
$sqlWhere = count($where) 
    ? 'WHERE ' . implode(' AND ', $where) 
    : '';

/** 1) Contar total con filtros **/
$countSql = "SELECT COUNT(*) AS total FROM juegos $sqlWhere";
$countStmt = $conn->prepare($countSql);
if ($types) {
    // bind sólo si hay marcadores
    $countStmt->bind_param($types, ...$params);
}
$countStmt->execute();
$totalResult = $countStmt->get_result()->fetch_assoc();
$total = (int)$totalResult['total'];
$countStmt->close();

/** 2) Obtener página **/
$dataSql = "
    SELECT id, nombre, enlace, imagen, crossbuy, categoria
    FROM juegos
    $sqlWhere
    ORDER BY id DESC
    LIMIT ? OFFSET ?
";
$dataStmt = $conn->prepare($dataSql);
// Para este bind: primero van los filtros, luego limit y offset
$allTypes = $types . 'ii';
$allParams = array_merge($params, [ $limit, $offset ]);
$dataStmt->bind_param($allTypes, ...$allParams);
$dataStmt->execute();
$result = $dataStmt->get_result();

$juegos = [];
while ($row = $result->fetch_assoc()) {
    $juegos[] = [
        'id'        => (int)   $row['id'],
        'nombre'    =>         $row['nombre'],
        'enlace'    =>         $row['enlace'],
        'imagen'    =>         $row['imagen'],
        'crossbuy'  => (bool)  $row['crossbuy'],
        'categoria' =>         $row['categoria'],
    ];
}

$dataStmt->close();
$conn->close();

// Devolver JSON
echo json_encode([
    'total'  => $total,
    'juegos' => $juegos
], JSON_UNESCAPED_UNICODE);
