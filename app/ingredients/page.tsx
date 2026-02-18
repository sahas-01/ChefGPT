"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
// import { useIngredients } from "@/hooks/use-ingredients";

export default function IngredientsPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [detectedCuisine, setDetectedCuisine] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("hi-IN"); // Default Hindi
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Use React Query Hook - keeping for now if used elsewhere but not used in render
  // const { ingredients, addIngredients, removeIngredient, toggleExpiring } = useIngredients();

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

        setInput(prev => (prev ? prev + " " + transcript : transcript)); 
        toast.success("Speech captured.");
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

  const handleFindRecipes = () => {
    if (!input.trim()) {
      toast.warning("Please describe what you have in the text box!");
      return;
    }
    
    const raw = input.trim();

    // Detect language from typed text using Unicode script ranges
    // Only set if the user hasn't already set it via voice (STT is more accurate)
    const hasDevanagari = /[\u0900-\u097F]/.test(raw);
    const hasTamil = /[\u0B80-\u0BFF]/.test(raw);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(raw);
    const hasKannada = /[\u0C80-\u0CFF]/.test(raw);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(raw);
    const hasBengali = /[\u0980-\u09FF]/.test(raw);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(raw);
    const hasPunjabi = /[\u0A00-\u0A7F]/.test(raw);

    if (hasDevanagari) localStorage.setItem("userLanguage", "hi-IN");
    else if (hasTamil) localStorage.setItem("userLanguage", "ta-IN");
    else if (hasTelugu) localStorage.setItem("userLanguage", "te-IN");
    else if (hasKannada) localStorage.setItem("userLanguage", "kn-IN");
    else if (hasMalayalam) localStorage.setItem("userLanguage", "ml-IN");
    else if (hasBengali) localStorage.setItem("userLanguage", "bn-IN");
    else if (hasGujarati) localStorage.setItem("userLanguage", "gu-IN");
    else if (hasPunjabi) localStorage.setItem("userLanguage", "pa-IN");
    else localStorage.setItem("userLanguage", "en-IN"); // Default to English for Latin script

    // Split by comma, new line, or 'and'
    const items = raw.split(/[,\n]| and /).map(s => s.trim()).filter(s => s.length > 0);
    
    if (items.length === 0) {
        toast.warning("Could not identify ingredients.");
        return;
    }

    const ingredientObjects = items.map((name, idx) => ({ 
        id: `ing-${Date.now()}-${idx}`, 
        name 
    }));

    localStorage.setItem("ingredients", JSON.stringify(ingredientObjects));
    router.push("/suggestions");
  };

  return (
    <div className="max-w-2xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center space-y-5 pb-10">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold tracking-tight">What's in your Kitchen?</h1>
        <p className="text-sm text-muted-foreground">
          Type or speak your ingredients and we'll find recipes for you.
        </p>
      </div>

      <div className="w-full relative shadow-md rounded-xl border border-border bg-card">
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="e.g. paneer, onions, tomatoes, some spices... (Type or Speak)"
             className="flex min-h-[140px] w-full rounded-xl bg-transparent px-4 py-4 text-sm placeholder:text-muted-foreground focus:outline-none resize-none"
             onKeyDown={(e) => {
               if(e.key === "Enter" && !e.shiftKey) {
                 e.preventDefault(); 
                 handleFindRecipes();
               }
             }}
           />
           <div className="absolute right-3 bottom-3 flex gap-2">
               <Button 
                   size="icon" 
                   variant={isRecording ? "destructive" : "secondary"}
                   onClick={toggleRecording}
                   className="h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-all"
                   title="Speak Ingredients"
               >
                   {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
               </Button>
           </div>
      </div>

      <div className="flex justify-center">
        <Button 
          size="sm"
          onClick={handleFindRecipes} 
          disabled={!input.trim()}
          className="w-full max-w-xs shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm h-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          Ask AI Chef for Recipes <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


