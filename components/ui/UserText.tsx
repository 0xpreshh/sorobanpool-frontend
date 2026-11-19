import type { ElementType } from 'react';

/** Maximum length rendered. Anything longer is cut and marked with an ellipsis. */
const MAX_LENGTH = 500;

/**
 * Bidirectional control characters (LRE/RLE/PDF/LRO/RLO, isolates, marks) and other C0/C1 controls.
 * Used to reverse or hide text, so a title can look like a different name or address.
 */
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‎‏؜‪-‮⁦-⁩]/g;

/** Strips characters that can spoof how text reads. Exported for tests and for non-JSX uses. */
export function sanitizeUserText(value: string | null | undefined): string {
  return (value ?? '').replace(UNSAFE_CHARS, '');
}

/**
 * Renders text a user typed (display names, product titles, hub addresses, dispute notes).
 *
 * React escapes the text, so HTML-like input shows as plain characters. This component also strips
 * bidi-control characters, caps very long input, and wraps unbroken strings so they do not push the layout
 * off the screen. Use it for all user-provided text rather than rendering the raw string.
 */
export function UserText({
  value,
  as: Tag = 'span',
  className,
}: {
  value: string | null | undefined;
  as?: ElementType;
  className?: string;
}) {
  const clean = sanitizeUserText(value);
  const text = clean.length > MAX_LENGTH ? `${clean.slice(0, MAX_LENGTH)}…` : clean;
  return <Tag className={`break-words [overflow-wrap:anywhere] ${className ?? ''}`.trim()}>{text}</Tag>;
}
