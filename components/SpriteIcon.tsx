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
  | "icon-user"
  | "icon-pen-black"
  | "icon-trash-black";

export default function SpriteIcon({ name, className }: { name: SpriteIconName; className?: string }) {
  return (
    <svg className={className} viewBox={name.endsWith("black") ? "0 0 32 32" : "0 0 24 24"} aria-hidden="true" focusable="false">
      <use href={`/sprite.svg#${name}`} />
    </svg>
  );
}
