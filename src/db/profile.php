<?php
session_start();
include('db.php');

if (isset($_SESSION['username'])) {
  $login = $_SESSION['username'];
  $sql = "SELECT * FROM users_info WHERE login='$login'";
  $result = $conn->query($sql);

  if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $name = $row['name'];
    $surname = $row['surname'];
    $about = $row['about'];
    $email = $row['email'];
    $time3 = $row['time3'];
    $time2 = $row['time2'];
  }
}
?>

<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="../css/output.css" />
</head>
<body>
  <section>
    <div class="container mx-auto px-[94px] lg:px-[47px] md:px-[23.5px] sm:px-[11.75px]">
      <?php if (isset($name)): ?>
        <p class="text-2xl leading-normal text-[#706C83] md:text-xl sm:text-base">
          <span class="font-bold text-white">Имя:</span> <?php echo $name; ?><br>
          <span class="font-bold text-white">Фамилия:</span> <?php echo $surname; ?><br>
          <span class="font-bold text-white">О себе:</span> <?php echo $about; ?><br>
          <span class="font-bold text-white">Email:</span> <?php echo $email; ?><br>
          <span class="font-bold text-white">Лучшее время 3х3:</span> <?php echo $time3; ?><br>
          <span class="font-bold text-white">Лучшее время 2х2:</span> <?php echo $time2; ?><br>
        </p>
      <?php endif; ?>
    </div>
  </section>
</body>
</html>
