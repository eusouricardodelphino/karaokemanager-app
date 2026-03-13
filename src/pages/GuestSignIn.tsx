import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Music, Mic } from "lucide-react";
import type { AppUser } from "@/types/user";

const GuestSignIn = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const redirectTo = searchParams.get("redirect");

  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await signInAnonymously(auth);

      const userData: AppUser = {
        id: user.uid,
        name: name.trim(),
        role: "singer",
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      toast({ title: "Bem-vindo!", description: `Entrando como ${name.trim()}` });
      navigate(redirectTo ?? "/", { replace: true });
    } catch (error: unknown) {
      toast({
        title: "Erro ao entrar",
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
              Entrar como visitante
            </h1>
            <p className="text-muted-foreground mt-2">
              Sem cadastro, só informe seu nome
            </p>
          </div>

          <form onSubmit={handleGuestSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Nome
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Como quer ser chamado?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={loading || name.trim() === ""}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link
              to={redirectTo ? `/login?redirect=${redirectTo}` : "/login"}
              className="text-primary hover:underline font-medium"
            >
              Entrar
            </Link>
            {" "}ou{" "}
            <Link
              to={redirectTo ? `/signup?redirect=${redirectTo}` : "/signup"}
              className="text-primary hover:underline font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestSignIn;
