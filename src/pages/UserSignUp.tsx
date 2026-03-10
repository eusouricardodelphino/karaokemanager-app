import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";
import type { AppUser } from "@/types/user";

const UserSignUp = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userData: AppUser = {
        id: user.uid,
        email: user.email ?? undefined,
        name: user.displayName ?? "",
        role: "user",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo! Agora você pode entrar na fila.",
      });
      navigate(`/${user.uid}`);
    } catch (error: unknown) {
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cadastro de Cantor
            </h1>
            <p className="text-muted-foreground mt-2">
              Crie sua conta para entrar na fila do karaoke
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full py-6 text-lg"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Cadastrando..." : "Cadastrar com Google"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link to="/users/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            É dono do estabelecimento?{" "}
            <Link to="/owner/signup" className="text-primary hover:underline font-medium">
              Cadastrar como dono
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSignUp;
