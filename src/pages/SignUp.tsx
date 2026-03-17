import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase";
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Music, Mail, Lock, Building2, Mic, Store } from "lucide-react";
import type { AppUser } from "@/types/user";
import type { Store as StoreType } from "@/types/store";
import { getStoreCodes } from "@/services/storeService";
import { generateStoreCode } from "@/lib/utils";

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

  const handleSingerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: AppUser = {
        id: user.uid,
        email: user.email ?? undefined,
        name: name.trim(),
        role: "singer",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo! Agora você pode entrar na fila.",
      });
      navigate(redirectTo ?? "/stores", { replace: true });
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

      const existingCodes = await getStoreCodes(db);
      const code = generateStoreCode(existingCodes);

      const storeData: Omit<StoreType, "id"> = {
        name: storeName.trim(),
        code,
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
              <form onSubmit={handleSingerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="Name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nome
                  </Label>
                  <Input
                    id="name"
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
