function toggleMenu() {
  const burger = document.querySelector("#burger");
  const menu = document.querySelector("#mobile-menu");
  const body = document.querySelector("body");
  const heroImage = document.querySelector(".hero-image");

  burger.addEventListener("click", () => {
    burger.classList.toggle("active");
    menu.classList.toggle("hidden");
    menu.classList.toggle("flex");
    body.classList.toggle("overflow-hidden");
    heroImage.classList.toggle("hidden");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767.99) {
      menu.classList.add("hidden");
      menu.classList.remove("flex");
      burger.classList.remove("active");
      body.classList.remove("overflow-hidden");
    }
  });
}

toggleMenu();
