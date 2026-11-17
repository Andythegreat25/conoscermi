import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../utils/useScrollLock';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Contenuto opzionale sotto il messaggio, per esempio l'anteprima di una voce. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modale di conferma in app. Sostituisce window.confirm, che nei contesti
 * iframe e nelle PWA può essere bloccato o mostrato in modo incoerente.
 * Esc e tocco sullo sfondo annullano; il focus parte dal pulsante "Annulla".
 */
export function ConfirmDialog({
  open,
  title,
  message,
  children,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancelRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-surface text-on-surface rounded-[28px] p-6 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        <h2 id={titleId} className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {message}
        </p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[48px] rounded-full bg-surface-container-highest text-on-surface font-bold text-sm transition-transform duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-[48px] rounded-full font-bold text-sm transition-transform duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary ${
              destructive ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
