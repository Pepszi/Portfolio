// Loads animated SVG icons into About cards and plays them one at a time with pauses between.

const PAUSE_MS = 500;
const ICON_DURATIONS_MS = {
  document: 2000,
  chat: 1200,
  checkmark: 1200,
  corners: 1200,
  lines: 1200,
  code: 1200,
  pixels: 1200,
  frames: 1200,
};

const prepareSvgMarkup = (markup) =>
  markup
    .replace(/\bfill="black"/g, 'fill="currentColor"')
    .replace(/\bstroke="black"/g, 'stroke="currentColor"')
    .replace(/fill:black/g, "fill:currentColor")
    .replace(/stroke:black/g, "stroke:currentColor")
    .replace(/<svg([^>]*)\swidth="24"/i, "<svg$1")
    .replace(/<svg([^>]*)\sheight="24"/i, "<svg$1")
    .replace(/(\d+(?:\.\d+)?s)\s+linear\s+infinite/g, "$1 linear 1");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const uniquifySvgIds = (svgEl, prefix) => {
  const idMap = new Map();

  svgEl.querySelectorAll("style").forEach((styleEl) => {
    let css = styleEl.textContent;
    const keyframeNames = [...css.matchAll(/@keyframes\s+([^\s{]+)/g)].map((match) => match[1]);

    [...new Set(keyframeNames)]
      .sort((a, b) => b.length - a.length)
      .forEach((name) => {
        const scopedName = `${prefix}-${name}`;
        css = css.replaceAll(`@keyframes ${name}`, `@keyframes ${scopedName}`);
        css = css.replaceAll(`animation: ${name} `, `animation: ${scopedName} `);
      });

    styleEl.textContent = css;
  });

  svgEl.querySelectorAll("[id]").forEach((el) => {
    const nextId = `${prefix}-${el.id}`;
    idMap.set(el.id, nextId);
    el.id = nextId;
  });

  svgEl.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (!attr.value.includes("url(#")) {
        return;
      }

      el.setAttribute(
        attr.name,
        attr.value.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${idMap.get(id) ?? `${prefix}-${id}`})`)
      );
    });
  });

  svgEl.querySelectorAll("style").forEach((styleEl) => {
    let css = styleEl.textContent;

    [...idMap.entries()]
      .sort(([a], [b]) => b.length - a.length)
      .forEach(([oldId, newId]) => {
        css = css.replace(
          new RegExp(`#${escapeRegExp(oldId)}(?=[\\s.{,])`, "g"),
          `#${newId}`
        );
      });

    styleEl.textContent = css;
  });
};

const prepareSvgElement = (svgEl) => {
  svgEl.querySelectorAll("style").forEach((styleEl) => {
    styleEl.textContent = styleEl.textContent.replace(/\binfinite\b/g, "1");
  });

  svgEl.querySelectorAll("animate").forEach((animateEl) => {
    animateEl.setAttribute("repeatCount", "1");
    animateEl.setAttribute("begin", "indefinite");
  });
};

const decorateIcon = (svgEl, iconName) => {
  svgEl.classList.add("about-card__icon");
  svgEl.dataset.aboutIcon = iconName;
  svgEl.setAttribute("aria-hidden", "true");
  svgEl.setAttribute("role", "img");
};

const freezeIcon = (svgEl) => {
  if (!svgEl) {
    return;
  }

  svgEl.classList.remove("is-active");

  svgEl.querySelectorAll("*").forEach((el) => {
    const { animationName, animationDuration } = getComputedStyle(el);

    if (!animationName || animationName === "none") {
      return;
    }

    const durationMs = Number.parseFloat(animationDuration) * 1000 || 1200;

    el.style.animation = "";
    el.style.animationFillMode = "forwards";
    el.style.animationPlayState = "paused";
    el.style.animationDelay = `-${durationMs}ms`;
  });

  svgEl.querySelectorAll("rect").forEach((rectEl) => {
    if (rectEl.querySelector("animate")) {
      rectEl.setAttribute("width", "5");
    }
  });
};

const startSmilAnimations = (svgEl) => {
  svgEl.querySelectorAll("rect").forEach((rectEl) => {
    if (rectEl.querySelector("animate")) {
      rectEl.setAttribute("width", "0");
    }
  });

  svgEl.querySelectorAll("animate").forEach((animateEl) => {
    if (typeof animateEl.beginElement === "function") {
      animateEl.beginElement();
    }
  });
};

const kickCssAnimations = (svgEl) => {
  const configs = [];

  svgEl.querySelectorAll("*").forEach((el) => {
    const style = getComputedStyle(el);

    if (!style.animationName || style.animationName === "none") {
      return;
    }

    configs.push({
      el,
      value: `${style.animationName} ${style.animationDuration} ${style.animationTimingFunction} 0s 1 normal none running`,
    });
  });

  configs.forEach(({ el }) => {
    el.style.animation = "none";
  });

  void svgEl.offsetWidth;

  configs.forEach(({ el, value }) => {
    el.style.animation = value;
  });
};

const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForIconAnimation = (durationMs) => delay(durationMs + 100);

export const initAboutIcons = (reducedMotionMediaQuery) => {
  const iconPlaceholders = [...document.querySelectorAll("[data-about-icon]")];

  if (!iconPlaceholders.length) {
    return;
  }

  const aboutGrid = document.querySelector(".about-grid");

  if (!aboutGrid) {
    return;
  }

  const iconTemplates = new Map();
  let cycleIndex = 0;
  let cycleRunning = false;
  let isSectionVisible = false;

  const getIcons = () => [...document.querySelectorAll(".about-card__icon[data-about-icon]")];

  const shouldRunCycle = () =>
    isSectionVisible && !reducedMotionMediaQuery.matches && getIcons().length > 0;

  const loadIcons = async () => {
    for (const placeholder of iconPlaceholders) {
      const iconName = placeholder.dataset.aboutIcon;

      if (!iconName) {
        continue;
      }

      const response = await fetch(`./assets/icons/${iconName}.svg`);

      if (!response.ok) {
        continue;
      }

      const template = document.createElement("template");
      template.innerHTML = prepareSvgMarkup(await response.text());

      const templateSvg = template.content.querySelector("svg");

      if (!templateSvg) {
        continue;
      }

      uniquifySvgIds(templateSvg, iconName);
      prepareSvgElement(templateSvg);
      iconTemplates.set(iconName, templateSvg);

      const initialSvg = templateSvg.cloneNode(true);
      decorateIcon(initialSvg, iconName);
      placeholder.replaceWith(initialSvg);
      freezeIcon(initialSvg);
    }
  };

  const mountFreshIcon = (iconName, currentSvg) => {
    const template = iconTemplates.get(iconName);

    if (!template || !currentSvg) {
      return currentSvg;
    }

    const freshSvg = template.cloneNode(true);
    decorateIcon(freshSvg, iconName);
    currentSvg.replaceWith(freshSvg);
    return freshSvg;
  };

  const playIcon = async (iconName) => {
    const durationMs = ICON_DURATIONS_MS[iconName] ?? 1200;
    const currentSvg = document.querySelector(`.about-card__icon[data-about-icon="${iconName}"]`);

    if (!currentSvg) {
      return;
    }

    const svgEl = mountFreshIcon(iconName, currentSvg);
    svgEl.classList.add("is-active");
    await nextFrame();
    kickCssAnimations(svgEl);
    startSmilAnimations(svgEl);

    await waitForIconAnimation(durationMs);

    if (!shouldRunCycle()) {
      freezeIcon(svgEl);
      return;
    }

    freezeIcon(svgEl);
    await delay(PAUSE_MS);
  };

  const runCycle = async () => {
    if (cycleRunning) {
      return;
    }

    cycleRunning = true;

    while (shouldRunCycle()) {
      const icons = getIcons();
      const iconName = icons[cycleIndex]?.dataset.aboutIcon;

      if (iconName) {
        await playIcon(iconName);
      }

      if (!shouldRunCycle()) {
        break;
      }

      cycleIndex = (cycleIndex + 1) % icons.length;
    }

    cycleRunning = false;
  };

  const startCycle = () => {
    if (!shouldRunCycle()) {
      return;
    }

    runCycle();
  };

  loadIcons().then(() => {
    if (!getIcons().length) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionVisible = entry.isIntersecting;

        if (shouldRunCycle()) {
          startCycle();
        }
      },
      { threshold: 0 }
    );

    observer.observe(aboutGrid);

    reducedMotionMediaQuery.addEventListener("change", () => {
      if (shouldRunCycle()) {
        startCycle();
      }
    });
  });
};
