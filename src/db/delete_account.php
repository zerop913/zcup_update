<?php
session_start();
if (isset($_SESSION['username'])) {
    require_once('db.php'); // Подключение к базе данных

    $login = $_SESSION['username'];

    // Функция для удаления аккаунта из базы данных
    function deleteAccount($login)
    {
        global $conn;
        // Удаление записи о пользователе из таблицы "users"
        $delete_user_sql = "DELETE FROM users WHERE login = '$login'";
        // Удаление связанных данных из других таблиц, связанных с пользователем
        $delete_user_info_sql = "DELETE FROM users_info WHERE login = '$login'";

        // Запуск запроса на удаление аккаунта
        if ($conn->query($delete_user_sql) === TRUE && $conn->query($delete_user_info_sql) === TRUE) {
            // Успешно удалено
            session_unset(); // Очистка сеанса для удаления данных о пользователе
            session_destroy(); // Уничтожение сеанса
            echo 'success';
        } else {
            // Ошибка при удалении
            echo 'error';
        }
    }

    // Вызов функции для удаления аккаунта
    deleteAccount($login);
} else {
    echo 'not_logged_in';
}
?>
