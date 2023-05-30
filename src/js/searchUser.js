function searchUser(username) {
  const userInfoContainer = document.getElementById("user-info");

  // Создание объекта XMLHttpRequest
  const xhr = new XMLHttpRequest();

  // Установка обработчика события при получении ответа от сервера
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      userInfoContainer.innerHTML = xhr.responseText;
    }
  };

  // Отправка запроса на сервер
  xhr.open(
    "GET",
    "./db/search_user.php?username=" + encodeURIComponent(username),
    true
  );
  xhr.send();
}
