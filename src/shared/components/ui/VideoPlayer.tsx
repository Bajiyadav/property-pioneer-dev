import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  thumbnailUrl?: string;
  autoPlayMuted?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  thumbnailUrl,
  autoPlayMuted = false,
}: VideoPlayerProps) {
  const effectivePoster = poster || thumbnailUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlayMuted);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(autoPlayMuted);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlayMuted) {
      setIsLoading(true);
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    }

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const onError = () => {
      setIsLoading(false);
      setHasError(true);
    };
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      video.removeEventListener("ended", onEnded);
    };
  }, [autoPlayMuted]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (!hasStarted) setHasStarted(true);
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);

      if (isMuted && isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  if (hasError) {
    return (
      <div className="flex aspect-[16/9] md:aspect-[21/9] w-full flex-col items-center justify-center rounded-2xl bg-secondary/60 p-6 text-center text-muted-foreground border border-border">
        <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
        <p className="text-sm font-semibold text-foreground">Unable to load video tour</p>
        <p className="text-xs mt-1">Please check your network connection or try again later.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl bg-black/80 aspect-[16/9] md:aspect-[21/9] flex items-center justify-center cursor-pointer shadow-lg border border-border/50"
      onClick={() => togglePlay()}
    >
      <video
        ref={videoRef}
        src={src}
        poster={effectivePoster}
        className="h-full w-full object-cover"
        playsInline
        muted={isMuted}
        preload="metadata"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Big Center Play Button Overlay (when paused / not started) */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] transition group-hover:bg-black/40">
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play video tour"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-2xl transition duration-300 hover:scale-110 hover:bg-emerald-500 active:scale-95"
          >
            <Play className="h-8 w-8 fill-current ml-1" />
          </button>
          <span className="mt-3 rounded-full bg-black/60 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur">
            Click to Watch Video Tour
          </span>
        </div>
      )}

      {/* Video Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition duration-300 ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="mb-3 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            aria-label="Video progress"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-emerald-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition active:scale-95"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition active:scale-95"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
