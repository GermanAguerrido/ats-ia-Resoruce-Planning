import type { ClipboardEvent as ReactClipboardEvent } from "react";

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"]);
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "META", "LINK", "TITLE", "HEAD"]);

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrap(tag: string, content: string) {
  return content ? `<${tag}>${content}</${tag}>` : "";
}

/**
 * Deja solo formato básico (negrita, cursiva, subrayado, listas y párrafos) y descarta
 * colores, fuentes, estilos y cualquier otra etiqueta. Convierte el formato que traen
 * Google Docs, Word y las páginas web (en estilos) a etiquetas simples.
 */
export function sanitizeRichHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeText(node.textContent ?? "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    const tag = element.tagName;

    if (SKIPPED_TAGS.has(tag)) {
      return "";
    }

    const children = Array.from(element.childNodes).map(walk).join("");

    if (tag === "BR") return "<br>";
    if (tag === "UL" || tag === "OL") return wrap(tag.toLowerCase(), children);
    if (tag === "LI") return wrap("li", children);
    if (BLOCK_TAGS.has(tag)) return wrap("p", children);

    const style = element.style;
    let result = children;

    const isBold =
      (tag === "B" || tag === "STRONG"
        ? style.fontWeight !== "normal" && style.fontWeight !== "400"
        : false) ||
      style.fontWeight === "bold" ||
      Number(style.fontWeight) >= 600;

    const isItalic = tag === "I" || tag === "EM" || style.fontStyle === "italic";

    const isUnderline =
      tag === "U" || (style.textDecorationLine || style.textDecoration).includes("underline");

    if (isUnderline) result = wrap("u", result);
    if (isItalic) result = wrap("i", result);
    if (isBold) result = wrap("b", result);

    return result;
  };

  return Array.from(doc.body.childNodes).map(walk).join("");
}

/** Convierte texto plano en HTML: las líneas que empiezan con •, -, * o · pasan a ser viñetas. */
export function plainTextToRichHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  let html = "";
  let insideList = false;

  lines.forEach((line) => {
    const bullet = line.match(/^\s*[•\-*·▪]\s+(.*)$/);

    if (bullet) {
      if (!insideList) {
        html += "<ul>";
        insideList = true;
      }

      html += `<li>${escapeText(bullet[1])}</li>`;
      return;
    }

    if (insideList) {
      html += "</ul>";
      insideList = false;
    }

    if (line.trim()) {
      html += `<p>${escapeText(line)}</p>`;
    }
  });

  if (insideList) {
    html += "</ul>";
  }

  return html;
}

/** Texto plano de un HTML (para resúmenes y búsquedas). */
export function richHtmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<li>/gi, "• ")
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const doc = new DOMParser().parseFromString(withBreaks, "text/html");

  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Pegado para los editores: conserva el formato básico y las viñetas,
 * y quita colores, fuentes y estilos de otras fuentes.
 */
export function handleRichPaste(event: ReactClipboardEvent<HTMLElement>) {
  event.preventDefault();

  const html = event.clipboardData.getData("text/html");
  const text = event.clipboardData.getData("text/plain");

  const cleaned = html ? sanitizeRichHtml(html) : plainTextToRichHtml(text);

  document.execCommand("insertHTML", false, cleaned || escapeText(text));
}