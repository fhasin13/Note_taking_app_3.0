<?php
/**
 * Index Page
 * 
 * Redirects to dashboard if logged in, otherwise to login page.
 */

require_once __DIR__ . '/../php-backend/config/session.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;

