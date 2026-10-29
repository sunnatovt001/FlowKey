"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <h1>Sahifani yuklab bo‘lmadi.</h1>
      <p>
        Qayta urinib ko‘ring. Lokal muhitda baza ishga tushganini, muhit o‘zgaruvchilari va migratsiyalar sozlanganini tekshiring.
      </p>
      <button className="button primary" onClick={reset}>
        Qayta urinish
      </button>
      <Link className="button secondary" href="/">
        FlowKey’ga qaytish
      </Link>
    </main>
  );
}
