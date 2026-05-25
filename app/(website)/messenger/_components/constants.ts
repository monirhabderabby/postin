import {
  QUICK_REACTIONS,
  REACTIONS,
  resolveReaction,
} from "@/lib/reactions";

export const THEMES = [
  { id: "default", name: "Default", color: "from-white to-white" },
  { id: "obesity-1", name: "Obesity", color: "from-emerald-200 to-teal-200" },
  { id: "obesity-2", name: "Obesity", color: "from-amber-200 to-orange-200" },
  { id: "vr-1", name: "Virtual Reality", color: "from-fuchsia-200 to-pink-200" },
  { id: "smart-grid", name: "Smart Grid", color: "from-yellow-200 to-amber-300" },
  { id: "wind-power", name: "Wind Power", color: "from-cyan-200 to-sky-200" },
  { id: "smart-building", name: "Smart Building", color: "from-stone-200 to-zinc-300" },
  { id: "vr-2", name: "Virtual Reality", color: "from-violet-200 to-purple-200" },
  { id: "social-media", name: "Social Media", color: "from-rose-200 to-red-200" },
  { id: "blog-themes", name: "Blog Themes", color: "from-blue-200 to-indigo-200" },
  { id: "blockchain", name: "Blockchain", color: "from-orange-200 to-red-300" },
  { id: "biotech", name: "Biotech", color: "from-lime-200 to-green-200" },
  { id: "blockchain-2", name: "Blockchain", color: "from-pink-200 to-rose-300" },
  { id: "robotics", name: "Robotics & AI", color: "from-red-200 to-rose-300" },
  { id: "solar-power", name: "Solar Power", color: "from-yellow-200 to-orange-300" },
  { id: "healthcare", name: "Healthcare", color: "from-emerald-100 to-emerald-300" },
];

export function getThemeById(themeId?: string | null) {
  if (!themeId) return null;
  return THEMES.find((theme) => theme.id === themeId) || null;
}

export type MessengerReactionType = (typeof REACTIONS)[number]["type"];

export { QUICK_REACTIONS, REACTIONS, resolveReaction };
