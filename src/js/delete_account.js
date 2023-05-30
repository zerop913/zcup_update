$(document).ready(function () {
  // Обработчик клика по кнопке "Удалить аккаунт"
  $("#delete-account-btn").click(function (e) {
    e.preventDefault();

    // Отправка AJAX-запроса на удаление аккаунта
    $.ajax({
      url: "./db/delete_account.php",
      type: "POST",
      success: function (response) {
        if (response === "success") {
          alert("Аккаунт успешно удален");
          window.location.href = "./login.html";
        } else {
          alert("Ошибка при удалении аккаунта");
        }
      },
    });
  });
});
