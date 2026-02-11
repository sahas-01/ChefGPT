"use client";

import { useState } from "react";
// Import Globe icon
import { Clock, ChefHat, Volume2, Heart, StopCircle, Loader2, Globe, Eye, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Recipe {
  id: string;
  name: string;
  region: string;
  ingredients: string[];
  steps: string[];
  time: string;
  difficulty: string;
  description?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  matchingIngredients?: string[];
}

import { useAiChef } from "@/hooks/use-ai-chef";

export function RecipeCard({ recipe, isFavorite, onToggleFavorite, matchingIngredients = [] }: RecipeCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Translation state
  const [translatedRecipe, setTranslatedRecipe] = useState<Recipe | null>(null);
  const { translate, isTranslating } = useAiChef();
  const [isCardTranslating, setIsCardTranslating] = useState(false); 

  // Display either the translated version or the original
  const displayRecipe = translatedRecipe || recipe;

  const handleTranslateCard = async () => {
    if (translatedRecipe) return; 

    const lang = localStorage.getItem("userLanguage") || "hi-IN";
    if (lang.startsWith("en")) {
        toast.info("Already in English!");
        return;
    }

    setIsCardTranslating(true);
    try {
        // Parallelize translation to be robust against separator failures
        // We will translate:
        // 1. Name
        // 2. Ingredients (joined by newlines)
        // 3. Steps (joined by newlines)
        // 4. Metadata field (Region | Time | Difficulty)

        // Metadata block structure: Region ||| Time ||| Difficulty
        // We use ||| for simple one-line fields as it's reliable enough for short strings.
        const metadataText = `${recipe.region} ||| ${recipe.time} ||| ${recipe.difficulty}`;
        const ingredientsText = recipe.ingredients.join("\n");
        const stepsText = recipe.steps.join("\n");

        const [nameRes, metadataRes, ingRes, stepsRes] = await Promise.all([
          translate({ text: recipe.name, source_language_code: lang }),
          translate({ text: metadataText, source_language_code: lang }),
          translate({ text: ingredientsText, source_language_code: lang }),
          translate({ text: stepsText, source_language_code: lang })
        ]);

        // Parse Metadata
        let translatedRegion = recipe.region;
        let translatedTime = recipe.time;
        let translatedDifficulty = recipe.difficulty;

        if (metadataRes.translated_text) {
             // Sometimes models might change the separator or add spaces.
             // We try strict split first, then loose
             let parts = metadataRes.translated_text.split("|||");
             if (parts.length < 3) {
                 // Try with spaces around separator if model added them
                 parts = metadataRes.translated_text.split(/\s*\|\|\|\s*/);
             }
             
             if (parts.length >= 3) {
                 translatedRegion = parts[0].trim();
                 translatedTime = parts[1].trim();
                 translatedDifficulty = parts[2].trim();
             } 
        }

        const translatedIngredients = ingRes.translated_text 
            ? ingRes.translated_text.split("\n").map(s => s.trim()).filter(s => s.length > 0)
            : recipe.ingredients;

        const translatedSteps = stepsRes.translated_text
            ? stepsRes.translated_text.split("\n").map(s => s.trim()).filter(s => s.length > 0)
            : recipe.steps;

        setTranslatedRecipe({
            ...recipe,
            name: nameRes.translated_text || recipe.name,
            region: translatedRegion,
            time: translatedTime,
            difficulty: translatedDifficulty,
            ingredients: translatedIngredients,
            steps: translatedSteps
        });
        
        toast.success("Recipe translated!");

    } catch (e) {
        console.error("Card Translation failed", e);
        toast.error("Could not translate recipe completely");
    } finally {
        setIsCardTranslating(false);
    }
  };

  const handleReadAloud = async () => {
    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    toast.info(`Reading recipe for ${displayRecipe.name}...`);

    try {
      const textToRead = `Recipe: ${displayRecipe.name}. Region: ${displayRecipe.region}. Time: ${displayRecipe.time}. Difficulty: ${displayRecipe.difficulty}. Ingredients: ${displayRecipe.ingredients.join(", ")}. Steps: ${displayRecipe.steps.join(". ")}`;
      
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToRead,
          language: "en-IN", 
          speaker: "shubh" 
        }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        setCurrentAudio(audio);
        audio.play();
        audio.onended = () => setIsPlaying(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to read recipe.");
      setIsPlaying(false);
    }
  };

  return (
    <>
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-orange-100 dark:border-orange-900 group relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Badge className="mb-2 bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">
              {displayRecipe.region}
            </Badge>
            <CardTitle className="text-xl font-bold">{displayRecipe.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(recipe.id)}
            className={isFavorite ? "text-red-600 hover:text-red-700" : "text-gray-400 hover:text-red-500"}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
          <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {displayRecipe.time}</span>
          <span className="flex items-center"><ChefHat className="w-4 h-4 mr-1" /> {displayRecipe.difficulty}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {translatedRecipe?.description && !translatedRecipe.steps.length && (
            <div className="text-sm p-2 bg-muted rounded italic">
                {translatedRecipe.description}
            </div>
        )}

        <div>
          <h4 className="font-bold mb-2 text-sm uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Ingredients</h4>
          <ul className="text-sm list-disc pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
            {displayRecipe.ingredients.slice(0, 4).map((ing: string, i: number) => {
               const isMatch = matchingIngredients.some(m => ing.toLowerCase().includes(m.toLowerCase()));
               return (
                 <li key={i} className={isMatch ? "font-semibold text-green-700 dark:text-green-500" : ""}>
                   {ing}
                 </li>
               );
            })}
            {displayRecipe.ingredients.length > 4 && <li className="text-gray-500 italic">+{displayRecipe.ingredients.length - 4} more...</li>}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Instructions</h4>
          <ol className="text-sm list-decimal pl-4 space-y-2">
            {displayRecipe.steps.slice(0, 2).map((step: string, i: number) => (
              <li key={i} className="line-clamp-2">{step}</li>
            ))}
          </ol>
          <Button variant="link" onClick={() => setIsModalOpen(true)} className="p-0 h-auto mt-2 text-orange-600 hover:text-orange-700">
              View Full Recipe &rarr;
          </Button>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t bg-secondary/10 flex gap-2">
        <Button 
          variant={isPlaying ? "destructive" : "secondary"} 
          className="flex-1 gap-2 transition-all active:scale-95"
          onClick={handleReadAloud}
        >
          {isPlaying ? <><StopCircle className="w-4 h-4 ml-2 animate-pulse" /> Stop</> : <><Volume2 className="w-4 h-4" /> Read</>}
        </Button>
        
        {!translatedRecipe && (
            <Button 
                variant="outline"
                className="flex-shrink-0"
                onClick={handleTranslateCard}
                disabled={isCardTranslating}
                title="Translate to English"
            >
                {isCardTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            </Button>
        )}
      </CardFooter>
    </Card>

    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">{displayRecipe.region}</Badge>
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{displayRecipe.name}</DialogTitle>
                <DialogDescription className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {displayRecipe.time}</span>
                    <span className="flex items-center"><ChefHat className="w-4 h-4 mr-1" /> {displayRecipe.difficulty}</span>
                </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-8 py-4">
                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center"><span className="bg-orange-100 p-1 rounded mr-2">🍅</span> Ingredients</h3>
                    <ul className="space-y-2 text-sm">
                        {displayRecipe.ingredients.map((ing: string, i: number) => (
                            <li key={i} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span className={matchingIngredients.some(m => ing.toLowerCase().includes(m.toLowerCase())) ? "font-medium text-green-700 dark:text-green-500" : ""}>{ing}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center"><span className="bg-orange-100 p-1 rounded mr-2">🍳</span> Instructions</h3>
                    <ol className="space-y-4 text-sm list-decimal pl-4">
                        {displayRecipe.steps.map((step: string, i: number) => (
                            <li key={i} className="pl-1 leading-relaxed text-gray-700 dark:text-gray-300">{step}</li>
                        ))}
                    </ol>
                </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                 {!translatedRecipe && (
                     <Button 
                        onClick={handleTranslateCard} 
                        disabled={isCardTranslating}
                        className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                        {isCardTranslating ? "Translating..." : "Translate Recipe"}
                     </Button>
                 )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
