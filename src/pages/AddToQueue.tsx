import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirebase } from "@/hooks/firebaseContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  addSingerToQueue,
  findSingerInQueue,
} from "@/services/queueService";
import { getActiveSession } from "@/services/sessionService";
import { useStoreExists } from "@/hooks/useStoreExists";
import NotFound from "@/pages/NotFound";
import type { QueueItem } from "@/types/queue";

const AddToQueue = () => {
  const { db } = useFirebase();
  const { user } = useCurrentUser();
  const [song, setSong] = useState("");
  const [band, setBand] = useState("");
  const [link, setLink] = useState("");
  const { storeId } = useParams();
  const navigate = useNavigate();
  const storeExists = useStoreExists(storeId);

  const [name, setName] = useState("");
  const canEditName = user?.role !== "singer";
  const effectiveName = canEditName ? name : (user?.name ?? "");

  let dateToday = new Date()
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    .toString();
  dateToday = dateToday.replace(/\//g, ".");

  const addToQueue = async () => {
    let session = null;
    try {
      session = await getActiveSession(db, storeId);
    } catch {
      toast({
        title: "Fila fechada",
        description: "A sessão ainda não foi aberta. Aguarde o início do show.",
        variant: "destructive",
      });
      return;
    }

    if (!session || session.status !== "open") {
      toast({
        title: "Fila fechada",
        description: "A sessão ainda não foi aberta. Aguarde o início do show.",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveName.trim() || !song.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: !effectiveName.trim()
          ? "Nome não encontrado. Faça login novamente."
          : "Música é obrigatória!",
        variant: "destructive",
      });
      return;
    }

    const newItem: QueueItem = {
      name: effectiveName.trim(),
      nameSearch: effectiveName.trim().toLowerCase(),
      song: song.trim(),
      band: band.trim(),
      alreadySang: false,
      link: link.trim() || null,
      visitDate: dateToday,
      addedAt: new Date(),
    };

    const alreadyInQueue = await findSingerInQueue(
      db,
      storeId,
      newItem.nameSearch
    );

    if (alreadyInQueue && !alreadyInQueue.empty) {
      toast({
        title: "Você já está na fila",
        description: "Espere sua vez! Após, é possível entrar novamente na fila.",
        variant: "destructive",
      });
      return;
    }

    await addSingerToQueue(db, storeId!, newItem);

    setSong("");
    setBand("");
    setLink("");

    toast({
      title: "Adicionado à fila!",
      description: `${newItem.name} foi adicionado para cantar "${newItem.song}"`,
    });

    navigate(`/${storeId}`);
  };

  if (storeExists === null) return null;
  if (!storeExists) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Plus className="h-6 w-6" />
                Adicionar à Fila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={effectiveName}
                  onChange={canEditName ? (e) => setName(e.target.value) : undefined}
                  readOnly={!canEditName}
                  placeholder={canEditName ? "Nome do cantor" : undefined}
                  className={!canEditName ? "bg-muted cursor-not-allowed" : "bg-background"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="song">Música *</Label>
                <Input
                  id="song"
                  value={song}
                  onChange={(e) => setSong(e.target.value)}
                  placeholder="Nome da música"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="band">Cantor ou banda (opcional)</Label>
                <Input
                  id="band"
                  value={band}
                  onChange={(e) => setBand(e.target.value)}
                  placeholder="Nome da banda/artista"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">
                  Link da música na versão karaoke (opcional)
                </Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="bg-background"
                />
              </div>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  "karaoke " + song + (band || "")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center w-full transition-colors"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar música no youtube
                </Button>
              </a>
              <Button onClick={addToQueue} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar à Fila
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddToQueue;
