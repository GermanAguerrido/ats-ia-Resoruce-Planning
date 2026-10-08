"use client";

import { useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { handleRichPaste } from "@/app/lib/richText";

type Props = {
  placeholder: string;
  ariaLabel: string;
  onChange: (html: string) => void;
};

const toolbarButtons = [
  { command: "bold", label: "Bold", icon: <Bold className="h-3.5 w-3.5" /> },
  { command: "italic", label: "Italic", icon: <Italic className="h-3.5 w-3.5" /> },
  { command: "underline", label: "Underline", icon: <Underline className="h-3.5 w-3.5" /> },
  { command: "insertUnorderedList", label: "Bulleted list", icon: <List className="h-3.5 w-3.5" /> },
  { command: "insertOrderedList", label: "Numbered list", icon: <ListOrdered className="h-3.5 w-3.5" /> },
];

/** Campo de texto con formato (negrita, cursiva, subrayado y listas) para los formularios. */
export function RichTextField({ placeholder, ariaLabel, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  const emitChange = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  return (
    <div className="overflow-hidden rounded-xl border app-border app-input">
      <div className="flex gap-1 border-b px-2 py-1.5 app-border">
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            title={button.label}
            aria-label={button.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand(button.command);
              emitChange();
            }}
            className="rounded-lg p-1.5 transition app-text-secondary hover:bg-black/[0.06]"
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        spellCheck={false}
        onInput={emitChange}
        onPaste={handleRichPaste}
        className="min-h-[96px] px-3 py-2.5 text-sm leading-6 outline-none empty:before:text-zinc-400 empty:before:content-[attr(data-placeholder)] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}