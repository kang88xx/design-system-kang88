import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
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
  onChange?.(value);
  onValueChange?.(value);
}

function clampHeadingLevel(level) {
  const numericLevel = Number(level);

  if (Number.isInteger(numericLevel) && numericLevel >= 1 && numericLevel <= 6) {
    return numericLevel;
  }

  return 2;
}

function isTextInputTarget(target) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export const Button = forwardRef(function Button(
  {
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
  },
  ref,
) {
  const Element = href ? "a" : "button";
  const disabled = disabledProp || loading;
  const elementProps = href
    ? {
        "aria-disabled": disabled ? "true" : undefined,
        href: disabled ? undefined : href,
        tabIndex: disabled ? -1 : tabIndex,
      }
    : { disabled, tabIndex, type: type || "button" };

  return (
    <Element
      {...props}
      {...elementProps}
      ref={ref}
      aria-busy={loading ? "true" : props["aria-busy"]}
      className={joinClasses(
        "ds-button",
        `ds-button-${variant}`,
        `ds-button-${size}`,
        className,
      )}
      data-loading={loading ? "true" : props["data-loading"]}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onClick?.(event);
      }}
    >
      {children}
    </Element>
  );
});

export const SegmentedControl = forwardRef(function SegmentedControl(
  {
    options = [],
    value,
    defaultValue,
    onChange,
    onValueChange,
    label,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const groupLabel = label || props["aria-label"] || "Choose an option";
  const optionRefs = useRef([]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const enabledOptions = options.filter((option) => !option.disabled);
  const selectedIndex = options.findIndex(
    (option) => !option.disabled && option.value === currentValue,
  );
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;

  const focusOption = (index) => {
    const focus = () => optionRefs.current[index]?.focus();

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
    if (disabled || enabledOptions.length === 0 || options.length === 0) {
      return;
    }

    let nextIndex = Math.max(0, Math.min(index, options.length - 1));

    while (nextIndex < options.length && options[nextIndex]?.disabled) {
      nextIndex += 1;
    }

    if (nextIndex >= options.length) {
      nextIndex = options.length - 1;

      while (nextIndex >= 0 && options[nextIndex]?.disabled) {
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
      (option) => option.value === options[activeIndex]?.value,
    );
    const startIndex = currentEnabledIndex >= 0 ? currentEnabledIndex : 0;
    const nextEnabledIndex =
      ((startIndex + offset) % enabledOptions.length + enabledOptions.length) %
      enabledOptions.length;
    const nextOption = enabledOptions[nextEnabledIndex];
    const nextIndex = options.findIndex((option) => option.value === nextOption.value);

    selectByIndex(nextIndex);
  };

  return (
    <div
      {...props}
      ref={ref}
      className={joinClasses("ds-segmented-control", className)}
      role="radiogroup"
      aria-label={groupLabel}
      aria-disabled={disabled ? "true" : undefined}
    >
      {options.map((option, index) => {
        const optionDisabled = disabled || option.disabled;
        const selected = !option.disabled && option.value === currentValue;
        const focusable = !optionDisabled && index === activeIndex;

        return (
          <button
            className={joinClasses("ds-segmented-option", option.className)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={optionDisabled ? "true" : undefined}
            data-selected={selected ? "true" : undefined}
            disabled={optionDisabled}
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            onClick={() => {
              if (!optionDisabled) {
                commitValue(option.value);
              }
            }}
            onKeyDown={(event) => {
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
            }}
            tabIndex={focusable ? 0 : -1}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

export const Toggle = forwardRef(function Toggle(
  {
    checked,
    defaultChecked,
    onChange,
    label,
    id,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputProps =
    checked === undefined ? { defaultChecked } : { checked: Boolean(checked) };

  return (
    <label
      className={joinClasses("ds-toggle", className)}
      data-disabled={disabled ? "true" : undefined}
      htmlFor={inputId}
    >
      {label ? <span className="ds-toggle-label">{label}</span> : null}
      <input
        {...props}
        {...inputProps}
        ref={ref}
        id={inputId}
        className="ds-toggle-input"
        type="checkbox"
        disabled={disabled}
        aria-label={
          props["aria-label"] || (label ? undefined : "Toggle")
        }
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="ds-toggle-track" aria-hidden="true">
        <span className="ds-toggle-thumb" />
      </span>
    </label>
  );
});

export const Accordion = forwardRef(function Accordion(
  { items = [], className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={joinClasses("ds-accordion", className)}>
      {items.map((item, index) => {
        const {
          content,
          defaultOpen,
          detailsProps,
          id,
          open,
          title,
          ...itemProps
        } = item;
        const isOpen = open ?? detailsProps?.open ?? defaultOpen;

        return (
          <details
            {...detailsProps}
            {...itemProps}
            className={joinClasses(
              "ds-accordion-item",
              detailsProps?.className,
              itemProps.className,
            )}
            id={id}
            key={id || `${title}-${index}`}
            open={isOpen ? true : undefined}
          >
            <summary className="ds-accordion-trigger">{title}</summary>
            <div className="ds-accordion-content">{content}</div>
          </details>
        );
      })}
    </div>
  );
});

export const ProductTile = forwardRef(function ProductTile(
  {
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
  },
  ref,
) {
  const titleId = useId();
  const Heading = `h${clampHeadingLevel(headingLevel)}`;

  return (
    <article
      {...props}
      ref={ref}
      className={joinClasses(
        "ds-product-tile",
        dark && "ds-product-tile-dark",
        compact && "ds-product-tile-compact",
        className,
      )}
      aria-labelledby={titleId}
    >
      {image ? (
        <img
          className="ds-product-tile-image"
          src={image}
          alt={imageAlt}
          loading="lazy"
        />
      ) : null}
      <div className="ds-product-tile-copy">
        <Heading className="ds-product-tile-title" id={titleId}>
          {title}
        </Heading>
        {subtitle ? (
          <p className="ds-product-tile-subtitle">{subtitle}</p>
        ) : null}
        <div className="ds-product-tile-actions">
          {href ? <Button href={href}>{ctaLabel}</Button> : null}
          {secondaryHref ? (
            <Button href={secondaryHref} variant="secondary">
              {secondaryCtaLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
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
  slideTo: (index, item) => `Show slide ${index + 1}: ${item.title}`,
};

export const Carousel = forwardRef(function Carousel(
  {
    items = [],
    interval = 5000,
    autoPlay = true,
    label,
    labels,
    className,
    ...props
  },
  ref,
) {
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
  const safeInterval =
    Number.isFinite(interval) && interval >= 1000 ? interval : 5000;
  const copy = { ...defaultCarouselLabels, ...labels };
  const displayIndex =
    itemCount > 0 ? Math.min(activeIndex, itemCount - 1) : 0;

  const canAutoPlay =
    autoPlay &&
    itemCount > 1 &&
    inViewport &&
    pageVisible &&
    !hovered &&
    !focused &&
    !paused &&
    !reducedMotion;

  const goTo = useCallback(
    (nextIndex) => {
      if (itemCount === 0) {
        return;
      }

      setActiveIndex(((nextIndex % itemCount) + itemCount) % itemCount);
    },
    [itemCount],
  );

  const goNext = useCallback(() => goTo(displayIndex + 1), [displayIndex, goTo]);
  const goPrevious = useCallback(
    () => goTo(displayIndex - 1),
    [displayIndex, goTo],
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
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
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
      return undefined;
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
    () =>
      items.map((item, index) => (
        <li
          className="ds-carousel-slide"
          data-active={index === displayIndex ? "true" : undefined}
          id={`${carouselId}-slide-${index}`}
          aria-hidden={index === displayIndex ? undefined : "true"}
          key={`${item.title}-${index}`}
        >
          {item.href ? (
            <a
              className="ds-carousel-card"
              href={item.href}
              tabIndex={index === displayIndex ? 0 : -1}
            >
              <CarouselSlide item={item} />
            </a>
          ) : (
            <div className="ds-carousel-card">
              <CarouselSlide item={item} />
            </div>
          )}
        </li>
      )),
    [carouselId, displayIndex, items],
  );

  if (itemCount === 0) {
    return null;
  }

  return (
    <section
      {...props}
      ref={ref}
      className={joinClasses("ds-carousel", className)}
      aria-roledescription="carousel"
      aria-label={label || copy.carousel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="ds-carousel-viewport"
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <ul
          className="ds-carousel-track"
          style={{ transform: `translateX(-${displayIndex * 100}%)` }}
          aria-live={canAutoPlay ? "off" : "polite"}
        >
          {slides}
        </ul>
      </div>
      {itemCount > 1 ? (
        <div
          className="ds-carousel-controls"
          aria-controls={`${carouselId}-slide-${displayIndex}`}
        >
          <button
            className="ds-carousel-control"
            type="button"
            onClick={goPrevious}
            aria-label={copy.previous}
          >
            ‹
          </button>
          <button
            className="ds-carousel-control ds-carousel-pause"
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? copy.resume : copy.pause}
            aria-pressed={paused}
          >
            {paused ? copy.resumeText : copy.pauseText}
          </button>
          <button
            className="ds-carousel-control"
            type="button"
            onClick={goNext}
            aria-label={copy.next}
          >
            ›
          </button>
          <div className="ds-carousel-dots" aria-label={copy.slidePicker}>
            {items.map((item, index) => (
              <button
                className="ds-carousel-dot"
                type="button"
                aria-current={index === displayIndex ? "true" : undefined}
                aria-label={copy.slideTo(index, item)}
                data-active={index === displayIndex ? "true" : undefined}
                key={`${item.title}-dot-${index}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
});

function CarouselSlide({ item }) {
  return (
    <>
      {item.image ? (
        <img
          className="ds-carousel-image"
          src={item.image}
          alt={item.imageAlt || ""}
        />
      ) : (
        <span className="ds-carousel-card-fallback" aria-hidden="true" />
      )}
      <span className="ds-carousel-copy">
        <span className="ds-carousel-title">{item.title}</span>
        {item.description ? (
          <span className="ds-carousel-description">{item.description}</span>
        ) : null}
      </span>
    </>
  );
}
