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

export default function PokemonCard({ title, image, types, generation, number, species }: Props) {
  const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return (
    <Link href={`/pokemon/${slug}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-red-200 transition-all cursor-pointer group">
        <div className="bg-gray-50 p-4 flex items-center justify-center h-48 group-hover:bg-red-50 transition-colors">
          {image ? (
            <img
              src={image}
              alt={title}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-300 text-6xl">?</div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-mono">
              #{String(number).padStart(4, "0")}
            </span>
            <span className="text-xs text-gray-400">{generation}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
          {species && (
            <p className="text-xs text-gray-500 mb-2">{species}</p>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {types.map((type) => (
              <span
                key={type}
                className={`${typeColors[type] || "bg-gray-400"} text-white text-xs px-2.5 py-0.5 rounded-full font-medium`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
