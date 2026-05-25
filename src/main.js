document.querySelectorAll("[data-copyright-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const pxToRem = (value) => `${value / 16}rem`;
const remToPx = (value) => value * 16;
const pointerGapRem = 0.75;
const desktopMediaQuery = window.matchMedia("(min-width: 48rem)");

const syncWorkVideos = () => {
  document.querySelectorAll("[data-work-link] video").forEach((video) => {
    if (desktopMediaQuery.matches) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
  });
};

syncWorkVideos();
desktopMediaQuery.addEventListener("change", syncWorkVideos);

document.querySelectorAll("[data-work-link]").forEach((link) => {
  const cursorLabel = link.querySelector(".work-cursor-label");

  if (!cursorLabel) {
    return;
  }

  const updateCursorLabel = (event) => {
    if (!desktopMediaQuery.matches) {
      return;
    }

    const rect = link.getBoundingClientRect();
    const pointerGap = remToPx(pointerGapRem);
    const visibleRightEdge = Math.min(rect.right, window.innerWidth);
    const shouldFlip = event.clientX + cursorLabel.offsetWidth + pointerGap > visibleRightEdge;
    const offsetX = shouldFlip ? -(cursorLabel.offsetWidth + pointerGap) : pointerGap;

    cursorLabel.style.setProperty("--work-pointer-offset-x", pxToRem(offsetX));
    cursorLabel.style.setProperty("--work-pointer-x", pxToRem(event.clientX - rect.left));
    cursorLabel.style.setProperty("--work-pointer-y", pxToRem(event.clientY - rect.top));
  };

  const bindCursorLabel = () => {
    link.removeEventListener("pointerenter", updateCursorLabel);
    link.removeEventListener("pointermove", updateCursorLabel);

    if (!desktopMediaQuery.matches) {
      cursorLabel.style.removeProperty("--work-pointer-offset-x");
      cursorLabel.style.removeProperty("--work-pointer-x");
      cursorLabel.style.removeProperty("--work-pointer-y");
      return;
    }

    link.addEventListener("pointerenter", updateCursorLabel);
    link.addEventListener("pointermove", updateCursorLabel);
  };

  bindCursorLabel();
  desktopMediaQuery.addEventListener("change", bindCursorLabel);
});
