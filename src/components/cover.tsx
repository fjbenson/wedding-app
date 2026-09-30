import { Bell, Camera } from "lucide-react";
import Hub from "@/components/hub";

/**
 * The top of the home screen, like a magazine cover: a champagne-to-ivory
 * wash with the couple's name, and the hub ring floating on it.
 *
 * On a phone it runs edge to edge and fades into the page. On a desktop it
 * becomes a rounded panel beside the "coming up" list.
 */
export default function Cover({
  name,
  weddingDate,
}: {
  name: string;
  weddingDate: string | null;
}) {
  return (
    <section className="relative aspect-[300/390] w-full overflow-hidden md:aspect-auto md:h-[620px] lg:h-full lg:min-h-[560px] lg:rounded-[32px]">
      {/* Champagne deepening towards the ring (so white reads on it), with a
          soft pearl sheen top left, then back to ivory at the foot. On a phone
          it fades into the page through a mask; on a desktop it's a panel. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(165deg,#EAD7B4_0%,#CFAE78_30%,#B8914F_58%,#C9A774_80%,#F3EBDD_100%)] [mask-image:linear-gradient(to_bottom,#000_70%,rgb(0_0_0/0.7)_82%,rgb(0_0_0/0.3)_92%,transparent)] lg:bg-[linear-gradient(165deg,#EAD7B4_0%,#CFAE78_32%,#B8914F_62%,#D6BC92_100%)] lg:[mask-image:none]"
      >
        <div className="absolute -left-[12%] -top-[6%] aspect-square w-[70%] rounded-full bg-[#FBF6EC] opacity-60 blur-[40px] md:w-[40%]" />
        <div className="absolute -right-[10%] top-[40%] aspect-square w-[45%] rounded-full bg-[#F1E7D4] opacity-30 blur-[40px] md:w-[28%]" />
      </div>

      <header className="absolute inset-x-0 top-0 mx-auto flex max-w-5xl items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {/* On desktop the sidebar already shows the name. */}
        <div className="lg:invisible">
          <h1 className="font-display text-[26px] italic leading-tight text-white [text-shadow:0_2px_16px_rgb(30_20_10/0.45)]">
            {name}
          </h1>
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

      <div className="absolute left-1/2 top-[51%] w-[min(76%,340px)] -translate-x-1/2 -translate-y-1/2 md:top-[47%] md:w-[440px] lg:top-1/2 lg:w-[min(70%,460px)]">
        <Hub weddingDate={weddingDate} />
      </div>
    </section>
  );
}
