$(document).ready(function () {
  $("#saveButton").click(function (e) {
    e.preventDefault(); // Предотвращаем отправку формы по умолчанию
    var form = $("#myForm")[0];
    var formData = new FormData(form);
    $.ajax({
      type: "POST",
      url: "form_handler.php",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        $("#message").text(response); // Выводим сообщение от сервера
        if (response.includes("успешно")) {
          window.location.href = "index.html"; // Переадресация на index.html
        }
      },
    });
  });
});
