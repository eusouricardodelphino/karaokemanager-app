import { useRef, useState, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Moon, Sun, Plus, Trash2, Download, Copy, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Navigation from "@/components/Navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFirebase } from "@/hooks/firebaseContext";
import { isOwner } from "@/types/user";
import { getStore, updateStore } from "@/services/storeService";
import { formatCnpj, cnpjDigits, formatPhone } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Store } from "@/types/store";

type Phone = { ddd: string; number: string; whatsapp: boolean };

const emptyPhone = (): Phone => ({ ddd: "", number: "", whatsapp: false });

const StoreProfileCard = ({ storeId }: { storeId: string }) => {
  const { db } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phones, setPhones] = useState<Phone[]>([]);

  useEffect(() => {
    getStore(db, storeId)
      .then((store: Store | null) => {
        if (!store) return;
        setName(store.name ?? "");
        setAddress(store.address ?? "");
        setCnpj(store.cnpj ?? "");
        setPhones(store.phones ?? []);
      })
      .finally(() => setLoading(false));
  }, [db, storeId]);

  const addPhone = () => setPhones((prev) => [...prev, emptyPhone()]);

  const removePhone = (index: number) =>
    setPhones((prev) => prev.filter((_, i) => i !== index));

  const updatePhone = (index: number, field: keyof Phone, value: string | boolean) =>
    setPhones((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateStore(db, storeId, {
        name: name.trim(),
        address: address.trim() || undefined,
        cnpj: cnpjDigits(cnpj) ? cnpj : undefined,
        phones: phones.filter((p) => p.ddd.trim() && p.number.trim()),
      });
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando dados da loja...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil da Loja</CardTitle>
        <CardDescription>
          Informações exibidas para os clientes na lista de lojas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="store-name">Nome *</Label>
          <Input
            id="store-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do estabelecimento"
          />
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label htmlFor="store-address">Endereço</Label>
          <Input
            id="store-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        {/* CNPJ */}
        <div className="space-y-2">
          <Label htmlFor="store-cnpj">CNPJ</Label>
          <Input
            id="store-cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
          />
        </div>

        {/* Telefones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Telefones</Label>
            <Button type="button" variant="outline" size="sm" onClick={addPhone}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar
            </Button>
          </div>

          {phones.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado.</p>
          )}

          {phones.map((phone, index) => (
            <div key={index} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
              <div className="w-20 flex-shrink-0 space-y-1">
                <Label className="text-xs text-muted-foreground">DDD</Label>
                <Input
                  value={phone.ddd}
                  onChange={(e) => updatePhone(index, "ddd", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="11"
                  inputMode="numeric"
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Número</Label>
                <Input
                  value={formatPhone(phone.number)}
                  onChange={(e) => updatePhone(index, "number", e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="99999-9999"
                  inputMode="numeric"
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                <button
                  type="button"
                  onClick={() => updatePhone(index, "whatsapp", !phone.whatsapp)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
                    phone.whatsapp ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                  aria-label={phone.whatsapp ? "Desativar WhatsApp" : "Ativar WhatsApp"}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      phone.whatsapp ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removePhone(index)}
                className="mt-5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                aria-label="Remover telefone"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </CardContent>
    </Card>
  );
};

const STORE_BASE_URL = "https://app.karaokemanager.com.br";

const StoreQRCodeCard = ({ storeId }: { storeId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeUrl = `${STORE_BASE_URL}/${storeId}`;

  const handleDownload = () => {
    const qrCanvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!qrCanvas) return;

    const size = qrCanvas.width;
    const output = document.createElement("canvas");
    output.width = size;
    output.height = size;
    const ctx = output.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(qrCanvas, 0, 0);

    const link = document.createElement("a");
    link.download = `qrcode-loja-${storeId}.jpg`;
    link.href = output.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code da Loja</CardTitle>
        <CardDescription>
          Imprima ou exiba este QR Code para os clientes escanearem e entrarem na fila.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={canvasRef} className="p-4 bg-white rounded-xl shadow-sm border border-border">
          <QRCodeCanvas
            value={storeUrl}
            size={200}
            marginSize={2}
            level="M"
          />
        </div>
        <p className="text-xs text-muted-foreground break-all text-center">{storeUrl}</p>
        <Button onClick={handleDownload} variant="outline" className="gap-2 w-full">
          <Download className="w-4 h-4" />
          Baixar como JPEG
        </Button>
      </CardContent>
    </Card>
  );
};

const ACCESS_INSTRUCTION = "Para acessar nossa loja acesse:";
const ACCESS_URL = "https://app.karaokemanager.com.br";
const ACCESS_SUFFIX = "e digite o código acima";

const StoreAccessCodeCard = ({ storeId }: { storeId: string }) => {
  const { db } = useFirebase();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getStore(db, storeId).then((store) => {
      if (store?.code) setCode(store.code);
    });
  }, [db, storeId]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      const text = `${ACCESS_INSTRUCTION} ${ACCESS_URL} ${ACCESS_SUFFIX}\n${code}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", description: "Copie o código manualmente.", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!code) return;

    const W = 600;
    const H = 320;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // fundo branco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // instrução — linha 1
    ctx.fillStyle = "#374151";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ACCESS_INSTRUCTION, W / 2, 70);

    // URL — linha 2
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(ACCESS_URL, W / 2, 108);

    // sufixo — linha 3
    ctx.fillStyle = "#374151";
    ctx.font = "22px sans-serif";
    ctx.fillText(ACCESS_SUFFIX, W / 2, 146);

    // código
    ctx.fillStyle = "#111827";
    ctx.font = "bold 80px monospace";
    ctx.letterSpacing = "8px";
    ctx.fillText(code, W / 2, 252);

    const link = document.createElement("a");
    link.download = `codigo-acesso-${code}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código de Acesso</CardTitle>
        <CardDescription>
          Compartilhe este código para que os clientes acessem a fila digitando manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {code ? (
          <>
            <div className="flex flex-col items-center gap-2 w-full rounded-xl border border-border bg-muted/30 py-6 px-4">
              <p className="text-sm text-muted-foreground text-center">
                {ACCESS_INSTRUCTION}{" "}
                <span className="text-primary font-medium">{ACCESS_URL}</span>{" "}
                {ACCESS_SUFFIX}
              </p>
              <p className="text-4xl font-mono font-bold tracking-widest select-all mt-1">{code}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button onClick={handleCopy} variant="outline" className="gap-2 flex-1">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar código"}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="gap-2 flex-1">
                <Download className="w-4 h-4" />
                Baixar como JPEG
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        )}
      </CardContent>
    </Card>
  );
};

const AppearanceCard = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>Escolha o tema que melhor se adapta ao seu estilo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tema</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Sun className="h-8 w-8" />
              <span className="font-medium">Claro</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Moon className="h-8 w-8" />
              <span className="font-medium">Escuro</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AboutCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Sobre</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm text-muted-foreground">
      <p>
        <strong className="text-foreground">KaraokeManager</strong> — Sistema de gerenciamento de fila de karaoke
      </p>
      <p>Versão 1.0.0</p>
    </CardContent>
  </Card>
);

type Section = { id: string; label: string; content: ReactNode };

const gridCols: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const Settings = () => {
  const { user } = useCurrentUser();

  const sections: Section[] = [
    ...(isOwner(user) && user?.storeId
      ? [{ id: "perfil", label: "Perfil", content: <StoreProfileCard storeId={user.storeId} /> }]
      : []),
    ...((isOwner(user) || user?.role === "staff") && user?.storeId
      ? [
          { id: "qrcode", label: "QR Code", content: <StoreQRCodeCard storeId={user.storeId} /> },
          { id: "codigo", label: "Código", content: <StoreAccessCodeCard storeId={user.storeId} /> },
        ]
      : []),
    { id: "aparencia", label: "Aparência", content: <AppearanceCard /> },
    { id: "sobre", label: "Sobre", content: <AboutCard /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Personalize sua experiência no KaraokeManager
            </p>
          </div>

          {/* Desktop: Tabs */}
          <div className="hidden md:block">
            <Tabs defaultValue={sections[0].id}>
              <TabsList className={`w-full grid ${gridCols[sections.length] ?? "grid-cols-3"} bg-card border border-border`}>
                {sections.map((s) => (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                  >
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sections.map((s) => (
                <TabsContent key={s.id} value={s.id} className="mt-4">
                  {s.content}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Mobile: Accordion */}
          <div className="md:hidden">
            <Accordion type="single" collapsible className="space-y-2">
              {sections.map((s) => (
                <AccordionItem
                  key={s.id}
                  value={s.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    {s.label}
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    {s.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
