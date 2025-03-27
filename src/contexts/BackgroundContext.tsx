// src/contexts/BackgroundContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

// Simplified background context to just handle the theme
interface BackgroundContextType {
  intensity: "low" | "medium" | "high";
  setIntensity: (intensity: "low" | "medium" | "high") => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined
);

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
};

interface BackgroundProviderProps {
  children: ReactNode;
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({
  children,
}) => {
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">(
    "medium"
  );

  return (
    <BackgroundContext.Provider value={{ intensity, setIntensity }}>
      {/* Simple background container with no complex effects */}
      <div className="background-container">{children}</div>
    </BackgroundContext.Provider>
  );
};
