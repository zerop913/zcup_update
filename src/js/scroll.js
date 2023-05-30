// Находит все ссылки внутри списка в футере
const footerLinks = document.querySelectorAll(".mt-4 a");

// Обрабатывает клик на ссылку
footerLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    // Получает значение атрибута href ссылки (идентификатор секции)
    const targetId = link.getAttribute("href");

    // Проверяет, что целевая секция существует на странице
    if (targetId && document.querySelector(targetId)) {
      // Плавно скроллирует до целевой секции
      window.scrollTo({
        top: document.querySelector(targetId).offsetTop,
        behavior: "smooth",
      });
    }
  });
});
