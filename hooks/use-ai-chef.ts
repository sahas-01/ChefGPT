import { useMutation } from "@tanstack/react-query";
import { Ingredient } from "./use-ingredients";

interface Recipe {
  id: string;
  name: string;
  region: string;
  instruments: string[];
  steps: string[];
  time: string;
  difficulty: string;
  description?: string;
  // Ingredients from API response structure...
  ingredients: string[];
}

interface AiChefResponse {
  message: string;
  recipes: Recipe[];
}

interface TtsResponse {
  audio: string;
}

interface SttResponse {
  transcript: string;
}

export function useAiChef() {
  const chatMutation = useMutation({
    mutationFn: async (payload: { ingredients: Ingredient[], cuisine?: string, language?: string }) => {
      const { ingredients, cuisine, language = "Hindi" } = payload;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ingredients,
          cuisine, 
          language 
        })
      });
      if (!res.ok) throw new Error("Failed to consult AI Chef");
      return res.json() as Promise<AiChefResponse>;
    }
  });

  /* Update ttsMutation to accept object for flexibility */
  const ttsMutation = useMutation({
    mutationFn: async (payload: { text: string; language?: string; speaker?: string }) => {
      const { text, language = "hi-IN", speaker = "shubh" } = payload;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, speaker })
      });
      if (!res.ok) throw new Error("TTS failed");
      return res.json() as Promise<TtsResponse>;
    }
  });

  const sttMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      
      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("STT failed");
      return res.json() as Promise<SttResponse & { language_code?: string }>;
    }
  });

  const translateMutation = useMutation({
      mutationFn: async (payload: { text: string; source_language_code: string; target_language_code?: string }) => {
          const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  input: payload.text, 
                  source_language_code: payload.source_language_code, 
                  target_language_code: payload.target_language_code || "en-IN" 
              })
          });
          if (!res.ok) throw new Error("Translation failed");
          return res.json() as Promise<{ translated_text: string }>;
      }
  });

  return {
    askAiChef: chatMutation.mutate,
    askAiChefAsync: chatMutation.mutateAsync,
    isChefThinking: chatMutation.isPending,
    chefResponse: chatMutation.data,
    
    speak: ttsMutation.mutateAsync,
    isSpeaking: ttsMutation.isPending,
    
    transcribe: sttMutation.mutateAsync,
    isTranscribing: sttMutation.isPending,

    translate: translateMutation.mutateAsync,
    isTranslating: translateMutation.isPending
  };
}
