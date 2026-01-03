<?php
/**
 * Logout Handler
 * 
 * Clears user session and redirects to login page.
 */

require_once __DIR__ . '/../php-backend/config/session.php';

clearUserSession();

header('Location: login.php');
exit;

