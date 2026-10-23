const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailLoginValido(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validarCredencialesLogin(email: string, password: string): "email" | "password" | null {
  if (!esEmailLoginValido(email)) return "email";
  if (!password) return "password";
  return null;
}
