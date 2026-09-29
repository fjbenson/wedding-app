import { Bell, Camera } from "lucide-react";
import Hub from "@/components/hub";

/**
 * The top of the home screen, like a magazine cover: a full-width photo with
 * the couple's name, and the hub ring floating on it.
 *
 * There's no photo upload yet, so this paints a warm sample "photo" (the
 * golden one from the Glass Lab) out of soft blurred shapes. When uploads
 * arrive, a real image replaces the shapes and nothing else changes.
 */
export default function Cover({
  name,
  weddingDate,
}: {
  name: string;
  weddingDate: string | null;
}) {
  return (
    <section className="relative aspect-[300/390] w-full overflow-hidden md:aspect-auto md:h-[620px]">
      {/* The sample photo. It fades out into the page through a mask rather
          than an ivory overlay, and its lower edge is kept light and warm, so
          the fade doesn't pass through a muddy grey. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(165deg,#E9C9A0_0%,#C89D72_38%,#A07E5E_62%,#C7A987_84%,#EFE4D2_100%)] [mask-image:linear-gradient(to_bottom,#000_68%,rgb(0_0_0/0.75)_79%,rgb(0_0_0/0.35)_90%,transparent)]"
      >
        <div className="absolute -left-[10%] top-[8%] aspect-square w-[66%] rounded-full bg-[#F6E6CC] opacity-75 blur-[30px] md:w-[40%]" />
        <div className="absolute right-[10%] top-[29%] h-[46%] w-[16%] rounded-t-full bg-[#4E3C2E] opacity-60 blur-[6px] md:w-[9%]" />
        <div className="absolute right-[27%] top-[32%] h-[44%] w-[15%] rounded-t-full bg-[#F4EBDD] opacity-80 blur-[6px] md:right-[20%] md:w-[8%]" />
      </div>

      <header className="absolute inset-x-0 top-0 mx-auto flex max-w-5xl items-start justify-between px-5 pt-5">
        <div>
          <h1 className="font-display text-[26px] italic leading-tight text-white [text-shadow:0_2px_16px_rgb(30_20_10/0.45)]">
            {name}
          </h1>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white/75">
            Sample photo
          </p>
        </div>

        <div className="flex gap-1 text-white">
          <span
            title="Change photo — coming soon"
            className="flex h-10 w-10 items-center justify-center opacity-80"
          >
            <Camera className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
          <span
            title="Notifications — coming soon"
            className="flex h-10 w-10 items-center justify-center opacity-80"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
        </div>
      </header>

      <div className="absolute left-1/2 top-[51%] w-[76%] -translate-x-1/2 -translate-y-1/2 md:top-[47%] md:w-[440px]">
        <Hub weddingDate={weddingDate} />
      </div>
    </section>
  );
}
