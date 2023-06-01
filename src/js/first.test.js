test("Проверка функции ShowMessage", () => {
  // Создаем заглушки для необходимых элементов и свойств
  const blockId = "block1";
  const currentBlockId = { value: "" }; // Используем объект для возможности изменения значения
  const message = "Hello, world!";

  const blockElement = document.createElement("div");
  blockElement.id = blockId;
  blockElement.getBoundingClientRect = jest.fn(() => ({
    left: 50,
    top: 50,
  }));

  document.getElementById = jest.fn(() => blockElement);

  const messageElement = document.createElement("div");
  document.querySelector = jest.fn(() => null);
  document.createElement = jest.fn(() => messageElement);
  document.body.appendChild = jest.fn();

  const windowMock = {
    scrollX: 0,
    scrollY: 0,
    innerWidth: 500,
  };
  global.window = windowMock;

  // Включаем реализацию функции showMessage здесь
  const showMessage = (currentBlockId, blockId, message) => {
    if (currentBlockId.value === blockId) return;

    const block = document.getElementById(blockId);
    const rect = block.getBoundingClientRect();

    let messageElement = document.querySelector(".message");
    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.classList.add("message");
      document.body.appendChild(messageElement);
    }

    messageElement.innerText = message;

    const messageRect = messageElement.getBoundingClientRect();
    const messageWidth = messageRect.width;

    const leftOffset = rect.left + window.scrollX + 10;
    const topOffset = rect.top + window.scrollY + 10;

    messageElement.style.left = `${leftOffset}px`;
    messageElement.style.top = `${topOffset}px`;

    if (leftOffset + messageWidth > window.innerWidth) {
      messageElement.style.left = `${window.innerWidth - messageWidth - 10}px`;
    }

    messageElement.classList.add("show-message");
    currentBlockId.value = blockId; // Обновляем значение внутри объекта
  };

  // Вызываем функцию
  showMessage(currentBlockId, blockId, message);

  // Проверки
  expect(document.getElementById).toHaveBeenCalledWith(blockId);
  expect(document.querySelector).toHaveBeenCalledWith(".message");
  expect(document.createElement).toHaveBeenCalledWith("div");
  expect(document.body.appendChild).toHaveBeenCalledWith(messageElement);
  expect(messageElement.innerText).toBe(message);
  expect(messageElement.style.left).toBe("60px");
  expect(messageElement.style.top).toBe("60px");
  expect(messageElement.classList.contains("show-message")).toBe(true);
  expect(currentBlockId.value).toBe(blockId); // Обращаемся к свойству value
});
