import { authenticatedPost } from './api';

export interface EchoRequest {
  /** Nome della persona da imitare. */
  name: string;
  /** Esempi dei suoi messaggi reali (stile, emoji, tono). */
  context: string;
  /** Messaggio appena scritto dall'utente. */
  message: string;
}

/**
 * Chiede la risposta dell'eco al Worker, che parla con Gemini.
 * La chiave di Gemini sta solo sul Worker: il browser non la vede mai.
 */
export async function askEcho(request: EchoRequest): Promise<string> {
  const { text } = await authenticatedPost<{ text: string }>('/echo', request);
  return text || '...';
}
