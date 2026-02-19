"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AudioContextType {
  isAnyPlaying: boolean;
  currentlyPlayingId: string | null;
  registerPlay: (id: string) => void;
  registerStop: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isAnyPlaying: false,
  currentlyPlayingId: null,
  registerPlay: () => {},
  registerStop: () => {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const registerPlay = useCallback((id: string) => {
    setCurrentlyPlayingId(id);
  }, []);

  const registerStop = useCallback(() => {
    setCurrentlyPlayingId(null);
  }, []);

  return (
    <AudioContext.Provider value={{
      isAnyPlaying: currentlyPlayingId !== null,
      currentlyPlayingId,
      registerPlay,
      registerStop,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  return useContext(AudioContext);
}
