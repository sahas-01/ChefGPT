"use client";

import Link from "next/link";
import { ArrowRight, ChefHat, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 text-center space-y-8">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-75 blur-2xl animate-pulse"></div>
        <div className="relative bg-background rounded-full p-8 border-4 border-orange-100 shadow-xl">
          <ChefHat className="w-24 h-24 text-orange-600" />
        </div>
      </div>

      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
          Turn Your Leftovers into <br className="hidden sm:inline" />
          Authentic Indian Feasts
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Don't let good food go to waste. Tell us what's in your fridge, and we'll suggest delicious Indian recipes instantly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
        <Link href="/ingredients" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-64 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap">
            <Sparkles className="mr-2 w-5 h-5 flex-shrink-0" />
            Find Recipes Now
          </Button>
        </Link>
        <Link href="/favorites" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-64 h-14 text-lg rounded-full border-2 whitespace-nowrap">
            View Favorites
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-left">
        <FeatureCard 
          icon="🍅" 
          title="Reduce Waste" 
          desc="Use up expiring ingredients like tomatoes, spinach, and dairy." 
        />
        <FeatureCard 
          icon="🍛" 
          title="Authentic Taste" 
          desc="Discover regional gems from Punjab to Kerala." 
        />
        <FeatureCard 
          icon="🗣️" 
          title="Voice Enabled" 
          desc="Just speak your ingredients. We'll listen and suggest." 
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 hover:bg-orange-100 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
