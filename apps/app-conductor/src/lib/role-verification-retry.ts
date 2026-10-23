/** Reintenta fallos transitorios antes de denegar una ruta protegida. */
export async function verificarRolConReintentos<T>(
  verificar: () => Promise<T>,
  dormir: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  const maxReintentos = 2;

  for (let intento = 0; ; intento += 1) {
    try {
      return await verificar();
    } catch (error) {
      if (intento >= maxReintentos) throw error;
      await dormir(50 * (intento + 1));
    }
  }
}
