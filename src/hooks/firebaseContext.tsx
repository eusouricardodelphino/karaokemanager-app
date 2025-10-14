import React, { createContext, useContext, ReactNode } from "react";
import { Firestore } from "firebase/firestore";
import { db } from "../firebase";

interface FirebaseContextProps {
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextProps | null>(null);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ db }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase deve ser usado dentro de um FirebaseProvider");
  }
  return context;
};