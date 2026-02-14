// Type -> Tailwind color mapping
// Tailwind needs full class names (no dynamic string concat), so we list them all
export const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-orange-500", Water: "bg-blue-500",
  Electric: "bg-yellow-400", Grass: "bg-green-500", Ice: "bg-cyan-300",
  Fighting: "bg-red-700", Poison: "bg-purple-500", Ground: "bg-amber-600",
  Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-yellow-700", Ghost: "bg-purple-700", Dragon: "bg-violet-600",
  Dark: "bg-gray-700", Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

export const typeBgGradients: Record<string, string> = {
  Normal: "from-gray-100 to-gray-200", Fire: "from-orange-50 to-orange-100",
  Water: "from-blue-50 to-blue-100", Electric: "from-yellow-50 to-yellow-100",
  Grass: "from-green-50 to-green-100", Ice: "from-cyan-50 to-cyan-100",
  Fighting: "from-red-50 to-red-100", Poison: "from-purple-50 to-purple-100",
  Ground: "from-amber-50 to-amber-100", Flying: "from-indigo-50 to-indigo-100",
  Psychic: "from-pink-50 to-pink-100", Bug: "from-lime-50 to-lime-100",
  Rock: "from-yellow-50 to-yellow-100", Ghost: "from-purple-50 to-purple-100",
  Dragon: "from-violet-50 to-violet-100", Dark: "from-gray-200 to-gray-300",
  Steel: "from-slate-50 to-slate-100", Fairy: "from-pink-50 to-pink-100",
};
