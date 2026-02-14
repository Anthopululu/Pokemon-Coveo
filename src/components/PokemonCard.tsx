import Link from "next/link";
import { typeColors } from "@/lib/pokemon-utils";

interface Props {
  title: string;
  image: string;
  types: string[];
  generation: string;
  number: number;
  species: string;
}

// bg colors for the image area based on type
const typeBgColors: Record<string, string> = {
  Normal: "bg-stone-700", Fire: "bg-orange-900/60", Water: "bg-blue-900/60",
  Electric: "bg-yellow-900/50", Grass: "bg-green-900/60", Ice: "bg-cyan-900/50",
  Fighting: "bg-red-900/60", Poison: "bg-purple-900/60", Ground: "bg-amber-900/50",
  Flying: "bg-indigo-900/50", Psychic: "bg-pink-900/50", Bug: "bg-lime-900/50",
  Rock: "bg-yellow-900/40", Ghost: "bg-purple-950/70", Dragon: "bg-violet-900/60",
  Dark: "bg-stone-800", Steel: "bg-slate-700", Fairy: "bg-pink-900/40",
};

export default function PokemonCard({ title, image, types, generation, number, species }: Props) {
  const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const primaryType = types[0] || "Normal";
  const bgColor = typeBgColors[primaryType] || "bg-slate-700";

  return (
    <Link href={`/pokemon/${slug}`}>
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 cursor-pointer group hover:-translate-y-1">
        <div className={`${bgColor} p-4 flex items-center justify-center h-48 relative`}>
          <div className="absolute top-3 right-3 text-xs font-mono text-white/30">
            #{String(number).padStart(4, "0")}
          </div>
          {image ? (
            <img
              src={image}
              alt={title}
              className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-500 text-6xl">?</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          {species && (
            <p className="text-xs text-slate-400 mb-3">{species}</p>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {types.map((type) => (
              <span
                key={type}
                className={`${typeColors[type] || "bg-slate-500"} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}
              >
                {type}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">{generation}</div>
        </div>
      </div>
    </Link>
  );
}
