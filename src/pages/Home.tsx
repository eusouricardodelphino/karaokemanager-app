import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Users, SkipForward, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirebase } from "@/hooks/firebaseContext";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  subscribeToQueue,
  subscribeToOnStageSinger,
  isStageEngaged,
  putSingerOnStage,
  markSingerAsAlreadySang,
  removeSingerFromStage,
  QueueItem,
} from "@/services/queueService";

const Home = () => {
  const { db } = useFirebase();
  const { user } = useCurrentUser();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSinger, setCurrentSinger] = useState<QueueItem | null>(null);
  const { restaurantId } = useParams();

  useEffect(() => {
    const queueUnsubscribe = subscribeToQueue(db, restaurantId, setQueue);
    const stageUnsubscribe = subscribeToOnStageSinger(
      db,
      restaurantId,
      setCurrentSinger
    );
    return () => {
      if (typeof queueUnsubscribe === "function") queueUnsubscribe();
      if (typeof stageUnsubscribe === "function") stageUnsubscribe();
    };
  }, [db, restaurantId]);

  const nextSinger = async () => {
    if (queue.length === 0) return;

    if (await isStageEngaged(db, restaurantId)) {
      toast({
        title: "Palco ocupado",
        description: `Aguarde o cantor atual finalizar sua performance.`,
        variant: "destructive",
      });
      return;
    }

    const next = queue[0];
    await putSingerOnStage(db, { ...next, onStage: true });
    await markSingerAsAlreadySang(db, next);

    toast({
      title: "Próximo no palco!",
      description: `${next.name} está subindo para cantar "${next.song}"`,
    });
  };

  const finishSinging = async () => {
    if (!currentSinger) return;

    toast({
      title: "Performance finalizada!",
      description: `Obrigado ${currentSinger.name}! 👏`,
    });
    await removeSingerFromStage(db, currentSinger);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Current Singer */}
          <Card className="bg-gradient-stage border-0 shadow-2xl animate-pulse-glow">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-stage-foreground flex items-center justify-center gap-2">
                <span className="text-2xl">🎤</span>
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
                  <p>
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
                  </p>
                  {user && user.isAdmin && (
                    <p>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          "karaoke " +
                            currentSinger.song +
                            " " +
                            (currentSinger.band || "")
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-stage-foreground/80 hover:text-stage-foreground transition-colors"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Pesquisar música
                      </a>
                    </p>
                  )}
                  {user && user.isAdmin && (
                    <Button
                      onClick={finishSinging}
                      variant="secondary"
                      size="lg"
                      className="mt-4"
                    >
                      Finalizar Performance
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-stage-foreground/70 text-xl py-8">
                  Palco vazio - aguardando próximo cantor!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Fila ({queue.length})
              </CardTitle>
              {queue.length > 0 && user && user.isAdmin && (
                <Button onClick={nextSinger} variant="default" size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Próximo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Fila vazia - vamos começar a cantar?
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

export default Home;
