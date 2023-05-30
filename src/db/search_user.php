<?php
session_start();
include('db.php');

if (isset($_GET['username'])) {
  $username = $_GET['username'];

  $sql = "SELECT * FROM users_info WHERE login='$username' OR CONCAT(name, ' ', surname)='$username'";
  $result = $conn->query($sql);

  if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $name = $row['name'];
    $surname = $row['surname'];
    $about = $row['about'];
    $email = $row['email'];
    $time3 = $row['time3'];
    $time2 = $row['time2'];

    echo '<p class="pt-10 text-2xl text-center leading-normal text-[#706C83] md:text-xl sm:text-base">
            <span class="font-bold text-white">Имя:</span> ' . $name . '<br>
            <span class="font-bold text-white">Фамилия:</span> ' . $surname . '<br>
            <span class="font-bold text-white">О себе:</span> ' . $about . '<br>
            <span class="font-bold text-white">Email:</span> ' . $email . '<br>
            <span class="font-bold text-white">Лучшее время 3х3:</span> ' . $time3 . '<br>
            <span class="font-bold text-white">Лучшее время 2х2:</span> ' . $time2 . '<br>
          </p>';
  } else {
    echo '<p class="pt-10 text-2xl text-center leading-normal text-[#706C83] md:text-xl sm:text-base">Пользователь не найден</p>';
  }
}
?>
