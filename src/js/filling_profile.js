$(document).ready(function () {
  $("form").submit(function (e) {
    e.preventDefault(); // Предотвращаем обычное поведение отправки формы

    var form = $(this);
    var url = form.attr("action");
    var formData = form.serialize(); // Сериализуем данные формы

    $.ajax({
      type: "POST",
      url: url,
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          // Выводим сообщение об успешном сохранении
          alert(response.message);
          window.location.href = "index.html"; // Переадресация на index.html
        } else {
          // Выводим сообщение об ошибке
          alert(response.message);
        }
      },
      error: function () {
        // Выводим сообщение об ошибке
        alert("Ошибка при отправке формы.");
      },
    });
  });
});
