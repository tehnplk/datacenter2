import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function IconBase({ title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 6H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5" />
      <path d="M14 8l-3 4 3 4" />
      <path d="M20 6h-4" />
      <path d="M20 12h-4" />
      <path d="M20 18h-4" />
    </IconBase>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 6h5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-5" />
      <path d="M10 8l3 4-3 4" />
      <path d="M4 6h4" />
      <path d="M4 12h4" />
      <path d="M4 18h4" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function DrgsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-5" />
      <path d="M12 15V8" />
      <path d="M16 15v-3" />
    </IconBase>
  );
}

export function ERReferIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h9" />
      <path d="M4 17h9" />
      <path d="M4 12h13" />
      <path d="M17 8l3 4-3 4" />
    </IconBase>
  );
}

export function ICUIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
      <path d="M6 7h3" />
      <path d="M15 7h3" />
      <path d="M6 17h3" />
      <path d="M15 17h3" />
    </IconBase>
  );
}

export function ERPIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 10h18" />
      <path d="M7 3v18" />
      <path d="M4 21h16" />
      <path d="M4 3h16" />
    </IconBase>
  );
}

export function ORIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </IconBase>
  );
}

export function PharmaIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 3v7" />
      <path d="M15 3v7" />
      <path d="M7 10h10" />
      <path d="M6 10v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10" />
    </IconBase>
  );
}
