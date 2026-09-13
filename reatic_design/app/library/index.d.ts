import type * as React from "react";

export type EnterPreset =
  | "fade" | "fade-short" | "fade-late"
  | "float-up" | "float-up-short" | "float-left" | "float-right" | "float-viewport"
  | "fold" | "fold-2" | "fold-3" | "fold-short" | "fold-side"
  | "blur" | "blur-hero"
  | "glide-left" | "glide-right" | "glide-viewport"
  | "reveal";

export function useReducedMotion(): boolean;
export function useEnterMotion(options?: { threshold?: number; once?: boolean }): React.RefObject<HTMLElement | null>;
export interface EnterMotionProps extends React.HTMLAttributes<HTMLElement> { preset?: EnterPreset; as?: keyof JSX.IntrinsicElements; }
export const EnterMotion: React.ForwardRefExoticComponent<EnterMotionProps & React.RefAttributes<HTMLElement>>;

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> { inverse?: boolean; size?: number | string; title?: string; }
export function Logo(props: LogoProps): React.ReactElement;

export interface NavItem { href: string; label: React.ReactNode; }
export interface NavMenuProps extends React.HTMLAttributes<HTMLElement> { items: NavItem[]; current?: string; label?: string; }
export function NavMenu(props: NavMenuProps): React.ReactElement;
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> { logoHref?: string; items?: NavItem[]; current?: string; shadow?: boolean; line?: boolean; }
export function Header(props: HeaderProps): React.ReactElement;

export type ButtonVariant = "cta" | "secondary" | "submit";
type ButtonBase = { variant?: ButtonVariant; arrow?: boolean; loading?: boolean; className?: string; children?: React.ReactNode };
export type ButtonProps = ButtonBase & (
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean })
);
export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; variant?: "underline" | "box"; multiline?: boolean;
}
export const TextField: React.ForwardRefExoticComponent<TextFieldProps & React.RefAttributes<HTMLInputElement | HTMLTextAreaElement>>;

export interface SelectOption { value: string; label: React.ReactNode; disabled?: boolean; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: React.ReactNode; options: SelectOption[]; placeholder?: string; }
export const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> { label?: React.ReactNode; }
export const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { word?: React.ReactNode; caption?: React.ReactNode; image?: string; imageAlt?: string; }
export function Card(props: CardProps): React.ReactElement;

export interface GalleryTileProps extends React.HTMLAttributes<HTMLElement> { href?: string; image?: string; video?: string; alt?: string; label?: React.ReactNode; loading?: boolean; id?: string; }
export function GalleryTile(props: GalleryTileProps): React.ReactElement;
export interface GalleryProps extends React.HTMLAttributes<HTMLDivElement> { items: GalleryTileProps[]; }
export function Gallery(props: GalleryProps): React.ReactElement | null;

export interface AnchorTarget { id: string; label: string; }
export interface AnchorDotsProps extends React.HTMLAttributes<HTMLElement> { targets: AnchorTarget[]; current?: string; onLight?: boolean; label?: string; }
export function AnchorDots(props: AnchorDotsProps): React.ReactElement;

export interface ScrollHintProps extends React.HTMLAttributes<HTMLDivElement> { text?: React.ReactNode; up?: boolean; inverse?: boolean; }
export function ScrollHint(props: ScrollHintProps): React.ReactElement;

export interface CtaStripProps extends React.HTMLAttributes<HTMLElement> { eyebrow?: React.ReactNode; title?: React.ReactNode; ctaLabel?: React.ReactNode; href?: string; }
export function CtaStrip(props: CtaStripProps): React.ReactElement;

export interface FooterProps extends React.HTMLAttributes<HTMLElement> { text?: string; }
export function Footer(props: FooterProps): React.ReactElement;

export const tokens: Record<string, unknown>;
