<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../includes/conexion.php';

function mostrarMensaje($mensaje, $esExito = true, $redir = true) {
    $logo = 'https://shaak4.com/imgs/shaak4_42.png';
    $bgGradient = 'linear-gradient(135deg, #3590b2 60%, #ffde59 100%)';
    $cardBg = 'rgba(255,255,255,0.95)';
    $shadow = '0 8px 32px rgba(53,144,178,0.18), 0 1.5px 16px 0 #ffde59';
    $colorTitulo = '#3590b2';
    $colorTexto = '#37474f';
    $colorBtn = '#ffde59';
    $colorBtnText = '#37474f';
    $colorBtnBorder = '#3590b2';
    $colorCount = '#888';
    $border = '3.5px solid #ffde59';
    $confeti = $esExito ? '<div class="confetti"></div>' : '';
    echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Shaak4 VR - Verificación</title>
    <link rel='stylesheet' href='../estilo/style_v1.14.css'>
    <link href='https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap' rel='stylesheet'>
    <style>
        body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: $bgGradient; overflow-x: hidden; }
        .verif-container { max-width: 440px; width: 100%; position: relative; z-index: 2; }
        .verif-card { box-shadow: $shadow; border-radius: 22px; border: $border; background: $cardBg; padding: 44px 32px 36px 32px; text-align: center; font-family: 'League Spartan', Arial, sans-serif; position: relative; }
        .verif-logo { width: 100px; margin-bottom: 20px; border-radius: 14px; pointer-events: none; filter: drop-shadow(0 2px 8px #eee); transition: none; }
        .verif-title { color: $colorTitulo; margin-bottom: 14px; font-size: 2.1rem; letter-spacing: 1.5px; font-weight: 800; text-shadow: 0 2px 8px #e0e0e0; }
        .verif-msg { color: $colorTexto; font-size: 20px; margin-bottom: 22px; font-weight: 600; line-height: 1.4; }
        .verif-cta { margin-top: 36px; }
        .verif-cta .cta-button { width: auto; padding: 15px 38px; font-size: 20px; background: $colorBtn; color: $colorBtnText; border-radius: 30px; border: 2.5px solid $colorBtnBorder; font-weight: bold; box-shadow: 0 2px 8px #eee; text-decoration: none; transition: background 0.3s, color 0.3s, box-shadow 0.3s; letter-spacing: 1px; }
        .verif-cta .cta-button:hover { background: $colorBtnBorder; color: #fff; box-shadow: 0 4px 16px #3590b2; }
        .verif-countdown { color: $colorCount; font-size: 16px; margin-top: 22px; }
        .verif-celebrate { font-size: 2.5rem; margin-bottom: 10px; }
        /* Confetti animation */
        .confetti { pointer-events: none; position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 10; }
        .confetti span { position: absolute; width: 12px; height: 18px; border-radius: 3px; opacity: 0.85; animation: confetti-fall 1.8s linear infinite; }
        @keyframes confetti-fall {
            0% { transform: translateY(-40px) rotateZ(0deg); }
            100% { transform: translateY(420px) rotateZ(360deg); }
        }
        @media (max-width: 600px) {
            .verif-card { padding: 18px 4vw 18px 4vw; }
            .verif-logo { width: 60px; }
            .verif-title { font-size: 1.3rem; }
        }
    </style>
</head>
<body>";
    if ($esExito) {
        echo "<div class='confetti'></div>";
    }
    echo "<div class='verif-container'>
      <div class='verif-card card'>
        <img src='$logo' alt='Shaak4 VR' class='verif-logo brand-logo' draggable='false'>
        <div class='verif-celebrate'>" . ($esExito ? '🎉' : '⚠️') . "</div>
        <h2 class='verif-title'>Shaak4 VR</h2>
        <div class='verif-msg'>$mensaje</div>";
    if ($redir) {
        echo "<div class='verif-countdown'>Serás redirigido a la página principal en <span id='countdown'>3</span> segundos...</div>";
        echo "<script>let c=3;setInterval(()=>{if(c>1){c--;document.getElementById('countdown').textContent=c;}},1000);</script>";
    }
    echo "<div class='verif-cta'><a href='../index.html' class='cta-button'>Ir a la página principal</a></div>";
    echo "  </div>\n</div>\n<script>if(document.querySelector('.confetti')){for(let i=0;i<32;i++){let s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.background=['#3590b2','#ffde59','#fff','#37474f','#e3f2fd'][Math.floor(Math.random()*5)];s.style.animationDelay=(Math.random()*1.5)+'s';document.querySelector('.confetti').appendChild(s);}}</script>\n</body>\n</html>";
}

if (!isset($_GET['token'])) {
    mostrarMensaje('Token de verificación no proporcionado.', false, false);
    exit;
}

$token = $_GET['token'];

$stmt = $conn->prepare("SELECT id, verificado FROM usuarios WHERE token_verificacion = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$usuario = $result->fetch_assoc();

if (!$usuario) {
    mostrarMensaje('Token inválido o usuario no encontrado.', false, false);
    exit;
}

if ($usuario['verificado']) {
    mostrarMensaje('Tu cuenta ya estaba verificada. ¡Ya puedes iniciar sesión y disfrutar de Shaak4 VR!');
    header('refresh:3;url=../index.html');
    exit;
}

$update = $conn->prepare("UPDATE usuarios SET verificado = 1, token_verificacion = NULL WHERE id = ?");
$update->bind_param("i", $usuario['id']);
if ($update->execute()) {
    mostrarMensaje('¡Cuenta verificada correctamente! Ya puedes iniciar sesión y disfrutar de todas las ventajas de Shaak4 VR.');
    header('refresh:3;url=../index.html');
} else {
    mostrarMensaje('Error al verificar la cuenta. Intenta de nuevo más tarde.', false, false);
}

$stmt->close();
$update->close();
$conn->close();
