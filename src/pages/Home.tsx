import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Users, SkipForward, Search, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirebase } from "@/hooks/firebaseContext";
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import GuestSignInDialog from "@/components/GuestSignInDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isOwner } from "@/types/user";
import {
  subscribeToQueue,
  subscribeToOnStageSinger,
  isStageEngaged,
  putSingerOnStage,
  markSingerAsAlreadySangById,
  removeSingerFromStage,
} from "@/services/queueService";
import {
  subscribeToActiveSession,
  openSession,
  closeSession,
} from "@/services/sessionService";

import type { QueueItem } from "@/types/queue";
import type { SessionSnapshot } from "@/types/session";

const Home = () => {
  const { db } = useFirebase();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSinger, setCurrentSinger] = useState<QueueItem | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSnapshot | null>(null);
  const { storeId } = useParams();

  useEffect(() => {
    if (!isLoading) setGuestDialogOpen(!isAuthenticated);
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const queueUnsubscribe = subscribeToQueue(db, storeId, setQueue);
    const stageUnsubscribe = subscribeToOnStageSinger(
      db,
      storeId,
      setCurrentSinger
    );
    const sessionUnsubscribe = subscribeToActiveSession(
      db,
      storeId,
      setActiveSession
    );
    return () => {
      if (typeof queueUnsubscribe === "function") queueUnsubscribe();
      if (typeof stageUnsubscribe === "function") stageUnsubscribe();
      if (typeof sessionUnsubscribe === "function") sessionUnsubscribe();
    };
  }, [db, storeId]);

  const handleOpenSession = async () => {
    if (!user || !storeId) return;
    try {
      await openSession(db, storeId, user.id);
      toast({ title: "Sessão aberta!", description: "A sessão foi iniciada com sucesso." });
    } catch (err) {
      console.error("[openSession] erro:", err);
      toast({ title: "Erro ao abrir sessão", variant: "destructive" });
    }
  };

  const handleCloseSession = async () => {
    if (!user || !storeId || !activeSession) return;
    try {
      await removeSingerFromStage(db, storeId);
      await closeSession(db, storeId, activeSession.id, user.id);
      toast({ title: "Sessão encerrada!", description: "A sessão foi encerrada com sucesso." });
    } catch (err) {
      console.error("[closeSession] erro:", err);
      toast({ title: "Erro ao encerrar sessão", variant: "destructive" });
    }
  };

  const nextSinger = async () => {
    if (queue.length === 0) return;

    if (await isStageEngaged(db, storeId)) {
      toast({
        title: "Palco ocupado",
        description: `Aguarde o cantor atual finalizar sua performance.`,
        variant: "destructive",
      });
      return;
    }

    const next = queue[0];
    await putSingerOnStage(db, storeId!, next);
    if (next.id) await markSingerAsAlreadySangById(db, storeId!, next.id);

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
    await removeSingerFromStage(db, storeId!);
  };


  return (
    <div className="min-h-screen bg-background">
      <GuestSignInDialog
        open={guestDialogOpen}
        redirectPath={`/${storeId}`}
        onClose={() => setGuestDialogOpen(false)}
      />
      <Navigation />

      <div className="container mx-auto px-4 pt-0 pb-24 md:pt-8 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
          {/* Session Control - owner only */}
          {user && isOwner(user) && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  Sessão de hoje
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {activeSession ? (
                      <span className="text-green-600 font-medium">Aberta</span>
                    ) : (
                      <span className="text-muted-foreground">Fechada</span>
                    )}
                  </span>
                  {activeSession ? (
                    <Button
                      onClick={handleCloseSession}
                      variant="destructive"
                      size="sm"
                    >
                      Encerrar Sessão
                    </Button>
                  ) : (
                    <Button
                      onClick={handleOpenSession}
                      variant="default"
                      size="sm"
                    >
                      Abrir Sessão
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Closed session banner */}
          {!activeSession && (
            <div className={`rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground text-center${!isOwner(user) ? " mt-4 md:mt-0" : ""}`}>
              A fila ainda não foi aberta. Aguarde o início do show.
            </div>
          )}

          {/* Current Singer */}
          <Card className={`bg-gradient-stage border-0 shadow-2xl animate-pulse-glow pt-4${!isOwner(user) ? " mt-4 md:mt-0" : ""}`}>
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
                  {user && isOwner(user) && (
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
                  {user && isOwner(user) && (
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
              {queue.length > 0 && user && isOwner(user) && (
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
