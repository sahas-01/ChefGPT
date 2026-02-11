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
    
    // Parse input into array simply by splitting by common delimiters
    const raw = input.trim();
    // Split by comma, new line, or 'and' - simple heuristic
    const items = raw.split(/[,\n]| and /).map(s => s.trim()).filter(s => s.length > 0);
    
    if (items.length === 0) {
        toast.warning("Could not identify ingredients.");
        return;
    }

    // Convert to objects to match API expectation
    const ingredientObjects = items.map((name, idx) => ({ 
        id: `ing-${Date.now()}-${idx}`, 
        name 
    }));

    // Save to localStorage so suggestions page can read it
    localStorage.setItem("ingredients", JSON.stringify(ingredientObjects));
    console.log("ingredients", ingredientObjects);
    router.push("/suggestions");
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">What's in your Kitchen?</h1>
        <p className="text-muted-foreground">
          Add ingredients manually or just speak them out. Mark expiring items to prioritize.
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto relative shadow-xl rounded-xl border border-border bg-card">
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Example: I have paneer, onions, tomatoes and some spices. What can I make? (Type or Speak)"
             className="flex min-h-[200px] w-full rounded-xl bg-transparent px-6 py-6 text-lg placeholder:text-muted-foreground focus:outline-none resize-none"
             onKeyDown={(e) => {
               if(e.key === "Enter" && !e.shiftKey) {
                 e.preventDefault(); 
                 handleFindRecipes();
               }
             }}
           />
           <div className="absolute right-4 bottom-4 flex gap-2">
               <Button 
                   size="icon" 
                   variant={isRecording ? "destructive" : "secondary"}
                   onClick={toggleRecording}
                   className="h-10 w-10 rounded-full shadow-sm hover:scale-105 transition-all"
                   title="Speak Ingredients"
               >
                   {isRecording ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
               </Button>
           </div>
      </div>

      <div className="flex justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button 
          size="lg" 
          onClick={handleFindRecipes} 
          disabled={!input.trim()}
          className="w-full max-w-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 text-lg h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          Ask AI Chef for Recipes <Sparkles className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
