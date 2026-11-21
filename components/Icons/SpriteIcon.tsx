type SpriteIconName =
  | "icon-search"
  | "icon-chevron-down"
  | "icon-arrow-left"
  | "icon-arrow-right"
  | "icon-double-left"
  | "icon-double-right"
  | "icon-plus"
  | "icon-close"
  | "icon-more"
  | "icon-menu"
  | "icon-nav-tab"
  | "icon-user"
  | "icon-pen-black"
  | "icon-trash-black"
  | "icon-flag-gb"
  | "icon-flag-ua";

export default function SpriteIcon({ name, className }: { name: SpriteIconName; className?: string }) {
  return (
    <svg className={className} viewBox={name === "icon-nav-tab" ? "0 0 40 28" : name.endsWith("black") || name.startsWith("icon-flag-") ? "0 0 32 32" : "0 0 24 24"} aria-hidden="true" focusable="false">
      <use href={`/icons/sprite.svg?v=nav-tab#${name}`} />
    </svg>
  );
}
