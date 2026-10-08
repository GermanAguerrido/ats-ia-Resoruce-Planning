import { getUserHue, getUserInitials } from "@/app/lib/users";

type Props = {
  name?: string;
  photoUrl?: string;
  size?: "sm" | "md";
  title?: string;
};

/**
 * Avatar de un usuario: la foto si la tiene, si no sus iniciales.
 * Sin nombre muestra un círculo punteado ("sin asignar").
 */
export function UserAvatar({ name, photoUrl, size = "sm", title }: Props) {
  const sizeClass = size === "md" ? "h-8 w-8 text-[11.5px]" : "h-6 w-6 text-[9.5px]";

  if (!name) {
    return (
      <span
        title={title ?? "Not assigned"}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-dashed font-bold app-text-muted ${sizeClass}`}
        style={{ borderColor: "var(--app-text-muted)" }}
      >
        –
      </span>
    );
  }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        title={title ?? name}
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  const hue = getUserHue(name);

  return (
    <span
      title={title ?? name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue},65%,48%), hsl(${(hue + 35) % 360},65%,58%))`,
      }}
    >
      {getUserInitials(name)}
    </span>
  );
}