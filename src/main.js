// Copyright year
document.querySelectorAll("[data-copyright-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const pxToRem = (value) => `${value / 16}rem`;
const remToPx = (value) => value * 16;
const pointerGapRem = 0.75;
const desktopMediaQuery = window.matchMedia("(min-width: 48rem)");
const reducedMotionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const workLinks = [...document.querySelectorAll("[data-work-link]")];
const workVideos = [...document.querySelectorAll("[data-work-link] video")];

const shouldPlayVideos = () =>
  desktopMediaQuery.matches && !reducedMotionMediaQuery.matches;

const pauseAllWorkVideos = () => {
  workVideos.forEach((video) => {
    video.pause();
  });
};

let videoObserver = null;

const setupVideoObserver = () => {
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }

  pauseAllWorkVideos();

  if (!shouldPlayVideos()) {
    return;
  }

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (!shouldPlayVideos()) {
          video.pause();
          return;
        }

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.35 }
  );

  workVideos.forEach((video) => {
    videoObserver.observe(video);
  });
};

const cursorControllers = workLinks
  .map((link) => {
    const cursorLabel = link.querySelector(".work-cursor-label");

    if (!cursorLabel) {
      return null;
    }

    let cachedWidth = 0;
    let rafId = null;
    let lastEvent = null;

    const measureCursorWidth = () => {
      cachedWidth = cursorLabel.offsetWidth;
    };

    const applyCursorPosition = () => {
      rafId = null;

      if (!lastEvent || !desktopMediaQuery.matches) {
        return;
      }

      const event = lastEvent;
      const rect = link.getBoundingClientRect();
      const pointerGap = remToPx(pointerGapRem);
      const visibleRightEdge = Math.min(rect.right, window.innerWidth);
      const shouldFlip = event.clientX + cachedWidth + pointerGap > visibleRightEdge;
      const offsetX = shouldFlip ? -(cachedWidth + pointerGap) : pointerGap;

      cursorLabel.style.setProperty("--work-pointer-offset-x", pxToRem(offsetX));
      cursorLabel.style.setProperty("--work-pointer-x", pxToRem(event.clientX - rect.left));
      cursorLabel.style.setProperty("--work-pointer-y", pxToRem(event.clientY - rect.top));
    };

    const updateCursorLabel = (event) => {
      if (!desktopMediaQuery.matches) {
        return;
      }

      lastEvent = event;

      if (!rafId) {
        rafId = requestAnimationFrame(applyCursorPosition);
      }
    };

    const handlePointerEnter = (event) => {
      if (!desktopMediaQuery.matches) {
        return;
      }

      measureCursorWidth();
      updateCursorLabel(event);
    };

    const bind = () => {
      link.removeEventListener("pointerenter", handlePointerEnter);
      link.removeEventListener("pointermove", updateCursorLabel);

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      lastEvent = null;

      if (!desktopMediaQuery.matches) {
        cursorLabel.style.removeProperty("--work-pointer-offset-x");
        cursorLabel.style.removeProperty("--work-pointer-x");
        cursorLabel.style.removeProperty("--work-pointer-y");
        return;
      }

      link.addEventListener("pointerenter", handlePointerEnter);
      link.addEventListener("pointermove", updateCursorLabel);
    };

    return { bind, measureCursorWidth };
  })
  .filter(Boolean);

const handleResize = () => {
  cursorControllers.forEach((controller) => {
    if (desktopMediaQuery.matches) {
      controller.measureCursorWidth();
    }
  });
};

const syncMediaQueries = () => {
  setupVideoObserver();
  cursorControllers.forEach((controller) => controller.bind());
};

syncMediaQueries();
desktopMediaQuery.addEventListener("change", syncMediaQueries);
reducedMotionMediaQuery.addEventListener("change", syncMediaQueries);
window.addEventListener("resize", handleResize);
