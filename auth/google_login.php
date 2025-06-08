<?php
require_once __DIR__ . '/../vendor/autoload.php';

$clientID = '';
$clientSecret = '';
$redirectUri = 'http://localhost/shaak4/auth/google_callback.php';

$provider = new League\OAuth2\Client\Provider\Google([
    'clientId'     => $clientID,
    'clientSecret' => $clientSecret,
    'redirectUri'  => $redirectUri
]);

$authUrl = $provider->getAuthorizationUrl([
    'scope' => [
        'openid',
        'email',
        'profile'
    ]
]);

// Guarda el state en sesión para validación CSRF
session_start();
$_SESSION['oauth2state'] = $provider->getState();

header('Location: ' . $authUrl);
exit;