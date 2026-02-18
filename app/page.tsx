"use client";

import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 text-center space-y-5">
      {/* Compact icon */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-60 blur-xl animate-pulse"></div>
        <div className="relative bg-background rounded-full p-4 border-2 border-orange-100 shadow-lg">
          <span className="text-4xl">👨‍🍳</span>
        </div>
      </div>

      {/* Tighter heading */}
      <div className="space-y-2 max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
          Turn Your Leftovers into Authentic Indian Feasts
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tell us what's in your fridge — we'll suggest delicious Indian recipes instantly.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto justify-center">
        <Link href="/ingredients" className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-48 h-10 text-sm rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105">
            <Sparkles className="mr-2 w-4 h-4 flex-shrink-0" />
            Find Recipes Now
          </Button>
        </Link>
        <Link href="/favorites" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-48 h-10 text-sm rounded-full border-2">
            <Heart className="mr-2 w-4 h-4" />
            View Favorites
          </Button>
        </Link>
        <a href="https://t.me/indic_chef_bot" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-48 h-10 text-sm rounded-full border-2 border-sky-400 text-sky-600 hover:bg-sky-50 transition-all hover:scale-105">
            <svg className="mr-2 w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Chat on Telegram
          </Button>
        </a>
      </div>

      {/* Compact feature cards */}
      <div className="grid grid-cols-3 gap-4 mt-6 text-left w-full max-w-xl">
        <FeatureCard icon="🍅" title="Reduce Waste" desc="Use up expiring ingredients before they go bad." />
        <FeatureCard icon="🍛" title="Authentic" desc="Regional gems from Punjab to Kerala." />
        <FeatureCard icon="🗣️" title="Voice Input" desc="Speak your ingredients, we'll listen." />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 hover:bg-orange-100 transition-colors">
      <div className="text-2xl mb-1">{icon}</div>
      <h3 className="font-semibold text-xs mb-1 text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
    </div>
  );
}
