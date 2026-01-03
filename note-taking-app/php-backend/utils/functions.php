<?php
/**
 * Utility Functions
 * 
 * Common helper functions used throughout the application.
 */

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['message' => $message], $statusCode);
}

/**
 * Send success response
 */
function successResponse($data, $message = null) {
    $response = $data;
    if ($message) {
        $response['message'] = $message;
    }
    jsonResponse($response);
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate unique user ID
 */
function generateUserId() {
    return 'USER_' . time() . '_' . bin2hex(random_bytes(4));
}

/**
 * Sanitize input
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

