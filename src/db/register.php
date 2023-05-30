<?php
require_once('db.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = $_POST['login'];
    $pass = $_POST['pass'];
    $repeatpass = $_POST['repeatpass'];

    if (empty($login) || empty($pass) || empty($repeatpass)) {
        echo 'Заполните все поля';
    } else {
        $check_sql = "SELECT * FROM users WHERE login='$login'";
        $check_result = $conn->query($check_sql);
        if ($check_result->num_rows > 0) {
            echo 'Этот логин уже занят. Попробуйте другой';
        } else {
            if ($pass != $repeatpass) {
                echo 'Пароли не совпадают';
            } else if (strlen($pass) < 8) {
                echo 'Пароль должен содержать не менее 8 символов';
            } else {
                // Хеширование пароля
                $hashedPass = password_hash($pass, PASSWORD_DEFAULT);

                $sql = "INSERT INTO users (login, pass) VALUES ('$login', '$hashedPass')";
                if ($conn->query($sql) === TRUE) {
                    session_start();
                    $_SESSION['username'] = $login;
                    echo 'success';
                } else {
                    echo 'Ошибка при регистрации, попробуйте еще раз';
                }
            }
        }
    }
    exit;
}
?>
