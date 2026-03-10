import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase";
import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCnpj, cnpjDigits } from "@/lib/utils";
import { Music, Mail, Lock, User, Building2, Phone, FileText } from "lucide-react";
import type { AppUser } from "@/types/user";
import type { Store } from "@/types/store";

const CNPJ_PLACEHOLDER = "00.000.000/0000-00";

const OwnerSignUp = () => {
  const [activeTab, setActiveTab] = useState("pessoais");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeCnpj, setStoreCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = formatCnpj(e.target.value);
    setStoreCnpj(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: AppUser = {
        id: user.uid,
        email: user.email ?? undefined,
        name,
        role: "owner",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      const storeData: Omit<Store, "id"> = {
        name: storeName.trim(),
        phone: storePhone.trim() || undefined,
        cnpj: cnpjDigits(storeCnpj) || undefined,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
      };
      const storeRef = await addDoc(collection(db, "stores"), storeData);
      await updateDoc(doc(db, "users", user.uid), { storeId: storeRef.id });

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao painel do Karaoke Manager",
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

  const cnpjDigitsOnly = cnpjDigits(storeCnpj);
  const isCnpjComplete = cnpjDigitsOnly.length === 14;
  const canSubmit =
    name.trim() &&
    email.trim() &&
    password.length >= 6 &&
    storeName.trim() &&
    isCnpjComplete;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              Cadastro de Dono
            </h1>
            <p className="text-muted-foreground mt-2">
              Crie sua conta e cadastre sua loja
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="pessoais">Dados pessoais</TabsTrigger>
                <TabsTrigger value="loja">Dados da loja</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoais" className="space-y-4 mt-4 data-[state=inactive]:hidden" forceMount>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background"
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
                    placeholder="admin@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
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
                    className="bg-background"
                  />
                </div>
              </TabsContent>

              <TabsContent value="loja" className="space-y-4 mt-4 data-[state=inactive]:hidden" forceMount>
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
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storePhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    id="storePhone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeCnpj" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CNPJ
                  </Label>
                  <Input
                    id="storeCnpj"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={CNPJ_PLACEHOLDER}
                    value={storeCnpj}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    className="bg-background font-mono"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !canSubmit}
            >
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link to="/owner/login" className="text-primary hover:underline font-medium">
              Entrar no painel
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Quer apenas cantar?{" "}
            <Link to="/users/signup" className="text-primary hover:underline font-medium">
              Cadastrar como cantor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignUp;
