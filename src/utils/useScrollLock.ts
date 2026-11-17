import { useEffect } from 'react';

/**
 * Blocca lo scroll della pagina mentre un modale è aperto.
 *
 * Su iOS `overflow: hidden` sul body da solo non basta: la pagina sotto continua a
 * scorrere e rimbalza. Si fissa quindi il body (`position: fixed`) con un `top`
 * negativo che mantiene la stessa posizione visiva, e alla chiusura si torna
 * esattamente dov'era l'utente.
 *
 * Un contatore tiene conto dei blocchi attivi: con due modali aperti insieme, la
 * pagina si sblocca solo quando si chiude l'ultimo.
 */
let activeLocks = 0;
let savedScrollY = 0;
let savedStyles: Partial<CSSStyleDeclaration> = {};

function lock() {
  activeLocks += 1;
  if (activeLocks > 1) return;

  const body = document.body;
  savedScrollY = window.scrollY;
  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
}

function unlock() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks > 0) return;

  const body = document.body;
  body.style.position = savedStyles.position ?? '';
  body.style.top = savedStyles.top ?? '';
  body.style.left = savedStyles.left ?? '';
  body.style.right = savedStyles.right ?? '';
  body.style.width = savedStyles.width ?? '';

  window.scrollTo(0, savedScrollY);
}

export function useScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
