"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Plus, Trash2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useIngredients } from "@/hooks/use-ingredients";

export default function IngredientsPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [detectedCuisine, setDetectedCuisine] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("hi-IN"); // Default Hindi
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Use React Query Hook
  const { ingredients, addIngredients, removeIngredient, toggleExpiring } = useIngredients();

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await handleTranscribe(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Listening... Speak your ingredients");
    } catch (err) {
      console.error("Mic access denied", err);
      toast.error("Microphone access denied. Please allow permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    const toastId = toast.loading("Processing speech (Saaras v3)...");
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("STT Failed");

      const data = await res.json();
      const transcript = data.transcript;
      const langCode = data.language_code;

      if (langCode) {
          setDetectedLanguage(langCode);
          localStorage.setItem("userLanguage", langCode);
      }

      if (transcript) {
        // Simple keyword detection for cuisine
        const lower = transcript.toLowerCase();
        let detected = "";
        if (lower.includes("south indian") || lower.includes("south")) detected = "South Indian";
        else if (lower.includes("north indian") || lower.includes("north")) detected = "North Indian";
        else if (lower.includes("chinese")) detected = "Indo-Chinese";
        else if (lower.includes("gujarati")) detected = "Gujarati";
        else if (lower.includes("punjabi")) detected = "Punjabi";
        else if (lower.includes("maharashtrian")) detected = "Maharashtrian";
        else if (lower.includes("bengali")) detected = "Bengali";
        else if (lower.includes("rajasthani")) detected = "Rajasthani";
        
        if (detected) {
            setDetectedCuisine(detected);
            localStorage.setItem("preferredCuisine", detected);
            toast.success(`Cuisine detected: ${detected}`);
        }

        setInput(transcript);
        // Removed handleAddItem(transcript) to allow editing
        toast.success("Speech captured. Review and add.");
      } else {
        toast.warning("Could not understand audio");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process speech");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleAddItem = (val: string) => {
    const raw = val.trim();
    if (!raw) return;
    
    // Split by comma or 'and' if spoken naturally
    const items = raw.split(/,| and /).map(s => s.trim()).filter(Boolean);
    
    addIngredients(items);
    setInput("");
  };

  const handleRemoveItem = (id: string) => {
    removeIngredient(id);
  };

  const handleToggleExpiring = (id: string) => {
    toggleExpiring(id);
  };

  const handleFindRecipes = () => {
    if (ingredients.length === 0) {
      toast.warning("Please add at least one ingredient!");
      return;
    }
    router.push("/suggestions");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">What's in your Kitchen?</h1>
        <p className="text-muted-foreground">
          Add ingredients manually or just speak them out. Mark expiring items to prioritize.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="e.g. potatoes, onions, paneer (Type or Speak)"
               className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] p-4 pr-16 resize-none shadow-sm"
               onKeyDown={(e) => {
                 if(e.key === "Enter" && !e.shiftKey) {
                   e.preventDefault(); 
                   handleAddItem(input);
                 }
               }}
             />
             <Button 
               size="icon" 
               variant={isRecording ? "destructive" : "secondary"}
               onClick={toggleRecording}
               className="absolute right-4 bottom-4 h-10 w-10 shadow-sm"
               title="Speak Ingredients"
             >
               {isRecording ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
             </Button>
        </div>

        <Button onClick={() => handleAddItem(input)} className="h-12 w-full text-lg shadow-sm" disabled={!input.trim()}>
          <Plus className="mr-2 h-5 w-5" /> Add to Pantry
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ingredients.map((item) => (
          <Card key={item.id} className={`transition-all ${item.expiring ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "hover:border-orange-200"}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium capitalize">{item.name}</p>
                <div 
                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer w-fit ${item.expiring ? "bg-red-100 text-red-700 font-semibold" : "bg-secondary text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}
                  onClick={() => handleToggleExpiring(item.id)}
                >
                  {item.expiring ? "Expiring Soon!" : "Mark as expiring"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
          <p>No ingredients added yet.</p>
        </div>
      )}

      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4">
        <Button 
          size="lg" 
          onClick={handleFindRecipes} 
          disabled={ingredients.length === 0}
          className="w-full max-w-md shadow-2xl text-lg h-14 rounded-full animate-in slide-in-from-bottom-4 duration-500"
        >
          Ask AI Chef for Recipes <Sparkles className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
