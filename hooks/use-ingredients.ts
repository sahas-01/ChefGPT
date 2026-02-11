// Custom hook that uses React Query but is safe for client-side storage
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface Ingredient {
  id: string;
  name: string;
  expiring: boolean;
}

const fetchIngredients = async (): Promise<Ingredient[]> => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("ingredients");
  return stored ? JSON.parse(stored) : [];
};

const saveIngredients = async (ingredients: Ingredient[]) => {
  if (typeof window !== "undefined") {
      localStorage.setItem("ingredients", JSON.stringify(ingredients));
  }
  return ingredients;
};

export function useIngredients() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ingredients"],
    queryFn: fetchIngredients,
    // Start with empty array to match server render
    initialData: [],
  });

  // Effect to re-fetch on mount so we get local storage data
  useEffect(() => {
     queryClient.invalidateQueries({ queryKey: ["ingredients"] });
  }, []);

  const addMutation = useMutation({
    mutationFn: async (names: string[]) => {
      const current = data || [];
      const newItems = names.map(name => ({
        id: Math.random().toString(36).substring(7),
        name,
        expiring: false
      }));
      const updated = [...current, ...newItems];
      return saveIngredients(updated);
    },
    onSuccess: (updated) => {
        queryClient.setQueryData(["ingredients"], updated);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
        const current = data || [];
        const updated = current.filter((i: Ingredient) => i.id !== id);
        return saveIngredients(updated);
    },
    onSuccess: (updated) => {
        queryClient.setQueryData(["ingredients"], updated);
    }
  });

  const toggleExpiringMutation = useMutation({
      mutationFn: async (id: string) => {
          const current = data || [];
          const updated = current.map((i: Ingredient) => i.id === id ? { ...i, expiring: !i.expiring } : i);
          return saveIngredients(updated);
      },
      onSuccess: (updated) => {
          queryClient.setQueryData(["ingredients"], updated);
      }
  });

  return {
    ingredients: data || [],
    isLoading: isLoading,
    addIngredients: addMutation.mutate,
    removeIngredient: removeMutation.mutate,
    toggleExpiring: toggleExpiringMutation.mutate
  };
}
