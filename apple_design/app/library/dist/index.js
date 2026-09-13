"use client";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { forwardRef, useRef, useState, useId, createElement, useCallback, useEffect, useMemo } from "react";
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return void 0;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);
  return reducedMotion;
}
function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}
function callChange(value, onChange, onValueChange) {
  onChange == null ? void 0 : onChange(value);
  onValueChange == null ? void 0 : onValueChange(value);
}
function clampHeadingLevel(level) {
  const numericLevel = Number(level);
  if (Number.isInteger(numericLevel) && numericLevel >= 1 && numericLevel <= 6) {
    return numericLevel;
  }
  return 2;
}
function isTextInputTarget(target) {
  var _a;
  if (!target) {
    return false;
  }
  const tagName = (_a = target.tagName) == null ? void 0 : _a.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}
const Button = forwardRef(function Button2({
  variant = "primary",
  size = "default",
  href,
  className,
  children,
  disabled: disabledProp = false,
  loading = false,
  onClick,
  tabIndex,
  type,
  ...props
}, ref) {
  const Element = href ? "a" : "button";
  const disabled = disabledProp || loading;
  const elementProps = href ? {
    "aria-disabled": disabled ? "true" : void 0,
    href: disabled ? void 0 : href,
    tabIndex: disabled ? -1 : tabIndex
  } : { disabled, tabIndex, type: type || "button" };
  return /* @__PURE__ */ jsx(
    Element,
    {
      ...props,
      ...elementProps,
      ref,
      "aria-busy": loading ? "true" : props["aria-busy"],
      className: joinClasses(
        "ds-button",
        `ds-button-${variant}`,
        `ds-button-${size}`,
        className
      ),
      "data-loading": loading ? "true" : props["data-loading"],
      onClick: (event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick == null ? void 0 : onClick(event);
      },
      children
    }
  );
});
const SegmentedControl = forwardRef(function SegmentedControl2({
  options = [],
  value,
  defaultValue,
  onChange,
  onValueChange,
  label,
  disabled = false,
  className,
  ...props
}, ref) {
  const groupLabel = label || props["aria-label"] || "Choose an option";
  const optionRefs = useRef([]);
  const isControlled = value !== void 0;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const enabledOptions = options.filter((option) => !option.disabled);
  const selectedIndex = options.findIndex(
    (option) => !option.disabled && option.value === currentValue
  );
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;
  const focusOption = (index) => {
    const focus = () => {
      var _a;
      return (_a = optionRefs.current[index]) == null ? void 0 : _a.focus();
    };
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(focus);
      return;
    }
    focus();
  };
  const commitValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    callChange(nextValue, onChange, onValueChange);
  };
  const selectByIndex = (index) => {
    var _a, _b;
    if (disabled || enabledOptions.length === 0 || options.length === 0) {
      return;
    }
    let nextIndex = Math.max(0, Math.min(index, options.length - 1));
    while (nextIndex < options.length && ((_a = options[nextIndex]) == null ? void 0 : _a.disabled)) {
      nextIndex += 1;
    }
    if (nextIndex >= options.length) {
      nextIndex = options.length - 1;
      while (nextIndex >= 0 && ((_b = options[nextIndex]) == null ? void 0 : _b.disabled)) {
        nextIndex -= 1;
      }
    }
    const nextOption = options[nextIndex];
    commitValue(nextOption.value);
    focusOption(nextIndex);
  };
  const selectByOffset = (offset) => {
    if (enabledOptions.length === 0) {
      return;
    }
    const currentEnabledIndex = enabledOptions.findIndex(
      (option) => {
        var _a;
        return option.value === ((_a = options[activeIndex]) == null ? void 0 : _a.value);
      }
    );
    const startIndex = currentEnabledIndex >= 0 ? currentEnabledIndex : 0;
    const nextEnabledIndex = ((startIndex + offset) % enabledOptions.length + enabledOptions.length) % enabledOptions.length;
    const nextOption = enabledOptions[nextEnabledIndex];
    const nextIndex = options.findIndex((option) => option.value === nextOption.value);
    selectByIndex(nextIndex);
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...props,
      ref,
      className: joinClasses("ds-segmented-control", className),
      role: "radiogroup",
      "aria-label": groupLabel,
      "aria-disabled": disabled ? "true" : void 0,
      children: options.map((option, index) => {
        const optionDisabled = disabled || option.disabled;
        const selected = !option.disabled && option.value === currentValue;
        const focusable = !optionDisabled && index === activeIndex;
        return /* @__PURE__ */ jsx(
          "button",
          {
            className: joinClasses("ds-segmented-option", option.className),
            type: "button",
            role: "radio",
            "aria-checked": selected,
            "aria-disabled": optionDisabled ? "true" : void 0,
            "data-selected": selected ? "true" : void 0,
            disabled: optionDisabled,
            ref: (node) => {
              optionRefs.current[index] = node;
            },
            onClick: () => {
              if (!optionDisabled) {
                commitValue(option.value);
              }
            },
            onKeyDown: (event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                selectByOffset(-1);
              }
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                selectByOffset(1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                selectByIndex(0);
              }
              if (event.key === "End") {
                event.preventDefault();
                selectByIndex(options.length - 1);
              }
            },
            tabIndex: focusable ? 0 : -1,
            children: option.label
          },
          option.value
        );
      })
    }
  );
});
const Toggle = forwardRef(function Toggle2({
  checked,
  defaultChecked,
  onChange,
  label,
  id,
  disabled = false,
  className,
  ...props
}, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputProps = checked === void 0 ? { defaultChecked } : { checked: Boolean(checked) };
  return /* @__PURE__ */ jsxs(
    "label",
    {
      className: joinClasses("ds-toggle", className),
      "data-disabled": disabled ? "true" : void 0,
      htmlFor: inputId,
      children: [
        label ? /* @__PURE__ */ jsx("span", { className: "ds-toggle-label", children: label }) : null,
        /* @__PURE__ */ jsx(
          "input",
          {
            ...props,
            ...inputProps,
            ref,
            id: inputId,
            className: "ds-toggle-input",
            type: "checkbox",
            disabled,
            "aria-label": props["aria-label"] || (label ? void 0 : "Toggle"),
            onChange: (event) => onChange == null ? void 0 : onChange(event.target.checked)
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "ds-toggle-track", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "ds-toggle-thumb" }) })
      ]
    }
  );
});
const Accordion = forwardRef(function Accordion2({ items = [], className, ...props }, ref) {
  return /* @__PURE__ */ jsx("div", { ...props, ref, className: joinClasses("ds-accordion", className), children: items.map((item, index) => {
    const {
      content,
      defaultOpen,
      detailsProps,
      id,
      open,
      title,
      ...itemProps
    } = item;
    const isOpen = open ?? (detailsProps == null ? void 0 : detailsProps.open) ?? defaultOpen;
    return /* @__PURE__ */ createElement(
      "details",
      {
        ...detailsProps,
        ...itemProps,
        className: joinClasses(
          "ds-accordion-item",
          detailsProps == null ? void 0 : detailsProps.className,
          itemProps.className
        ),
        id,
        key: id || `${title}-${index}`,
        open: isOpen ? true : void 0
      },
      /* @__PURE__ */ jsx("summary", { className: "ds-accordion-trigger", children: title }),
      /* @__PURE__ */ jsx("div", { className: "ds-accordion-content", children: content })
    );
  }) });
});
const ProductTile = forwardRef(function ProductTile2({
  title,
  subtitle,
  image,
  imageAlt = "",
  href,
  secondaryHref,
  ctaLabel = "Learn more",
  secondaryCtaLabel = "Buy",
  headingLevel = 2,
  dark = false,
  compact = false,
  className,
  ...props
}, ref) {
  const titleId = useId();
  const Heading = `h${clampHeadingLevel(headingLevel)}`;
  return /* @__PURE__ */ jsxs(
    "article",
    {
      ...props,
      ref,
      className: joinClasses(
        "ds-product-tile",
        dark && "ds-product-tile-dark",
        compact && "ds-product-tile-compact",
        className
      ),
      "aria-labelledby": titleId,
      children: [
        image ? /* @__PURE__ */ jsx(
          "img",
          {
            className: "ds-product-tile-image",
            src: image,
            alt: imageAlt,
            loading: "lazy"
          }
        ) : null,
        /* @__PURE__ */ jsxs("div", { className: "ds-product-tile-copy", children: [
          /* @__PURE__ */ jsx(Heading, { className: "ds-product-tile-title", id: titleId, children: title }),
          subtitle ? /* @__PURE__ */ jsx("p", { className: "ds-product-tile-subtitle", children: subtitle }) : null,
          /* @__PURE__ */ jsxs("div", { className: "ds-product-tile-actions", children: [
            href ? /* @__PURE__ */ jsx(Button, { href, children: ctaLabel }) : null,
            secondaryHref ? /* @__PURE__ */ jsx(Button, { href: secondaryHref, variant: "secondary", children: secondaryCtaLabel }) : null
          ] })
        ] })
      ]
    }
  );
});
const defaultCarouselLabels = {
  carousel: "Featured items",
  previous: "Previous slide",
  next: "Next slide",
  pause: "Pause carousel",
  pauseText: "Pause",
  resume: "Resume carousel",
  resumeText: "Play",
  slidePicker: "Choose slide",
  slideTo: (index, item) => `Show slide ${index + 1}: ${item.title}`
};
const Carousel = forwardRef(function Carousel2({
  items = [],
  interval = 5e3,
  autoPlay = true,
  label,
  labels,
  className,
  ...props
}, ref) {
  const reducedMotion = useReducedMotion();
  const carouselId = useId();
  const viewportRef = useRef(null);
  const touchStartRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const itemCount = items.length;
  const safeInterval = Number.isFinite(interval) && interval >= 1e3 ? interval : 5e3;
  const copy = { ...defaultCarouselLabels, ...labels };
  const displayIndex = itemCount > 0 ? Math.min(activeIndex, itemCount - 1) : 0;
  const canAutoPlay = autoPlay && itemCount > 1 && inViewport && pageVisible && !hovered && !focused && !paused && !reducedMotion;
  const goTo = useCallback(
    (nextIndex) => {
      if (itemCount === 0) {
        return;
      }
      setActiveIndex((nextIndex % itemCount + itemCount) % itemCount);
    },
    [itemCount]
  );
  const goNext = useCallback(() => goTo(displayIndex + 1), [displayIndex, goTo]);
  const goPrevious = useCallback(
    () => goTo(displayIndex - 1),
    [displayIndex, goTo]
  );
  useEffect(() => {
    if (itemCount > 0 && activeIndex >= itemCount) {
      setActiveIndex(itemCount - 1);
    }
  }, [activeIndex, itemCount]);
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return void 0;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(Boolean(entry == null ? void 0 : entry.isIntersecting)),
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") {
      return void 0;
    }
    const updatePageVisibility = () => setPageVisible(!document.hidden);
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);
  useEffect(() => {
    if (!canAutoPlay) {
      return void 0;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemCount);
    }, safeInterval);
    return () => window.clearInterval(timer);
  }, [canAutoPlay, itemCount, safeInterval]);
  const handleKeyDown = (event) => {
    if (isTextInputTarget(event.target)) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };
  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };
  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) {
      return;
    }
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    if (deltaX > 0) {
      goPrevious();
    } else {
      goNext();
    }
  };
  const slides = useMemo(
    () => items.map((item, index) => /* @__PURE__ */ jsx(
      "li",
      {
        className: "ds-carousel-slide",
        "data-active": index === displayIndex ? "true" : void 0,
        id: `${carouselId}-slide-${index}`,
        "aria-hidden": index === displayIndex ? void 0 : "true",
        children: item.href ? /* @__PURE__ */ jsx(
          "a",
          {
            className: "ds-carousel-card",
            href: item.href,
            tabIndex: index === displayIndex ? 0 : -1,
            children: /* @__PURE__ */ jsx(CarouselSlide, { item })
          }
        ) : /* @__PURE__ */ jsx("div", { className: "ds-carousel-card", children: /* @__PURE__ */ jsx(CarouselSlide, { item }) })
      },
      `${item.title}-${index}`
    )),
    [carouselId, displayIndex, items]
  );
  if (itemCount === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxs(
    "section",
    {
      ...props,
      ref,
      className: joinClasses("ds-carousel", className),
      "aria-roledescription": "carousel",
      "aria-label": label || copy.carousel,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      },
      onKeyDown: handleKeyDown,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "ds-carousel-viewport",
            ref: viewportRef,
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
            children: /* @__PURE__ */ jsx(
              "ul",
              {
                className: "ds-carousel-track",
                style: { transform: `translateX(-${displayIndex * 100}%)` },
                "aria-live": canAutoPlay ? "off" : "polite",
                children: slides
              }
            )
          }
        ),
        itemCount > 1 ? /* @__PURE__ */ jsxs(
          "div",
          {
            className: "ds-carousel-controls",
            "aria-controls": `${carouselId}-slide-${displayIndex}`,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "ds-carousel-control",
                  type: "button",
                  onClick: goPrevious,
                  "aria-label": copy.previous,
                  children: "‹"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "ds-carousel-control ds-carousel-pause",
                  type: "button",
                  onClick: () => setPaused((current) => !current),
                  "aria-label": paused ? copy.resume : copy.pause,
                  "aria-pressed": paused,
                  children: paused ? copy.resumeText : copy.pauseText
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "ds-carousel-control",
                  type: "button",
                  onClick: goNext,
                  "aria-label": copy.next,
                  children: "›"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "ds-carousel-dots", "aria-label": copy.slidePicker, children: items.map((item, index) => /* @__PURE__ */ jsx(
                "button",
                {
                  className: "ds-carousel-dot",
                  type: "button",
                  "aria-current": index === displayIndex ? "true" : void 0,
                  "aria-label": copy.slideTo(index, item),
                  "data-active": index === displayIndex ? "true" : void 0,
                  onClick: () => goTo(index)
                },
                `${item.title}-dot-${index}`
              )) })
            ]
          }
        ) : null
      ]
    }
  );
});
function CarouselSlide({ item }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    item.image ? /* @__PURE__ */ jsx(
      "img",
      {
        className: "ds-carousel-image",
        src: item.image,
        alt: item.imageAlt || ""
      }
    ) : /* @__PURE__ */ jsx("span", { className: "ds-carousel-card-fallback", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("span", { className: "ds-carousel-copy", children: [
      /* @__PURE__ */ jsx("span", { className: "ds-carousel-title", children: item.title }),
      item.description ? /* @__PURE__ */ jsx("span", { className: "ds-carousel-description", children: item.description }) : null
    ] })
  ] });
}
const TextField = forwardRef(function TextField2({
  label,
  hint,
  error,
  id: providedId,
  className = "",
  inputClassName = "",
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...inputProps
}, ref) {
  const generatedId = useId();
  const id = providedId || `ds-field-${generatedId}`;
  const hintId = hint ? `${id}-hint` : void 0;
  const errorId = error ? `${id}-error` : void 0;
  const description = [describedBy, hintId, errorId].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ jsxs("div", { className: `ds-field ${className}`, "data-disabled": inputProps.disabled || void 0, children: [
    /* @__PURE__ */ jsxs("label", { className: "ds-field-label", htmlFor: id, children: [
      label,
      inputProps.required && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: " *" })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ...inputProps,
        ref,
        id,
        className: `ds-field-input ${inputClassName}`,
        "aria-describedby": description,
        "aria-invalid": error ? true : invalid
      }
    ),
    hint && /* @__PURE__ */ jsx("p", { className: "ds-field-hint", id: hintId, children: hint }),
    error && /* @__PURE__ */ jsx("p", { className: "ds-field-error", id: errorId, role: "status", children: error })
  ] });
});
const Dialog = forwardRef(function Dialog2({
  open = false,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = "Close dialog",
  initialFocusRef,
  className = "",
  ...props
}, forwardedRef) {
  const id = useId();
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const state = useRef({ open, onOpenChange });
  state.current = { open, onOpenChange };
  const restoreFocus = () => {
    var _a;
    if ((_a = previousFocus.current) == null ? void 0 : _a.isConnected) previousFocus.current.focus({ preventScroll: true });
    previousFocus.current = null;
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement;
      dialog.showModal();
      const target = initialFocusRef == null ? void 0 : initialFocusRef.current;
      if (target && dialog.contains(target)) target.focus({ preventScroll: true });
    } else if (!open && dialog.open) {
      dialog.close();
      restoreFocus();
    }
  }, [open, initialFocusRef]);
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog.open) dialog.close();
      restoreFocus();
    };
  }, []);
  return /* @__PURE__ */ jsxs(
    "dialog",
    {
      ...props,
      className: `ds-dialog ${className}`,
      ref: (node) => {
        dialogRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      "aria-labelledby": `${id}-title`,
      "aria-describedby": description ? `${id}-description` : void 0,
      onCancel: (event) => {
        var _a, _b, _c;
        (_a = props.onCancel) == null ? void 0 : _a.call(props, event);
        const cancelled = event.defaultPrevented;
        event.preventDefault();
        if (!cancelled) (_c = (_b = state.current).onOpenChange) == null ? void 0 : _c.call(_b, false);
      },
      onClose: (event) => {
        var _a, _b, _c;
        (_a = props.onClose) == null ? void 0 : _a.call(props, event);
        if (state.current.open && !event.currentTarget.open) (_c = (_b = state.current).onOpenChange) == null ? void 0 : _c.call(_b, false);
        if (!event.currentTarget.open) restoreFocus();
      },
      onClick: (event) => {
        var _a, _b, _c;
        (_a = props.onClick) == null ? void 0 : _a.call(props, event);
        if (event.defaultPrevented || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          (_c = (_b = state.current).onOpenChange) == null ? void 0 : _c.call(_b, false);
        }
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "ds-dialog-header", children: [
          /* @__PURE__ */ jsx("h2", { className: "ds-dialog-title", id: `${id}-title`, children: title }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "ds-dialog-close", "aria-label": closeLabel, onClick: () => {
            var _a, _b;
            return (_b = (_a = state.current).onOpenChange) == null ? void 0 : _b.call(_a, false);
          }, children: "×" })
        ] }),
        description && /* @__PURE__ */ jsx("p", { className: "ds-dialog-description", id: `${id}-description`, children: description }),
        /* @__PURE__ */ jsx("div", { className: "ds-dialog-body", children }),
        footer && /* @__PURE__ */ jsx("div", { className: "ds-dialog-footer", children: footer })
      ]
    }
  );
});
const apple = { "font": { "text": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', "display": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }, "color": { "black": "#1d1d1f", "canvas": "#f5f5f7", "blue": "#0071e3", "blueHover": "#0069d4", "blueActive": "#006edb", "link": "#0066cc", "muted": "#6e6e73", "white": "#ffffff", "surface": "#ffffff", "surfaceHover": "#ededf0", "border": "rgba(0, 0, 0, 0.16)", "borderStrong": "rgba(0, 0, 0, 0.46)", "scrim": "rgba(255, 255, 255, 0.8)", "darkScrim": "rgba(29, 29, 31, 0.72)", "focus": "#0071e3", "danger": "#b42318", "success": "#16713f", "onAction": "#ffffff", "controlFill": "rgba(0, 0, 0, 0.06)", "controlActive": "#ffffff" }, "breakpoint": { "small": 734, "medium": 1068 }, "text": { "displayXl": { "fontSize": 56, "lineHeight": 60 }, "displayLg": { "fontSize": 40, "lineHeight": 44 }, "displayMd": { "fontSize": 32, "lineHeight": 36 }, "title": { "fontSize": 28, "lineHeight": 32 }, "body": { "fontSize": 17, "lineHeight": 25 }, "caption": { "fontSize": 12, "lineHeight": 16 } }, "radius": { "pill": 980, "card": 8 }, "space": { "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32, "12": 48, "16": 64 }, "button": { "size": 17, "line": 20, "smallSize": 14, "smallLine": 18 }, "motion": { "standard": "280ms cubic-bezier(0.4, 0, 0.6, 1)", "fast": "160ms ease-out" }, "shadow": { "card": "0 8px 30px rgba(0, 0, 0, 0.12)" } };
const themes = { "dark": { "color": { "black": "#f5f5f7", "canvas": "#232326", "surface": "#1d1d1f", "surfaceHover": "#353538", "muted": "#a1a1a6", "border": "rgba(255, 255, 255, 0.22)", "borderStrong": "rgba(255, 255, 255, 0.5)", "link": "#64adff", "focus": "#64adff", "danger": "#ff958b", "success": "#77d9a1", "controlFill": "rgba(255, 255, 255, 0.12)", "controlActive": "#454548" }, "shadow": { "card": "0 8px 30px rgba(0, 0, 0, 0.35)" } } };
const tokens = {
  apple,
  themes
};
export {
  Accordion,
  Button,
  Carousel,
  Dialog,
  ProductTile,
  SegmentedControl,
  TextField,
  Toggle,
  tokens,
  useReducedMotion
};
