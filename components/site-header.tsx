import Link from "next/link";
import { UtensilsCrossed, Heart, Menu } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <UtensilsCrossed className="size-6 text-orange-500" />
          <span className="text-xl font-bold tracking-tight text-orange-600">
            Cooking Planner
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-4">
            <Link
              href="/ingredients"
              className="text-sm font-medium transition-colors hover:text-orange-600"
            >
              Add Ingredients
            </Link>
            <Link
              href="/favorites"
              className="flex items-center text-sm font-medium transition-colors hover:text-orange-600"
            >
              <Heart className="mr-1 size-4" />
              Favorites
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
