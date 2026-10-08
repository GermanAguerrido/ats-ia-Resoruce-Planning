// Usuarios internos que pueden ser responsables de cuentas, posiciones y candidatos.
// Cuando exista el backend, esta lista sale de la tabla de usuarios.
export const INTERNAL_USERS = ["Ana", "Germán", "Sofía"];

export function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Color estable por nombre (el mismo usuario siempre tiene el mismo color)
export function getUserHue(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }

  return hash;
}