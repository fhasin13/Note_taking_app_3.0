<?php
/**
 * Authentication Controller
 * 
 * Handles user registration (signup) and login.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../utils/functions.php';

/**
 * User Signup (Registration)
 * POST /api/auth/signup.php
 */
function signup() {
    global $pdo;
    
    $data = getJsonInput();
    
    $user_name = $data['user_name'] ?? '';
    $first_name = $data['first_name'] ?? '';
    $last_name = $data['last_name'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $phone = $data['phone'] ?? '';
    $institution = $data['institution'] ?? '';
    $roles = $data['roles'] ?? ['Contributor'];
    
    // Validate required fields
    if (empty($user_name) || empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        errorResponse('Please provide all required fields: user_name, first_name, last_name, email, password', 400);
    }
    
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR user_name = ?");
    $stmt->execute([strtolower($email), $user_name]);
    if ($stmt->fetch()) {
        errorResponse('User with this email or username already exists', 400);
    }
    
    // Generate unique user_id
    $user_id = generateUserId();
    
    // Hash password
    $hashedPassword = hashPassword($password);
    
    // Prepare phone array
    $phoneArray = [];
    if (!empty($phone)) {
        $phoneArray = is_array($phone) ? $phone : [$phone];
    }
    
    // Prepare roles array
    $rolesArray = is_array($roles) ? $roles : ['Contributor'];
    $validRoles = ['Admin', 'Lead Editor', 'Editor', 'Contributor'];
    $rolesArray = array_intersect($rolesArray, $validRoles);
    if (empty($rolesArray)) {
        $rolesArray = ['Contributor'];
    }
    
    // Create new user
    $stmt = $pdo->prepare("
        INSERT INTO users (user_id, user_name, first_name, last_name, email, password, phone, institution, roles, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $stmt->execute([
        $user_id,
        $user_name,
        $first_name,
        $last_name,
        strtolower($email),
        $hashedPassword,
        json_encode($phoneArray),
        $institution,
        json_encode($rolesArray)
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Get created user
    $stmt = $pdo->prepare("SELECT id, user_id, user_name, first_name, last_name, email, phone, institution, roles FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    // Decode JSON fields
    $user['phone'] = json_decode($user['phone'], true) ?? [];
    $user['roles'] = json_decode($user['roles'], true) ?? [];
    
    successResponse([
        'user' => $user
    ], 'User created successfully');
}

/**
 * User Login
 * POST /api/auth/login.php
 */
function login() {
    global $pdo;
    
    $data = getJsonInput();
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    // Validate required fields
    if (empty($email) || empty($password)) {
        errorResponse('Please provide email and password', 400);
    }
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([strtolower($email)]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Invalid email or password', 401);
    }
    
    // Verify password
    if (!verifyPassword($password, $user['password'])) {
        errorResponse('Invalid email or password', 401);
    }
    
    // Prepare user data (without password)
    $userData = [
        'id' => $user['id'],
        'user_id' => $user['user_id'],
        'user_name' => $user['user_name'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'phone' => json_decode($user['phone'], true) ?? [],
        'institution' => $user['institution'],
        'roles' => json_decode($user['roles'], true) ?? []
    ];
    
    // Set session
    setUserSession($userData);
    
    successResponse([
        'user' => $userData
    ], 'Login successful');
}

/**
 * Get Current User
 * GET /api/auth/me.php
 */
function getCurrentUser() {
    requireAuth();
    
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    successResponse(['user' => $user]);
}

// Handle request
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'signup') {
    signup();
} elseif ($method === 'POST' && $action === 'login') {
    login();
} elseif ($method === 'GET' && $action === 'me') {
    getCurrentUser();
} else {
    errorResponse('Invalid request', 400);
}

