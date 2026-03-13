import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/firebase";
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Music, Mail, Lock, Building2, Mic, Store } from "lucide-react";
import type { AppUser } from "@/types/user";
import type { Store as StoreType } from "@/types/store";

type UserType = "singer" | "owner";


const SignUp = () => {
  const [userType, setUserType] = useState<UserType>("singer");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectTo = searchParams.get("redirect");

  const getDestination = async (uid: string): Promise<string> => {
    if (redirectTo) return redirectTo;
    const snap = await getDoc(doc(db, "users", uid));
    const storeId = snap.data()?.storeId as string | undefined;
    return storeId ? `/${storeId}` : "/";
  };

  const handleGoogleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // const result = await signInWithPopup(auth, googleProvider);
      // const user = result.user;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: AppUser = {
        id: user.uid,
        email: user.email ?? undefined,
        name: user.displayName ?? "",
        role: "singer",
        createdAt: new Date().toISOString(),
      };
      console.log(userData)
      await setDoc(doc(db, "users", user.uid), userData);

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo! Agora você pode entrar na fila.",
      });
      navigate(redirectTo ? redirectTo : `/${user.uid}`, { replace: true });
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

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: AppUser = {
        id: user.uid,
        email: user.email ?? undefined,
        name: storeName.trim(),
        role: "owner",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      const storeData: Omit<StoreType, "id"> = {
        name: storeName.trim(),
        ownerId: user.uid,
        active: true,
        createdAt: new Date().toISOString(),
        trialStartedAt: serverTimestamp(),
        trialDays: 30,
        subscription: { status: "trial" },
      };
      const storeRef = await addDoc(collection(db, "stores"), storeData);
      await updateDoc(doc(db, "users", user.uid), { storeId: storeRef.id });

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao painel do Karaoke Manager",
      });
      navigate(`/${storeRef.id}`);
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
    const isSingerFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 6; 

    const isOwnerFormValid =
      storeName.trim() !== "" &&
      email.trim() !== "" &&
      password.length >= 6;


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Criar Conta
            </h1>
            <p className="text-muted-foreground mt-2">
              Como você quer se cadastrar?
            </p>
          </div>

          {/* Seletor de tipo */}
          <div className="flex bg-muted rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setUserType("singer")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                userType === "singer"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="w-4 h-4" />
              Sou cantor
            </button>
            <button
              type="button"
              onClick={() => setUserType("owner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                userType === "owner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="w-4 h-4" />
              Sou uma loja
            </button>
          </div>

          {userType === "singer" ? (
            <>
              {/* <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-base"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? "Cadastrando..." : "Cadastrar com Google"}
              </Button> */}
              <form onSubmit={handleGoogleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="Name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nome
                  </Label>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="Nome do cantor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@loja.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="submit-button"
                  disabled={loading || !isSingerFormValid}
                >
                  {loading ? "Cadastrando..." : "Criar conta"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleOwnerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nome da loja
                  </Label>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="Nome do estabelecimento"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@loja.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="submit-button"
                  disabled={loading || !isOwnerFormValid}
                >
                  {loading ? "Cadastrando..." : "Criar conta"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Entrar no painel
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
