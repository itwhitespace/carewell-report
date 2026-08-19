import { loadSlideData } from "@/lib/slide-data";
import { SlideDeck } from "@/components/slides/SlideDeck";

export const dynamic = "force-dynamic";

export default async function SlidesPage() {
  const data = await loadSlideData();
  return <SlideDeck data={data} />;
}
