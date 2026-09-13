import React, { forwardRef, useEffect, useId, useRef, useState } from "react";

/* ------------------------------------------------------------------ utils */
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

/** Runs a `data-rt-enter` preset once the element scrolls into view (Wix paused → running). */
export function useEnterMotion({ threshold = 0.2, once = true } = {}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("is-in");
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, reduced]);
  return ref;
}

/** Wrapper that applies an entrance preset: fade | float-up | float-left | float-right | fold | fold-2 | fold-3 | fold-side | blur | blur-hero | glide-left | glide-right | reveal */
export const EnterMotion = forwardRef(function EnterMotion({ preset = "float-up", as: Tag = "div", className, children, ...rest }, forwardedRef) {
  const ref = useEnterMotion();
  const setRef = (node) => {
    ref.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  return (
    <Tag ref={setRef} data-rt-enter={preset} className={className} {...rest}>
      {children}
    </Tag>
  );
});

/* ------------------------------------------------------------------ Logo */
export function Logo({ inverse = false, size, title = "REATIC INDUSTRY", className, ...rest }) {
  return (
    <span className={cx("rt-logo", inverse && "rt-logo--inverse", className)} style={size ? { width: size, height: size } : undefined} {...rest}>
      <svg viewBox="0 0 1000 1000" role="img" aria-label={title}>
        <polygon points="500,245 783,733 217,733" fill="none" stroke="currentColor" strokeWidth="32" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ Header + Nav */
export function Header({ logoHref = "/", items = [], current, shadow = false, line = true, className, children, ...rest }) {
  return (
    <header className={cx("rt-header", shadow && "rt-header--shadow", line && "rt-header--line", className)} {...rest}>
      <a href={logoHref} aria-label="홈으로">
        <Logo />
      </a>
      <NavMenu items={items} current={current} />
      <div>{children}</div>
    </header>
  );
}

export function NavMenu({ items = [], current, label = "주 메뉴", className, ...rest }) {
  return (
    <nav aria-label={label} {...rest}>
      <ul className={cx("rt-nav", className)}>
        {items.map((item) => (
          <li key={item.href} className="rt-nav__item">
            <a className="rt-nav__link" href={item.href} aria-current={current === item.href ? "page" : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ Button */
const ArrowIcon = () => (
  <svg className="rt-button__icon" viewBox="0 0 200 60" aria-hidden="true">
    <path d="M159 10.9l-2.2 2.4L183.6 39H9v3h174.6l-26.2 25.3 2.1 2.6 30.5-29.3-31-29.7z" transform="translate(0 -9)" />
  </svg>
);

/** variant: "cta" (amber pill, 288×55) | "secondary" (#282626, 142×40) | "submit" (black, 2px #f3f3f3, r2) */
export const Button = forwardRef(function Button(
  { variant = "cta", href, arrow = variant === "cta", loading = false, disabled = false, className, children, type, ...rest },
  ref
) {
  const classes = cx("rt-button", `rt-button--${variant}`, className);
  if (href) {
    return (
      <a ref={ref} className={classes} href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...rest}>
        {children}
        {arrow && <ArrowIcon />}
      </a>
    );
  }
  return (
    <button ref={ref} className={classes} type={type || "button"} disabled={disabled || loading} data-loading={loading || undefined} aria-busy={loading || undefined} {...rest}>
      {children}
      {arrow && <ArrowIcon />}
    </button>
  );
});

/* ------------------------------------------------------------------ Fields */
/** variant: "underline" (13px DemiLight, 2px bottom) | "box" (2px border, Avenir 15, textarea) */
export const TextField = forwardRef(function TextField(
  { label, hint, error, variant = "underline", multiline = variant === "box", id: idProp, className, required, ...rest },
  ref
) {
  const autoId = useId();
  const id = idProp || `rt-field-${autoId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const InputTag = multiline ? "textarea" : "input";
  return (
    <div className={cx("rt-field", `rt-field--${variant}`, className)} data-invalid={error ? "true" : undefined}>
      {label && (
        <label className="rt-field__label" htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <InputTag
        ref={ref}
        id={id}
        className="rt-field__input"
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? "true" : undefined}
        required={required}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="rt-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="rt-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, options = [], placeholder, id: idProp, className, ...rest }, ref) {
  const autoId = useId();
  const id = idProp || `rt-select-${autoId}`;
  return (
    <div className={cx("rt-field", className)}>
      {label && (
        <label className="rt-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <span className="rt-select">
        <select ref={ref} id={id} className="rt-select__input" defaultValue={placeholder ? "" : undefined} {...rest}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className="rt-select__icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M1 3.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, id: idProp, className, ...rest }, ref) {
  const autoId = useId();
  const id = idProp || `rt-check-${autoId}`;
  return (
    <label className={cx("rt-checkbox", className)} htmlFor={id}>
      <input ref={ref} id={id} type="checkbox" className="rt-checkbox__input" {...rest} />
      <span>{label}</span>
    </label>
  );
});

/* ------------------------------------------------------------------ Card / Tile */
export function Card({ word, caption, image, imageAlt = "", className, children, ...rest }) {
  if (image) {
    return (
      <div className={cx("rt-card", "rt-card--media", className)} style={{ backgroundImage: `url(${image})` }} role={imageAlt ? "img" : undefined} aria-label={imageAlt || undefined} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <div className={cx("rt-card", className)} {...rest}>
      {word && <div className="rt-card__word">{word}</div>}
      {caption && <div className="rt-card__caption">{caption}</div>}
      {children}
    </div>
  );
}

export function GalleryTile({ href, image, video, alt = "", label, loading = false, className, ...rest }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag className={cx("rt-tile", className)} href={href} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} data-loading={loading || undefined} {...rest}>
      {video ? <video className="rt-tile__media" src={video} muted loop playsInline autoPlay /> : image ? <img className="rt-tile__media" src={image} alt={alt} loading="lazy" /> : null}
      {label && <span className="rt-tile__overlay">{label}</span>}
    </Tag>
  );
}

export function Gallery({ items = [], className, ...rest }) {
  if (!items.length) return null;
  return (
    <div className={cx("rt-gallery", className)} {...rest}>
      {items.map((item, i) => (
        <GalleryTile key={item.id || i} {...item} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Anchor dots */
export function AnchorDots({ targets = [], current, onLight = false, label = "섹션 이동", className, ...rest }) {
  return (
    <nav aria-label={label} {...rest}>
      <ol className={cx("rt-anchor-dots", onLight && "rt-anchor-dots--on-light", className)}>
        {targets.map((t) => (
          <li key={t.id}>
            <a className="rt-anchor-dots__link" href={`#${t.id}`} aria-current={current === t.id ? "true" : undefined} aria-label={t.label}>
              <span className="rt-anchor-dots__dot" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ Scroll hint / CTA / Footer */
export function ScrollHint({ text, up = false, inverse = false, className, ...rest }) {
  return (
    <div className={cx("rt-scroll-hint", up && "rt-scroll-hint--up", inverse && "rt-scroll-hint--inverse", className)} {...rest}>
      {text && <span>{text}</span>}
      <svg className="rt-scroll-hint__icon" viewBox="19.999 58 160.001 84" aria-hidden="true">
        <path d="M172.5 142a7.485 7.485 0 0 1-5.185-2.073L100 75.808l-67.315 64.12c-2.998 2.846-7.74 2.744-10.606-.234a7.454 7.454 0 0 1 .235-10.565l72.5-69.057a7.524 7.524 0 0 1 10.371 0l72.5 69.057a7.455 7.455 0 0 1 .235 10.565A7.503 7.503 0 0 1 172.5 142z" transform="rotate(180 100 100)" />
      </svg>
    </div>
  );
}

export function CtaStrip({ eyebrow = "무에서 유를 창조하는 모션그래픽 프로덕션", title = "리틱인더스트리에 의뢰하세요", ctaLabel = "리틱인더스트리에 의뢰하기", href = "/contact", className, ...rest }) {
  return (
    <section className={cx("rt-cta-strip", className)} {...rest}>
      <ScrollHint up inverse />
      <p className="rt-cta-strip__eyebrow">{eyebrow}</p>
      <h2 className="rt-cta-strip__title">{title}</h2>
      <Button variant="cta" href={href}>
        {ctaLabel}
      </Button>
    </section>
  );
}

export function Footer({ text = "Designed by Reatic Industry\nAll rights are reserved", className, ...rest }) {
  return (
    <footer className={cx("rt-footer", className)} {...rest}>
      <p style={{ margin: 0, whiteSpace: "pre-line" }}>{text}</p>
    </footer>
  );
}
