import { describe, expect, it } from "vitest";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64Binary";

describe("base64Binary", () => {
  it("küçük bir Uint8Array'i GERÇEKTEN doğru şekilde base64'e çevirir ve geri döner (round-trip)", () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = uint8ArrayToBase64(original);
    const decoded = base64ToUint8Array(encoded);

    expect(encoded).toBe("SGVsbG8=");
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("🔴 GERÇEK KANIT: BÜYÜK bir Uint8Array (spread operatörünün 'Maximum call stack size exceeded' fırlatacağı boyutta) HATA VERMEDEN işlenir", () => {
    // 500.000 byte — spread/apply'ın bilinen pratik sınırının (tipik
    // motorlarda ~65k-100k civarı) KESİN olarak ÜZERİNDE.
    const large = new Uint8Array(500_000);
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }

    expect(() => uint8ArrayToBase64(large)).not.toThrow();

    const encoded = uint8ArrayToBase64(large);
    const decoded = base64ToUint8Array(encoded);
    expect(decoded.length).toBe(large.length);
    expect(Array.from(decoded)).toEqual(Array.from(large));
  });

  it("boş bir Uint8Array için boş bir base64 string döner", () => {
    expect(uint8ArrayToBase64(new Uint8Array(0))).toBe("");
    expect(base64ToUint8Array("").length).toBe(0);
  });
});
