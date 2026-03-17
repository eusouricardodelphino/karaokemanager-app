import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<{ rawValue: string }[]>;
  static getSupportedFormats(): Promise<string[]>;
}

type ScanState = "starting" | "scanning" | "error";

const Scan = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [state, setState] = useState<ScanState>("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(animFrameRef.current);
  };

  const handleDetected = (rawValue: string) => {
    stopCamera();
    try {
      new URL(rawValue);
      // Valid full URL — follow it entirely
      window.location.href = rawValue;
    } catch {
      // Not a URL — treat as storeId directly
      navigate(`/${rawValue}`);
    }
  };

  useEffect(() => {
    let detector: BarcodeDetector | null = null;

    const start = async () => {
      // Check BarcodeDetector support
      if (!("BarcodeDetector" in window)) {
        setState("error");
        setErrorMsg(
          "Seu navegador não suporta leitura de QR code. Tente usar o Chrome mais recente ou digite o código do bar manualmente."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        detector = new BarcodeDetector({ formats: ["qr_code"] });
        setState("scanning");

        const tick = async () => {
          if (videoRef.current && detector && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                handleDetected(codes[0].rawValue);
                return;
              }
            } catch {
              // detection error — keep trying
            }
          }
          animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);
      } catch (err: unknown) {
        setState("error");
        const isDenied =
          err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        setErrorMsg(
          isDenied
            ? "Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador."
            : "Não foi possível acessar a câmera. Tente digitar o código do bar manualmente."
        );
      }
    };

    start();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <span className="text-white font-semibold text-sm tracking-wide">
          Aponte para o QR Code do bar
        </span>
        <button
          onClick={() => { stopCamera(); navigate("/"); }}
          className="text-white/80 hover:text-white p-1"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover flex-1"
        playsInline
        muted
        aria-label="Câmera"
      />

      {/* Viewfinder overlay */}
      {state === "scanning" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-56 h-56">
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-md" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-md" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-md" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-md" />
            {/* Scan line */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
          </div>
        </div>
      )}

      {/* Starting indicator */}
      {state === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 text-white">
            <QrCode className="w-12 h-12 animate-pulse text-purple-400" />
            <span className="text-sm">Iniciando câmera...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <QrCode className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Voltar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scan;
