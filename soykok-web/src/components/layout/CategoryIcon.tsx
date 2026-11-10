import { Boxes, BrickWall, Building2, FlaskConical, LayoutGrid, Layers, Ruler, Sofa, type LucideIcon } from 'lucide-react';
import type { CategoryIconName } from '@/lib/category-nav';

const ICONS: Record<CategoryIconName, LucideIcon> = {
  layers: Layers,
  ruler: Ruler,
  flask: FlaskConical,
  grid: LayoutGrid,
  wall: BrickWall,
  building: Building2,
  sofa: Sofa,
  boxes: Boxes,
};

/** Menüdeki kategori ikonu (ikon adı sunucudan düz metin olarak gelir) */
export default function CategoryIcon({ name, className }: { name: CategoryIconName; className?: string }) {
  const Icon = ICONS[name] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
