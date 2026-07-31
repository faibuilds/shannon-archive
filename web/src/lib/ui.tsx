"use client";
// Shared page chrome: the preview/form modal and the share toast. One
// provider so any plate, the alerts band, or a remarks block can open them.
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from "react";

type ModalState = {
  title: string;
  src: string;
  href: string;
  linkText: string;
  note: string;
} | null;

type UI = {
  openEmbed: (title: string, src: string, href: string) => void;
  openForm: (formId: string, title: string, plate?: string) => void;
  showToast: (msg: string) => void;
  share: (id: string, name: string) => void;
};

const UICtx = createContext<UI | null>(null);
export const useUI = () => {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI outside UIProvider");
  return ctx;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("Plate link copied");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number>(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((m: NonNullable<ModalState>) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setModal(m);
  }, []);

  const openEmbed = useCallback(
    (title: string, src: string, href: string) =>
      open({ title, src, href, linkText: "Open on LinkedIn →", note: "Served by LinkedIn. Renders on the live site." }),
    [open],
  );

  const openForm = useCallback(
    (formId: string, title: string, plate?: string) => {
      let src = `https://tally.so/embed/${formId}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
      if (plate) src += "&plate=" + encodeURIComponent(plate);
      open({ title, src, href: `https://tally.so/r/${formId}`, linkText: "Open the form →", note: "Form served by Tally" });
    },
    [open],
  );

  const close = useCallback(() => {
    setModal(null);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    if (modal) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (modal) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, close]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), 2200);
  }, []);

  const share = useCallback(
    async (id: string, name: string) => {
      const url = location.href.split("#")[0] + "#" + id;
      const payload = {
        title: "SHANNON / " + name,
        text: name + " on KELLY, Engineering Community's aircraft line",
        url,
      };
      if (navigator.share) {
        try { await navigator.share(payload); return; }
        catch (err) { if ((err as Error)?.name === "AbortError") return; }
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("Plate link copied");
      } catch {
        showToast("Copy failed: " + url);
      }
    },
    [showToast],
  );

  return (
    <UICtx.Provider value={{ openEmbed, openForm, showToast, share }}>
      {children}
      <div
        className={"modal-backdrop" + (modal ? " open" : "")}
        role="dialog"
        aria-modal="true"
        aria-label="Post preview"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="modal">
          <div className="rivets" />
          <div className="modal-head">
            <div className="modal-title">
              {modal?.title || "Preview"}
              <span>.</span>
            </div>
            <button ref={closeRef} className="modal-close" aria-label="Close preview" onClick={close}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            {modal && <iframe src={modal.src} title="Post preview" loading="lazy" />}
          </div>
          <div className="modal-foot">
            <span className="modal-note">{modal?.note || "Preview"}</span>
            <a href={modal?.href || "#"} target="_blank" rel="noopener noreferrer">
              {modal?.linkText || "Open →"}
            </a>
          </div>
        </div>
      </div>
      <div className={"toast" + (toastOn ? " show" : "")}>{toast}</div>
    </UICtx.Provider>
  );
}
