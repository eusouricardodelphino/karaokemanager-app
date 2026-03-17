import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useFirebase } from "@/hooks/firebaseContext";
import { useToast } from "@/hooks/use-toast";
import { subscribeToUser } from "@/services/userService";
import type { AppUser } from "@/types/user";

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthLoaded(true);
      setIsAuthenticated(!!firebaseUser);
      if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
        userUnsubscribeRef.current = null;
      }
      if (!firebaseUser) {
        setUser(null);
        return;
      }
      userUnsubscribeRef.current = subscribeToUser(db, firebaseUser.uid, setUser);
    });

    return () => {
      userUnsubscribeRef.current?.();
      unsubscribeAuth();
    };
  }, [db]);

  const logout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout realizado", description: "Você saiu da sua conta com sucesso." });
    } catch {
      toast({ title: "Erro ao sair", description: "Ocorreu um erro ao tentar sair da conta.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: !authLoaded, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
