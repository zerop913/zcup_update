let currentBlockId = null;

function showMessage(blockId, message) {
  if (currentBlockId === blockId) return;

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
  currentBlockId = blockId;
}

function hideMessage() {
  const messageElement = document.querySelector(".message");
  if (messageElement) {
    messageElement.classList.remove("show-message");
    currentBlockId = null;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const blocks = document.querySelectorAll(".custom-rect");
  blocks.forEach(function (block) {
    block.addEventListener("mouseleave", function () {
      hideMessage();
    });
  });
});
