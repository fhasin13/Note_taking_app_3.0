<?php
/**
 * Signup Page
 * 
 * Allows new users to create an account.
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
    
    $user_name = $_POST['user_name'] ?? '';
    $first_name = $_POST['first_name'] ?? '';
    $last_name = $_POST['last_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirmPassword'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $institution = $_POST['institution'] ?? '';
    
    // Validate required fields
    if (empty($user_name) || empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        $error = 'Please provide all required fields';
    } elseif ($password !== $confirmPassword) {
        $error = 'Passwords do not match';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long';
    } else {
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR user_name = ?");
        $stmt->execute([strtolower($email), $user_name]);
        if ($stmt->fetch()) {
            $error = 'User with this email or username already exists';
        } else {
            // Generate unique user_id
            $user_id = generateUserId();
            
            // Hash password
            $hashedPassword = hashPassword($password);
            
            // Prepare phone array
            $phoneArray = [];
            if (!empty($phone)) {
                $phoneArray = [$phone];
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
                json_encode(['Contributor'])
            ]);
            
            $userId = $pdo->lastInsertId();
            
            // Get created user
            $stmt = $pdo->prepare("SELECT id, user_id, user_name, first_name, last_name, email, phone, institution, roles FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            // Decode JSON fields
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
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Note Taking App</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="signup-page">
        <div class="signup-container">
            <h1>Create Account</h1>
            <p class="subtitle">Sign up to get started</p>
            
            <?php if ($error): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="POST" action="signup.php">
                <div class="form-group">
                    <label for="user_name">Username</label>
                    <input
                        type="text"
                        id="user_name"
                        name="user_name"
                        placeholder="Choose a username"
                        required
                        value="<?php echo htmlspecialchars($_POST['user_name'] ?? ''); ?>"
                    />
                </div>
                
                <div class="form-group">
                    <label for="first_name">First Name</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        placeholder="Enter your first name"
                        required
                        value="<?php echo htmlspecialchars($_POST['first_name'] ?? ''); ?>"
                    />
                </div>
                
                <div class="form-group">
                    <label for="last_name">Last Name</label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        placeholder="Enter your last name"
                        required
                        value="<?php echo htmlspecialchars($_POST['last_name'] ?? ''); ?>"
                    />
                </div>
                
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
                    <label for="phone">Phone (Optional)</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="Enter your phone number"
                        value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>"
                    />
                </div>
                
                <div class="form-group">
                    <label for="institution">Institution (Optional)</label>
                    <input
                        type="text"
                        id="institution"
                        name="institution"
                        placeholder="Enter your institution"
                        value="<?php echo htmlspecialchars($_POST['institution'] ?? ''); ?>"
                    />
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password (min 6 characters)"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        required
                    />
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    Sign Up
                </button>
            </form>
            
            <p class="login-link">
                Already have an account? <a href="login.php">Login here</a>
            </p>
        </div>
    </div>
</body>
</html>

