<?php
session_start();
include('db.php');

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['username'])) {
        $response['success'] = false;
        $response['message'] = "Вы не авторизованы! Пожалуйста, войдите.";
        echo json_encode($response);
        exit;
    }

    $name = $_POST['name'];
    $surname = $_POST['surname'];
    $about = $_POST['about'];
    $email = $_POST['email'];
    $time3 = $_POST['time3'];
    $time2 = $_POST['time2'];

    // Проверка имени и фамилии на наличие только букв (русских и латинских)
    if (!preg_match('/^[a-zA-Zа-яА-Я]+$/u', $name) || !preg_match('/^[a-zA-Zа-яА-Я]+$/u', $surname)) {
        $response['success'] = false;
        $response['message'] = "Имя и фамилия должны содержать только буквы!";
        echo json_encode($response);
        exit;
    }

    if ($name && $surname && $about && $email && $time3 && $time2) {
        $login = $_SESSION['username'];

        $check_sql = "SELECT * FROM users_info WHERE login='$login'";
        $check_result = $conn->query($check_sql);
        if ($check_result->num_rows > 0) {
            $response['success'] = false;
            $response['message'] = "Профиль с данным логином уже заполнен!";
        } else {
            $sql = "INSERT INTO users_info (login, name, surname, about, email, time3, time2) VALUES ('$login', '$name', '$surname', '$about', '$email', '$time3', '$time2')";
            if (mysqli_query($conn, $sql)) {
                $response['success'] = true;
                $response['message'] = "Данные успешно сохранены!";
            } else {
                $response['success'] = false;
                $response['message'] = "Ошибка при сохранении данных: " . mysqli_error($conn);
            }
        }
    } else {
        $response['success'] = false;
        $response['message'] = "Все поля должны быть заполнены!";
    }

    echo json_encode($response);
} else {
    if (!isset($_SESSION['username'])) {
        echo '<script>alert("Вы не авторизованы! Пожалуйста, войдите."); window.location.href = "../login.html";</script>';
        exit;
    }
}
?>
