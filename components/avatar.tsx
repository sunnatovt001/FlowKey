"use client";
/* eslint-disable @next/next/no-img-element -- Private avatar bytes use an authenticated same-origin route. */
import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, LoaderCircle } from "lucide-react";
const changed = "flowkey-avatar-changed";
function useAvatar() {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      fetch("/api/profile/avatar", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: unknown) => {
          if (active)
            setImage(
              data &&
                typeof data === "object" &&
                "image" in data &&
                typeof data.image === "string"
                ? data.image
                : null,
            );
        })
        .catch(() => {});
    };
    load();
    window.addEventListener(changed, load);
    return () => {
      active = false;
      window.removeEventListener(changed, load);
    };
  }, []);
  return image;
}
export function UserAvatar({
  email,
  large = false,
}: {
  email: string;
  large?: boolean;
}) {
  const image = useAvatar();
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span
      className={`avatar${large ? " avatar-large" : ""}`}
      aria-label="Profil rasmi"
    >
      {image && failed !== image ? (
        <img
          src={image}
          alt="Profil rasmi"
          width={large ? 88 : 32}
          height={large ? 88 : 32}
          onError={() => setFailed(image)}
        />
      ) : (
        email[0]?.toUpperCase() || "F"
      )}
    </span>
  );
}
async function prepare(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPG, PNG yoki WebP rasm tanlang.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Rasm 10 MB dan kichik bo‘lsin.");
  const bitmap = await createImageBitmap(file);
  try {
    if (
      bitmap.width > 8192 ||
      bitmap.height > 8192 ||
      !bitmap.width ||
      !bitmap.height
    )
      throw new Error("Rasm o‘lchami juda katta. Kichikroq rasm tanlang.");
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Rasmni tayyorlab bo‘lmadi.");
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      256,
      256,
    );
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Rasmni tayyorlab bo‘lmadi.")),
        "image/webp",
        0.9,
      ),
    );
    if (blob.size > 128 * 1024)
      throw new Error("Rasmni kichraytirib qayta yuklang.");
    return blob;
  } finally {
    bitmap.close();
  }
}
export function AvatarSettings({ email }: { email: string }) {
  const image = useAvatar();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(file?: File) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const blob = file ? await prepare(file) : undefined;
      const response = await fetch("/api/profile/avatar", {
        method: file ? "POST" : "DELETE",
        headers: blob ? { "Content-Type": blob.type } : undefined,
        body: blob,
      });
      const data = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(data.error?.message || "Rasmni saqlab bo‘lmadi.");
      window.dispatchEvent(new Event(changed));
      setNotice(
        file ? "Profil rasmi yangilandi." : "Profil rasmi olib tashlandi.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="panel settings-panel avatar-settings">
      <h2>Profil rasmi</h2>
      <div className="avatar-editor">
        <UserAvatar email={email} large />
        <div>
          <p className="muted">JPG, PNG, WebP · 10 MB gacha.</p>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Profil rasmini tanlash"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void save(file);
            }}
          />
          <div className="avatar-actions">
            <button
              className="button primary"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Camera size={16} />
              )}{" "}
              {busy
                ? "Saqlanmoqda…"
                : image
                  ? "Rasmni almashtirish"
                  : "Rasm yuklash"}
            </button>
            {image && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void save()}
              >
                <Trash2 size={16} /> Olib tashlash
              </button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p role="status">{notice}</p>
    </section>
  );
}
