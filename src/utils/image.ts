/**
 * Riduce un'immagine a un quadrato piccolo, ritagliato al centro.
 *
 * La foto profilo vive nello stesso spazio del diario (circa 5 MB nel browser): una foto del
 * telefono può pesare da sola diversi megabyte. A 256 px e qualità 0,82 ne bastano 15-30 KB.
 */
export async function resizeImageToDataUrl(
  source: Blob | string,
  size = 256,
  quality = 0.82,
): Promise<string> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error('Immagine vuota');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non disponibile');

    // Sfondo bianco: il JPEG non ha trasparenza e una PNG trasparente diventerebbe nera
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}
