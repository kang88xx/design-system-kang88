import type * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "neutral";
export type ButtonSize = "default" | "small";
type ButtonBase = { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; className?: string; children?: React.ReactNode };
export type ButtonProps = ButtonBase & (
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean })
);
export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

export interface SegmentOption<T extends string | number = string> { value: T; label: React.ReactNode; disabled?: boolean; }
export interface SegmentedControlProps<T extends string | number = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  options: SegmentOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  onValueChange?: (value: T) => void;
  disabled?: boolean;
  label?: string;
}
export function SegmentedControl<T extends string | number = string>(props: SegmentedControlProps<T> & React.RefAttributes<HTMLDivElement>): React.ReactElement;

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "size"> {
  label?: React.ReactNode;
  onChange?: (checked: boolean) => void;
  className?: string;
}
export const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLInputElement>>;

export interface AccordionItem { id?: string; title: React.ReactNode; content: React.ReactNode; defaultOpen?: boolean; open?: boolean; detailsProps?: Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, "open">; }
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> { items?: AccordionItem[]; }
export const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;

export interface ProductTileProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  href?: string;
  secondaryHref?: string;
  ctaLabel?: React.ReactNode;
  secondaryCtaLabel?: React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  dark?: boolean;
  compact?: boolean;
}
export const ProductTile: React.ForwardRefExoticComponent<ProductTileProps & React.RefAttributes<HTMLElement>>;

export interface CarouselItem { id?: string; title: string; description?: React.ReactNode; image?: string; imageAlt?: string; href?: string; }
export interface CarouselLabels { previous?: string; next?: string; pause?: string; pauseText?: string; resume?: string; resumeText?: string; carousel?: string; slidePicker?: string; slideTo?: (index: number, item: CarouselItem) => string; }
export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items?: CarouselItem[];
  interval?: number;
  autoPlay?: boolean;
  label?: string;
  labels?: CarouselLabels;
}
export const Carousel: React.ForwardRefExoticComponent<CarouselProps & React.RefAttributes<HTMLElement>>;
export function useReducedMotion(): boolean;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children"> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  inputClassName?: string;
}
export const TextField: React.ForwardRefExoticComponent<TextFieldProps & React.RefAttributes<HTMLInputElement>>;

export interface DialogProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}
export const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDialogElement>>;

export interface DesignTokens {
  apple: {
    font: Record<string, string>;
    color: Record<string, string>;
    breakpoint: Record<string, number>;
    text: Record<string, { fontSize: number; lineHeight: number }>;
    radius: Record<string, number>;
    space: Record<string, number>;
    button: Record<string, number>;
    motion: Record<string, string>;
    shadow: Record<string, string>;
  };
  themes: Record<string, { color: Record<string, string>; shadow?: Record<string, string> }>;
}
export const tokens: DesignTokens;
