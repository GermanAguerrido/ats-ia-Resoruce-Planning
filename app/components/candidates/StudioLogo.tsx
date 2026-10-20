"use client";

import { useState } from "react";

// Logo del estudio. Para usar el logo real, guardar el archivo en public/trick-studios-logo.png;
// mientras no exista se muestra el nombre escrito.
export function StudioLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="rounded-lg border px-3 py-1.5 text-xs font-extrabold tracking-[0.14em]"
        style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
      >
        TRICK STUDIOS
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/trick-studios-logo.png"
      alt="Trick Studios"
      onError={() => setFailed(true)}
      className="h-9 w-auto"
    />
  );
}
