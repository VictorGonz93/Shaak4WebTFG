<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once '../includes/conexion.php';
require_once '../includes/clave_secreta.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
header('Content-Type: application/json; charset=utf-8');

$inputData = json_decode(file_get_contents('php://input'), true);
$lang = $inputData['lang'] ?? ($_GET['lang'] ?? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es');
$lang = in_array($lang, ['es', 'en']) ? $lang : 'es';

function getTranslation($langCode = 'es') {
    $langPath = "../scripts/lang/$langCode.json";
    if (!file_exists($langPath)) {
        $langPath = "../scripts/lang/es.json";
    }
    $json = file_get_contents($langPath);
    return json_decode($json, true);
}

$trad = getTranslation($lang);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['metodoNoPermitido'] ?? 'Método no permitido.']);
    exit;
}

$inputData = json_decode(file_get_contents('php://input'), true);
$email = trim($inputData['email'] ?? '');
if (strlen($email) > 80) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['emailLargo'] ?? 'El email no puede superar 80 caracteres.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['correoInvalido'] ?? 'Email no válido.']);
    exit;
}

// Cifrar email para buscarlo
$stmtCifrado = $conn->prepare('SELECT AES_ENCRYPT(?, ?) AS cifrado');
$stmtCifrado->bind_param('ss', $email, $clave_secreta);
$stmtCifrado->execute();
$resCifrado = $stmtCifrado->get_result();
$rowCifrado = $resCifrado->fetch_assoc();
$email_cifrado = $rowCifrado['cifrado'] ?? null;
$stmtCifrado->close();
if (!$email_cifrado) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['errorInterno'] ?? 'Error interno.']);
    exit;
}

$stmt = $conn->prepare('SELECT id, nombre, verificado, google_id FROM usuarios WHERE email = ?');
$stmt->bind_param('s', $email_cifrado);
$stmt->execute();
$res = $stmt->get_result();
$usuario = $res->fetch_assoc();
$stmt->close();

if (!$usuario || !$usuario['verificado']) {
    echo json_encode(['exito' => true, 'mensaje' => $trad['mensajes']['recuperacionEnviada'] ?? 'Si el email existe y está verificado, recibirás un correo para restablecer la contraseña.']);
    exit;
}

// Nueva comprobación: si es cuenta Google, no permitir recuperación
if (!empty($usuario['google_id'])) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['recuperacionGoogleNoPermitida'] ?? 'No se puede recuperar la contraseña de una cuenta de Google. Debes iniciar sesión con Google.']);
    exit;
}

// Generar token y guardar con expiración (1h)
$token = bin2hex(random_bytes(32));
$expira = date('Y-m-d H:i:s', time() + 3600);
$stmt = $conn->prepare('UPDATE usuarios SET token_recuperacion = ?, token_recuperacion_expira = ? WHERE id = ?');
$stmt->bind_param('ssi', $token, $expira, $usuario['id']);
$stmt->execute();
$stmt->close();

// Enviar email
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = '';
    $mail->Password = '';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom('', 'Shaak4 VR');
    $mail->addAddress($email);
    $mail->Subject = $trad['emailRecuperacionAsunto'] ?? 'Recupera tu contraseña en Shaak4 VR';
    $enlace = 'http://' . $_SERVER['HTTP_HOST'] . '/shaak4/index.html?token=' . $token;
    $mail->isHTML(true);
    $mail->Body = '<div style="background: linear-gradient(135deg, #3590b2, #ffde59); padding: 0; min-height: 100vh;"><div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(53,144,178,0.18); padding: 40px 28px 32px 28px; text-align: center; font-family: League Spartan, Arial, sans-serif; border: 3px solid #ffde59;"><img src="https://shaak4.com/imgs/shaak4_42.png" alt="Shaak4 VR" style="width: 90px; margin-bottom: 22px; border-radius: 12px; box-shadow: 0 2px 8px #eee;"><h2 style="color: #3590b2; margin-bottom: 12px; font-size: 2rem; letter-spacing: 1.5px;">' . ($trad['emailRecuperacionTitulo'] ?? 'Recupera tu contraseña') . '</h2><p style="color: #333; font-size: 18px; margin-bottom: 28px;">' . ($trad['emailRecuperacionSaludo'] ?? 'Hola') . ', <b>' . htmlspecialchars($usuario['nombre']) . '</b> 👋<br>' . ($trad['emailRecuperacionTexto'] ?? 'Haz clic en el siguiente botón para restablecer tu contraseña:') . '</p><a href="' . $enlace . '" style="display: inline-block; background: #ffde59; color: #37474f; font-weight: bold; padding: 16px 38px; border-radius: 30px; text-decoration: none; font-size: 20px; margin-bottom: 22px; box-shadow: 0 2px 8px #eee; border: 2px solid #3590b2; transition: background 0.3s;">' . ($trad['emailRecuperacionBoton'] ?? 'Restablecer contraseña') . '</a><p style="color: #888; font-size: 15px; margin-top: 36px;">' . ($trad['emailRecuperacionAviso'] ?? 'Si no solicitaste este cambio, puedes ignorar este mensaje.<br>Shaak4 VR') . '</p></div></div>';
    $mail->send();
} catch (Exception $e) {
    echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['errorEnviandoEmail'] ?? 'Error enviando email: ' . $mail->ErrorInfo]);
    exit;
}

echo json_encode(['exito' => true, 'mensaje' => $trad['mensajes']['recuperacionEnviada'] ?? 'Si el email existe y está verificado, recibirás un correo para restablecer la contraseña.']);
