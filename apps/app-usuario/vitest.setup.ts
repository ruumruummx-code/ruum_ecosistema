import "@testing-library/jest-dom/vitest";

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
}

const mockLocal = createStorageMock();
const mockSession = createStorageMock();

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocal,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSession,
  writable: true,
  configurable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: mockLocal,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "sessionStorage", {
    value: mockSession,
    writable: true,
    configurable: true,
  });
}

// Secreto de prueba para firma criptográfica de tokens telefónicos
process.env.PHONE_VERIFY_SECRET =
  process.env.PHONE_VERIFY_SECRET || "default-secret-test-environment-32-chars-minimum";


