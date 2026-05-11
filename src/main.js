const pxToRem = (value) => `${value / 16}rem`;
const remToPx = (value) => value * 16;
const pointerGapRem = 0.75;

document.querySelectorAll("[data-work-link]").forEach((link) => {
  const cursorLabel = link.querySelector(".work-cursor-label");

  if (!cursorLabel) {
    return;
  }

  const updateCursorLabel = (event) => {
    const rect = link.getBoundingClientRect();
    const pointerGap = remToPx(pointerGapRem);
    const visibleRightEdge = Math.min(rect.right, window.innerWidth);
    const shouldFlip = event.clientX + cursorLabel.offsetWidth + pointerGap > visibleRightEdge;
    const offsetX = shouldFlip ? -(cursorLabel.offsetWidth + pointerGap) : pointerGap;

    cursorLabel.style.setProperty("--work-pointer-offset-x", pxToRem(offsetX));
    cursorLabel.style.setProperty("--work-pointer-x", pxToRem(event.clientX - rect.left));
    cursorLabel.style.setProperty("--work-pointer-y", pxToRem(event.clientY - rect.top));
  };

  link.addEventListener("pointerenter", updateCursorLabel);
  link.addEventListener("pointermove", updateCursorLabel);
});
