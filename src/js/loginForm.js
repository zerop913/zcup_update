$(document).ready(function () {
  $("#loginForm").submit(function (e) {
    e.preventDefault();
    var formData = $(this).serialize();

    $.ajax({
      type: "POST",
      url: "./db/login.php",
      data: formData,
      success: function (response) {
        var responseData = JSON.parse(response);
        var status = responseData.status;
        var message = responseData.message;

        if (status === "success_profile") {
          alert("Добро пожаловать, " + message + "!");
          window.location.href = "../index.html";
        } else if (status === "success_filling") {
          alert("Добро пожаловать, " + message + "!");
          window.location.href = "./filling_profile.html";
        } else {
          alert(message);
        }
      },
    });
  });
});
