import React, { forwardRef, useEffect, useId, useRef } from "react";

export const TextField = forwardRef(function TextField({
  label, hint, error, id: providedId, className = "", inputClassName = "",
  "aria-describedby": describedBy, "aria-invalid": invalid, ...inputProps
}, ref) {
  const generatedId = useId();
  const id = providedId || `ds-field-${generatedId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const description = [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`ds-field ${className}`} data-disabled={inputProps.disabled || undefined}>
      <label className="ds-field-label" htmlFor={id}>{label}{inputProps.required && <span aria-hidden="true"> *</span>}</label>
      <input {...inputProps} ref={ref} id={id} className={`ds-field-input ${inputClassName}`}
        aria-describedby={description} aria-invalid={error ? true : invalid} />
      {hint && <p className="ds-field-hint" id={hintId}>{hint}</p>}
      {error && <p className="ds-field-error" id={errorId} role="status">{error}</p>}
    </div>
  );
});

export const Dialog = forwardRef(function Dialog({
  open = false, onOpenChange, title, description, children, footer,
  closeLabel = "Close dialog", initialFocusRef, className = "", ...props
}, forwardedRef) {
  const id = useId();
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const state = useRef({ open, onOpenChange });
  state.current = { open, onOpenChange };
  const restoreFocus = () => {
    if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    previousFocus.current = null;
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement;
      dialog.showModal();
      const target = initialFocusRef?.current;
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
  return (
    <dialog {...props} className={`ds-dialog ${className}`}
      ref={node => {
        dialogRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
      onCancel={event => {
        props.onCancel?.(event);
        const cancelled = event.defaultPrevented;
        event.preventDefault();
        if (!cancelled) state.current.onOpenChange?.(false);
      }}
      onClose={event => {
        props.onClose?.(event);
        // A child form with method="dialog" may close the native element directly.
        if (state.current.open && !event.currentTarget.open) state.current.onOpenChange?.(false);
        if (!event.currentTarget.open) restoreFocus();
      }}
      onClick={event => {
        props.onClick?.(event);
        if (event.defaultPrevented || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          state.current.onOpenChange?.(false);
        }
      }}>
      <div className="ds-dialog-header">
        <h2 className="ds-dialog-title" id={`${id}-title`}>{title}</h2>
        <button type="button" className="ds-dialog-close" aria-label={closeLabel} onClick={() => state.current.onOpenChange?.(false)}>×</button>
      </div>
      {description && <p className="ds-dialog-description" id={`${id}-description`}>{description}</p>}
      <div className="ds-dialog-body">{children}</div>
      {footer && <div className="ds-dialog-footer">{footer}</div>}
    </dialog>
  );
});
