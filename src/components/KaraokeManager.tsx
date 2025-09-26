import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Mic, Music, Users, Plus, SkipForward } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  name: string;
  song: string;
  link?: string;
  addedAt: Date;
}

const KaraokeManager = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSinger, setCurrentSinger] = useState<QueueItem | null>(null);
  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [link, setLink] = useState("");

  const addToQueue = () => {
    if (!name.trim() || !song.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e música são obrigatórios!",
        variant: "destructive",
      });
      return;
    }

    const newItem: QueueItem = {
      id: Date.now().toString(),
      name: name.trim(),
      song: song.trim(),
      link: link.trim() || undefined,
      addedAt: new Date(),
    };

    setQueue(prev => [...prev, newItem]);
    setName("");
    setSong("");
    setLink("");
    
    toast({
      title: "Adicionado à fila!",
      description: `${newItem.name} foi adicionado para cantar "${newItem.song}"`,
    });
  };

  const nextSinger = () => {
    if (queue.length === 0) return;
    
    const next = queue[0];
    setCurrentSinger(next);
    setQueue(prev => prev.slice(1));
    
    toast({
      title: "Próximo no palco!",
      description: `${next.name} está subindo para cantar "${next.song}"`,
    });
  };

  const finishSinging = () => {
    if (!currentSinger) return;
    
    toast({
      title: "Performance finalizada!",
      description: `Obrigado ${currentSinger.name}! 👏`,
    });
    
    setCurrentSinger(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Karaoke Manager
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gerencie sua fila de karaoke de forma fácil e divertida!
          </p>
        </div>

        {/* Current Singer */}
        <Card className="bg-gradient-stage border-0 shadow-2xl animate-pulse-glow">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-stage-foreground flex items-center justify-center gap-2">
              <Mic className="h-6 w-6" />
              No Palco Agora
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {currentSinger ? (
              <div className="space-y-4 animate-bounce-in">
                <div className="text-3xl font-bold text-stage-foreground">
                  {currentSinger.name}
                </div>
                <div className="text-xl text-stage-foreground/90">
                  cantando "{currentSinger.song}"
                </div>
                {currentSinger.link && (
                  <a
                    href={currentSinger.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-stage-foreground/80 hover:text-stage-foreground transition-colors"
                  >
                    <Music className="h-4 w-4" />
                    Ver música
                  </a>
                )}
                <Button
                  onClick={finishSinging}
                  variant="secondary"
                  size="lg"
                  className="mt-4"
                >
                  Finalizar Performance
                </Button>
              </div>
            ) : (
              <div className="text-stage-foreground/70 text-xl py-8">
                Palco vazio - aguardando próximo cantor!
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Add to Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar à Fila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-background"
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
                <Label htmlFor="link">Link da música (opcional)</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="bg-background"
                />
              </div>
              <Button onClick={addToQueue} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar à Fila
              </Button>
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Fila ({queue.length})
              </CardTitle>
              {queue.length > 0 && (
                <Button onClick={nextSinger} variant="default" size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Próximo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Fila vazia - adicione alguém!
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-queue border border-border"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.song}
                        </div>
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-music hover:text-music/80 transition-colors"
                        >
                          <Music className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KaraokeManager;