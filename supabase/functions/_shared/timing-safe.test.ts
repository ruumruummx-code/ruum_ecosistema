import { assertEquals } from "jsr:@std/assert@1";
import { timingSafeEqual } from "./timing-safe.ts";

Deno.test("timingSafeEqual: compara cadenas idénticas con éxito", () => {
  assertEquals(timingSafeEqual("Bearer secret123", "Bearer secret123"), true);
  assertEquals(timingSafeEqual("a", "a"), true);
});

Deno.test("timingSafeEqual: rechaza longitudes distintas", () => {
  assertEquals(timingSafeEqual("Bearer short", "Bearer longer-string"), false);
});

Deno.test("timingSafeEqual: rechaza contenidos distintos con misma longitud", () => {
  assertEquals(timingSafeEqual("Bearer secretA", "Bearer secretB"), false);
});

Deno.test("timingSafeEqual: fail-closed con nulos, vacíos o indefinidos", () => {
  assertEquals(timingSafeEqual("", ""), false);
  assertEquals(timingSafeEqual(null, "secret"), false);
  assertEquals(timingSafeEqual("secret", null), false);
  assertEquals(timingSafeEqual(undefined, undefined), false);
  assertEquals(timingSafeEqual("secret", ""), false);
});
