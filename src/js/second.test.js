test("Scroll", () => {
  const mockLink = document.createElement("a");
  mockLink.setAttribute("href", "#targetSection");
  jest.spyOn(mockLink, "getAttribute").mockReturnValue("#targetSection");
  jest
    .spyOn(document, "querySelector")
    .mockReturnValue(document.createElement("div"));
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});

  // Привязываем обработчик события к моковой ссылке
  const clickHandler = (event) => {
    event.preventDefault();
    const targetId = mockLink.getAttribute("href");
    if (targetId && document.querySelector(targetId)) {
      window.scrollTo({
        top: document.querySelector(targetId).offsetTop,
        behavior: "smooth",
      });
    }
  };
  mockLink.addEventListener("click", clickHandler);

  // Создаем моковое событие клика
  const clickEvent = new Event("click", { bubbles: true });
  jest.spyOn(clickEvent, "preventDefault");
  mockLink.dispatchEvent(clickEvent);

  // Проверки
  expect(clickEvent.preventDefault).toHaveBeenCalled();
  expect(document.querySelector).toHaveBeenCalledWith("#targetSection");
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: document.createElement("div").offsetTop,
    behavior: "smooth",
  });
});
