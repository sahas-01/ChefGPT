"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock, ChefHat, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import recipesData from "@/data/recipes.json";
import { toast } from "sonner";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);

  useEffect(() => {
    const savedFavs = localStorage.getItem("favorites");
    if (savedFavs) {
      const parsed = JSON.parse(savedFavs);
      setFavorites(parsed);
      const filtered = recipesData.filter(r => parsed.includes(r.id));
      setFavoriteRecipes(filtered);
    }
  }, []);

  const removeFavorite = (id: string) => {
    const newFavs = favorites.filter(fid => fid !== id);
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
    setFavoriteRecipes(prev => prev.filter(r => r.id !== id));
    toast("Removed from favorites");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Your Favorite Recipes</h2>
          <p className="text-muted-foreground">Saved for later cooking.</p>
        </div>
        <Link href="/">
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back Home</Button>
        </Link>
      </div>

      {favoriteRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRecipes.map(recipe => (
            <div key={recipe.id} className="relative group">
              <RecipeCard 
                recipe={recipe} 
                isFavorite={true}
                onToggleFavorite={removeFavorite}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No favorites yet</h3>
          <p className="text-muted-foreground">Go back and explore recipes to save them here.</p>
          <Link href="/ingredients" className="mt-8 inline-block">
            <Button>Explore Recipes</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
