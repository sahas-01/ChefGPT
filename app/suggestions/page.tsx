"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, ChefHat, Sparkles, Volume2, StopCircle, RefreshCcw, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

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

import { useAiChef } from "@/hooks/use-ai-chef";

export default function SuggestionsPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  
  const { 
    askAiChefAsync, 
    // isChefThinking is removed in favor of local state
    chefResponse, 
    speak,
    translate,
    isTranslating 
  } = useAiChef();

  // Local state for audio element to handle playing
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [chefMessage, setChefMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const savedFavs = localStorage.getItem("favorites");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Auto-trigger on mount only once
    if (!hasFetched.current) {
        hasFetched.current = true;
        handleAskChef();
    }
  }, []);

  const handleTranslate = async () => {
      if (translatedSummary) {
          setTranslatedSummary(null);
          return;
      }

      if (!chefMessage) return;
      
      const lang = localStorage.getItem("userLanguage") || "hi-IN";
      if (lang.startsWith("en")) {
          toast.info("Already in English!");
          return;
      }
      
      try {
          const res = await translate({ text: chefMessage, source_language_code: lang, target_language_code: "en-IN" });
          if (res.translated_text) {
              const cleanedText = res.translated_text
                  .replace(/^(Here is the translation.*?:\s*|Translation:\s*)/i, "")
                  .replace(/^"(.*)"$/, "$1")
                  .trim();
              setTranslatedSummary(cleanedText);
          }
      } catch (e) {
          console.error("Translation fail", e);
          toast.error("Could not translate");
      }
  };

  const toggleFavorite = (id: string) => {
    let newFavs = [...favorites];
    if (newFavs.includes(id)) {
      newFavs = newFavs.filter(fid => fid !== id);
      toast("Removed from favorites");
    } else {
      newFavs.push(id);
      toast("Saved to favorites!");
    }
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const handleAskChef = async () => {
      const stored = localStorage.getItem("ingredients");
      const cuisine = localStorage.getItem("preferredCuisine") || undefined;
      const lang = localStorage.getItem("userLanguage") || "hi-IN";
      
      setTranslatedSummary(null);
      setChefMessage(null);

      if (!stored) return;
      
      const userIngredients = JSON.parse(stored);
      
    
      setIsThinking(true);
      
      try {
          // Wrapped in try-catch for better toast handling if needed
          const data = await askAiChefAsync({ ingredients: userIngredients, cuisine, language: lang });
          
          if (data.recipes) {
              setGeneratedRecipes(data.recipes);
              setChefMessage(data.message);
              // Auto play
              handleSpeak(data.message, lang);
          }
      } catch (e) {
          console.error("Chef failed", e);
          toast.error("Chef is busy right now.");
      } finally {
          setIsThinking(false);
      }
  };

  const handleSpeak = async (text: string, lang: string = "hi-IN") => {
      if (isPlaying && currentAudio) {
          currentAudio.pause();
          setIsPlaying(false);
          return;
      }

      try {
          setIsPlaying(true); // Optimistic UI
          const data = await speak({ text, language: lang, speaker: "shubh" });
          
          if (data.audio) {
              const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
              setCurrentAudio(audio);
              audio.play();
              audio.onended = () => setIsPlaying(false);
          }
      } catch (err) {
          console.error(err);
          setIsPlaying(false);
      }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">AI Chef Custom Menu</h2>
          <p className="text-muted-foreground">Recipes created just for your ingredients.</p>
        </div>
        <Link href="/ingredients">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Edit Ingredients</Button>
        </Link>
      </div>
      
      {/* AI Chef Section - Simplified */}
      <div className="space-y-4">
          <div className="flex justify-end gap-2">
                {chefMessage && (
                   <Button 
                       variant="outline"
                       size="sm"
                       onClick={handleTranslate}
                       disabled={isTranslating}
                       className="text-muted-foreground hover:text-foreground"
                   >
                        {isTranslating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                        {translatedSummary ? "Show Original" : "Translate"}
                   </Button>
               )}
               <Button 
                   size="sm"
                   onClick={handleAskChef} 
                   disabled={isThinking}
                   className="bg-orange-600 hover:bg-orange-700 text-white"
               >
                   {isThinking ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                   {isThinking ? null : "Regenerate"}
               </Button>
          </div>
          
          {chefMessage && (
              <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="text-xl font-medium leading-relaxed italic border-l-4 border-orange-500 pl-6 py-2">
                      "{translatedSummary || chefMessage}"
                  </div>
                  <div className="mt-2 ml-6">
                       {!translatedSummary && (
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
                              onClick={() => handleSpeak(chefMessage, localStorage.getItem("userLanguage") || "hi-IN")}
                           >
                              {isPlaying ? <><StopCircle className="w-4 h-4 mr-2" /> Stop</> : <><Volume2 className="w-4 h-4 mr-2" /> Listen to Chef</>}
                           </Button>
                       )}
                  </div>
              </div>
          )}
      </div>

      {/* Loading State */}
      {isThinking && (
        <div className="py-20 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
            <h3 className="text-xl font-medium animate-pulse">Consulting the ancient texts...</h3>
        </div>
      )}

      {/* Generated Grid */}
      {!isThinking && generatedRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700">
              {generatedRecipes.map((recipe, idx) => (
                  <RecipeCard 
                    key={idx} 
                    recipe={recipe} 
                    isFavorite={favorites.includes(recipe.id)}
                    onToggleFavorite={toggleFavorite}
                    // For generated recipes, we assume all listed ingredients are relevant
                    matchingIngredients={recipe.ingredients}
                  />
              ))}
          </div>
      )}

      {!isThinking && !chefResponse && generatedRecipes.length === 0 && (
         <div className="text-center py-20 bg-muted/20 rounded-xl">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No recipes generated yet</h3>
            <p className="text-muted-foreground">Add some ingredients and let the AI Chef work its magic.</p>
            <Link href="/ingredients" className="mt-4 inline-block">
                <Button>Add Ingredients</Button>
            </Link>
         </div>
      )}
    </div>
  );
}
