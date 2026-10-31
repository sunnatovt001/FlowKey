"use client";
import Link from "@/components/site-link";
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
        Sahifa vaqtincha ochilmadi. Qayta urinib ko‘ring yoki ChatGPT orqali kirish sahifasiga o‘ting.
      </p>
      <button className="button primary" onClick={reset}>
        Qayta urinish
      </button>
      <Link className="button secondary" href="/login">
        ChatGPT orqali kirish
      </Link>
    </main>
  );
}
