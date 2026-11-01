import Link from "@/components/site-link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>Sahifa topilmadi.</h1>
      <p>Sahifa yoki loyiha mavjud emas.</p>
      <Link href="/dashboard" className="button primary">
        Kabinetingizga o‘tish
      </Link>
    </main>
  );
}
