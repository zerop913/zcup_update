<?php
require_once('db.php');

$login = $_POST['login'];
$pass = $_POST['pass'];

if (empty($login) || empty($pass)) {
    echo 'Заполните все поля';
} else {
    $sql = "SELECT * FROM users WHERE login = '$login'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $hashedPass = $row['pass'];

        if (password_verify($pass, $hashedPass)) {
            session_start();
            $_SESSION['username'] = $row['login'];

            // Проверяем, заполнен ли профиль пользователя
            $check_profile_sql = "SELECT * FROM users_info WHERE login='$login'";
            $check_profile_result = $conn->query($check_profile_sql);
            if ($check_profile_result->num_rows > 0) {
                // Профиль уже заполнен
                $profile_row = $check_profile_result->fetch_assoc();
                $name = $profile_row['name'];
                $response = array('status' => 'success_profile', 'message' => $name);
            } else {
                // Профиль не заполнен
                $response = array('status' => 'success_filling', 'message' => $login);
            }
        } else {
            $response = array('status' => 'error', 'message' => 'Неправильный пароль');
        }
    } else {
        $response = array('status' => 'error', 'message' => 'Нет такого пользователя');
    }

    echo json_encode($response);
}
?>
