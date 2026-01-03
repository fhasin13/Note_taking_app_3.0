<?php
/**
 * Login Page
 * 
 * Allows users to log in to their account.
 */

require_once __DIR__ . '/../php-backend/config/session.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once __DIR__ . '/../php-backend/config/database.php';
    require_once __DIR__ . '/../php-backend/utils/functions.php';
    
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Please provide email and password';
    } else {
        // Find user by email
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([strtolower($email)]);
        $user = $stmt->fetch();
        
        if ($user && verifyPassword($password, $user['password'])) {
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
            
            // Redirect to dashboard
            header('Location: dashboard.php');
            exit;
        } else {
            $error = 'Invalid email or password';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="login-page">
        <div class="login-container">
            <h1>Welcome Back!</h1>
            <p class="subtitle">Login to your account</p>
            
            <?php if ($error): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="POST" action="login.php">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        required
                        value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
                    />
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                    />
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    Login
                </button>
            </form>
            
            <p class="signup-link">
                Don't have an account? <a href="signup.php">Sign up here</a>
            </p>
        </div>
    </div>
</body>
</html>

