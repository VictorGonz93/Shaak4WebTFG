<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once '../includes/conexion.php';
require_once '../includes/clave_secreta.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');

$inputData = json_decode(file_get_contents('php://input'), true);
$lang = $_GET['lang'] ?? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es';
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = json_decode(file_get_contents("php://input"), true);

    $lang = $inputData['lang'] ?? ($_GET['lang'] ?? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) ?? 'es');
    $lang = in_array($lang, ['es', 'en']) ? $lang : 'es';
    $trad = getTranslation($lang);

    if (!isset($inputData['nombre'], $inputData['email'], $inputData['password'])) {
        echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['datosIncompletos']]);
        exit;
    }

    $nombre = trim($inputData['nombre']);
    $email = trim($inputData['email']);
    $contrasena = trim($inputData['password']);

    if (empty($nombre) || empty($email) || empty($contrasena)) {
        echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['camposObligatorios']]);
        exit;
    }
    if (strlen($nombre) > 50) {
        echo json_encode(['exito' => false, 'mensaje' => 'El nombre no puede superar 20 caracteres.']);
        exit;
    }
    if (strlen($email) > 80) {
        echo json_encode(['exito' => false, 'mensaje' => 'El email no puede superar 80 caracteres.']);
        exit;
    }
    if (strlen($contrasena) > 20) {
        echo json_encode(['exito' => false, 'mensaje' => 'La contraseña no puede superar 20 caracteres.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['correoInvalido']]);
        exit;
    }

    if (strlen($contrasena) < 6) {
        echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['contrasenaCorta']]);
        exit;
    }

    // Cifrar email
    $email_cifrado = null;
    $stmtCifrado = $conn->prepare("SELECT AES_ENCRYPT(?, ?) AS cifrado");
    $stmtCifrado->bind_param("ss", $email, $clave_secreta);
    $stmtCifrado->execute();
    $resCifrado = $stmtCifrado->get_result();
    if ($rowCifrado = $resCifrado->fetch_assoc()) {
        $email_cifrado = $rowCifrado['cifrado'];
    }
    $stmtCifrado->close();
    if (!$email_cifrado) {
        echo json_encode(['exito' => false, 'mensaje' => 'Error al cifrar el email.']);
        exit;
    }

    // Comprobar duplicado email o usuario (comparando email cifrado)
    $checkStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? OR nombre = ?");
    $checkStmt->bind_param("ss", $email_cifrado, $nombre);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        $checkStmt->close();

        $checkEmailStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $checkEmailStmt->bind_param("s", $email_cifrado);
        $checkEmailStmt->execute();
        $checkEmailStmt->store_result();

        if ($checkEmailStmt->num_rows > 0) {
            echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['correoDuplicado']]);
            exit;
        }

        $checkEmailStmt->close();

        echo json_encode(['exito' => false, 'mensaje' => $trad['errores']['usuarioDuplicado']]);
        exit;
    }

    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Generar token de verificación
    $token = bin2hex(random_bytes(32));

    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, verificado, token_verificacion, fecha_registro) VALUES (?, ?, ?, 0, ?, NOW())");
    $stmt->bind_param("ssss", $nombre, $email_cifrado, $contrasenaHash, $token);

    if ($stmt->execute()) {
        // Envío de email de verificación con PHPMailer
        $mail = new PHPMailer(true);
        try {
            // Configuración SMTP (Gmail)
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = ''; // Nuevo correo de la web
            $mail->Password = ''; // Contraseña de aplicación
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;
            $mail->CharSet = 'UTF-8';

            // Remitente y destinatario
            $mail->setFrom('', 'Shaak4 VR');
            $mail->addAddress($email); // Email original, no cifrado

            $mail->Subject = $trad['emailVerificacionAsunto'] ?? 'Activa tu cuenta en Shaak4 VR - ¡Bienvenido!';
            $mail->addReplyTo('', 'Shaak4 VR');
            $mail->isHTML(true);
            $enlace = 'http://' . $_SERVER['HTTP_HOST'] . '/shaak4/api/verificar.php?token=' . $token;
            $mail->Body = '
<div style="background: linear-gradient(135deg, #3590b2, #ffde59); padding: 0; min-height: 100vh;">
  <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(53,144,178,0.18); padding: 40px 28px 32px 28px; text-align: center; font-family: League Spartan, Arial, sans-serif; border: 3px solid #ffde59;">
    <img src="https://shaak4.com/imgs/shaak4_42.png" alt="Shaak4 VR" style="width: 90px; margin-bottom: 22px; border-radius: 12px; box-shadow: 0 2px 8px #eee;">
    <h2 style="color: #3590b2; margin-bottom: 12px; font-size: 2rem; letter-spacing: 1.5px;">' . ($trad['emailVerificacionTitulo'] ?? '¡Bienvenido a Shaak4 VR!') . '</h2>
    <p style="color: #333; font-size: 18px; margin-bottom: 28px;">
      ' . ($trad['emailVerificacionSaludo'] ?? 'Hola') . ', <b>' . htmlspecialchars($nombre) . '</b> 👋<br>
      ' . ($trad['emailVerificacionTexto'] ?? '¡Gracias por unirte a nuestra comunidad de realidad virtual!<br>Para activar tu cuenta y acceder a todas las ventajas, haz clic en el siguiente botón:') . '
    </p>
    <a href="' . $enlace . '" style="display: inline-block; background: #ffde59; color: #37474f; font-weight: bold; padding: 16px 38px; border-radius: 30px; text-decoration: none; font-size: 20px; margin-bottom: 22px; box-shadow: 0 2px 8px #eee; border: 2px solid #3590b2; transition: background 0.3s;">' . ($trad['emailVerificacionBoton'] ?? 'Verificar cuenta') . '</a>
    <p style="color: #888; font-size: 15px; margin-top: 36px;">
      ' . ($trad['emailVerificacionAviso'] ?? 'Si no te registraste, puedes ignorar este mensaje.<br>¿Tienes dudas? Responde a este correo o contacta con nuestro soporte.<br><span style="color: #3590b2; font-weight: bold;">Shaak4 VR</span>') . '
    </p>
    <hr style="margin: 32px 0 18px 0; border: none; border-top: 1.5px solid #e0e0e0;">
    <div style="font-size: 13px; color: #aaa;">
      <span style="color: #ffde59; font-weight: bold;">' . ($trad['emailVerificacionPromo'] ?? '¡Explora descuentos exclusivos en juegos VR!') . '</span><br>
      <a href="https://shaak4.com" style="color: #3590b2; text-decoration: underline;">shaak4.com</a>
    </div>
  </div>
</div>
';

            $mail->send();
        } catch (Exception $e) {
            echo json_encode(['exito' => false, 'mensaje' => 'Error enviando email: ' . $mail->ErrorInfo]);
            exit;
        }

        echo json_encode(['exito' => true, 'mensaje' => $trad['mensajes']['registroExitoso']]);
    } else {
        echo json_encode(['exito' => false, 'mensaje' => $trad['mensajes']['registroError'] . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
}
?>
