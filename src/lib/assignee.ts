// Ortak assignee yardimcilari: AddCardForm ve CardDetailModal ayni kurallarla
// initial/renk hesaplasin diye tek yere topluyoruz.

// Farkli uyelere stabil renk verebilmek icin kucuk bir palet; kartta
// assigneeColor olarak saklanan Tailwind class'i bu setten seciliyor.
export const ASSIGNEE_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

// Bir karti "assignee'si yok" olarak isaretlemek icin kullanilan sabit renk.
// Backend Card modelindeki default deger ile ayni (`bg-gray-500`).
export const UNASSIGNED_COLOR = "bg-gray-500";

// Ismin ilk iki kelimesinin bas harfi + buyuk harf. Server'daki User modeli
// ile ayni kurali uyguluyoruz.
export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Stabil renk: ayni id her zaman ayni renge dusuyor (basit hash).
export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length];
}

// Bir Card'in assignee'si bulunmuyor mu? Bosluklu string veya sadece bosluk
// olmasi durumunu da kapsiyor.
export function isUnassigned(initials?: string | null): boolean {
  return !initials || initials.trim().length === 0;
}
