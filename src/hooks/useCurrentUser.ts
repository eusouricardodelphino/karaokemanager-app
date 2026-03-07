import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useFirebase } from "@/hooks/firebaseContext";
import { useToast } from "@/hooks/use-toast";
import { subscribeToUser } from "@/services/userService";
import type { AppUser } from "@/types/user";

export interface UseCurrentUserResult {
  /** Dados do usuário no Firestore (null se não logado ou documento não encontrado) */
  user: AppUser | null;
  /** true enquanto o Auth ainda não resolveu ou enquanto o documento do usuário está carregando */
  isLoading: boolean;
  /** true se há um usuário autenticado no Firebase Auth */
  isAuthenticated: boolean;
  /** Encerra a sessão e exibe toast */
  logout: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
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
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair da conta.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading: !authLoaded,
    isAuthenticated,
    logout,
  };
}
