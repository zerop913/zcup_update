$(document).ready(function () {
  $("#registrationForm").submit(function (e) {
    e.preventDefault();
    var formData = $(this).serialize();

    // Проверка пустых полей
    var loginInput = document.getElementsByName("login")[0];
    var passInput = document.getElementsByName("pass")[0];
    var repeatPassInput = document.getElementsByName("repeatpass")[0];

    var login = loginInput.value.trim();
    var pass = passInput.value.trim();
    var repeatPass = repeatPassInput.value.trim();

    if (login === "" || pass === "" || repeatPass === "") {
      alert("Заполните все поля.");
      return;
    }

    // Проверка логина
    var loginRegex = /^[a-zA-Z0-9]+$/;
    if (!loginRegex.test(login)) {
      alert("Логин должен состоять только из латинских букв и цифр.");
      return;
    }

    // Проверка пароля
    if (pass.length < 8) {
      alert("Пароль должен содержать не менее 8 символов.");
      return;
    }

    // Проверка повторного ввода пароля
    if (pass !== repeatPass) {
      alert("Пароли не совпадают.");
      return;
    }

    $.ajax({
      type: "POST",
      url: "db/register.php",
      data: formData,
      success: function (response) {
        if (response.trim() === "success") {
          alert("Вы успешно зарегистрировались!");
          window.location.href = "login.html";
        } else {
          alert(response);
        }
      },
    });
  });
});
