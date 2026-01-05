"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { 
  Home, 
  Download, 
  Palette,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react";
import { 
  db, 
  Board, 
  CanvasElement, 
  updateBoard,
  addBoardVersion,
  type Background,
} from "@/lib/storage/db";
import { cn } from "@/lib/utils";

interface CollageItem {
  id: string;
  type: "image";
  data: {
    src: string;
    prompt: string;
    isGenerated: boolean;
    style: string;
    title: string;
    affirmation: string;
    gridSize: "small" | "medium" | "large";
    status: "pending" | "complete" | "error";
  };
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const collageRef = useRef<HTMLDivElement>(null);

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const boardRef = useRef<Board | null>(null);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Load board
  useEffect(() => {
    const load = async () => {
      const b = await db.boards.get(boardId);
      if (!b) {
        router.replace("/");
        return;
      }
      
      boardRef.current = b;
      setBoard(b);
      setIsLoading(false);

      // Start generating pending images
      const pendingImages = b.canvas.elements.filter(
        (el) => el.type === "image" && (el.data as any).status === "pending"
      );
      
      console.log("[Board] Found pending images:", pendingImages.length);
      
      pendingImages.forEach((el) => {
        console.log("[Board] Starting generation for:", el.id);
        generateImage(el.id, (el.data as any).prompt);
      });
    };
    load();
  }, [boardId, router]);

  // Save board
  const saveBoard = useCallback(async (elements: CanvasElement[]) => {
    if (!board) return;
    const newCanvas = { ...board.canvas, elements };
    await updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
  }, [board]);

  // Generate image
  const generateImage = async (elementId: string, prompt: string) => {
    if (!boardRef.current) return;
    
    console.log("[Client] Starting image generation:", { elementId, prompt });
    setGeneratingImages(prev => new Set(prev).add(elementId));

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        const { imageUrl } = data;
        
        const currentBoard = boardRef.current;
        if (!currentBoard) return;
        
        const elements = currentBoard.canvas.elements.map(el => {
          if (el.id === elementId && el.type === "image") {
            return {
              ...el,
              data: {
                ...el.data,
                src: imageUrl,
                status: "complete",
              },
            };
          }
          return el;
        });
        
        const newCanvas = { ...currentBoard.canvas, elements };
        await updateBoard(currentBoard.id, { canvas: newCanvas });
        setBoard({ ...currentBoard, canvas: newCanvas });
        
        console.log("[Client] Image element updated successfully");
      } else {
        console.error("[Client] API error");
      }
    } catch (error) {
      console.error("[Client] Fetch error:", error);
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
    }
  };

  // Regenerate single image
  const regenerateImage = (elementId: string) => {
    if (!board) return;
    const element = board.canvas.elements.find(el => el.id === elementId);
    if (element && element.type === "image") {
      generateImage(elementId, (element.data as any).prompt);
    }
  };

  // Update background
  const updateBackground = useCallback((background: Background) => {
    if (!board) return;
    const newCanvas = { ...board.canvas, background };
    updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
  }, [board]);

  // Export as PNG
  const exportPNG = useCallback(async () => {
    if (!collageRef.current || !board) return;
    
    setIsExporting(true);
    
    try {
      await addBoardVersion(board.id, "Export snapshot");
      
      const canvas = await html2canvas(collageRef.current, {
        backgroundColor: board.canvas.background.type === "color" 
          ? board.canvas.background.value 
          : "#FDF8F3",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${board.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png", 1.0);
      
    } catch (error) {
      console.error("[Export] Error:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [board]);

  // Get collage items from board elements
  const collageItems: CollageItem[] = board?.canvas.elements
    .filter(el => el.type === "image")
    .map(el => ({
      id: el.id,
      type: "image" as const,
      data: el.data as CollageItem["data"],
    })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-slate">Loading your vision...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{
        backgroundColor: board?.canvas.background.type === "color" 
          ? board.canvas.background.value 
          : "#FDF8F3",
        backgroundImage: board?.canvas.background.type === "gradient"
          ? `linear-gradient(${board.canvas.background.direction || 135}deg, ${board.canvas.background.value}, ${board.canvas.background.secondaryValue || "#E8DED3"})`
          : undefined,
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-sand/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-sand" />
            <h1 className="font-display text-xl text-charcoal">{board?.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
              className={cn(
                "p-2.5 rounded-xl transition-gentle relative",
                showBackgroundPicker ? "bg-cream-dark text-charcoal" : "hover:bg-cream-dark text-slate hover:text-charcoal"
              )}
            >
              <Palette className="w-5 h-5" />
            </button>

            <button
              onClick={exportPNG}
              disabled={isExporting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-gentle font-sans text-sm",
                isExporting 
                  ? "bg-sand text-slate cursor-not-allowed" 
                  : "bg-terracotta text-cream hover:bg-terracotta-dark"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>

        {/* Background picker dropdown */}
        <AnimatePresence>
          {showBackgroundPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-4 top-full mt-2 bg-cream rounded-2xl shadow-xl border border-sand/50 p-4 w-72"
            >
              <h3 className="font-display text-base text-charcoal mb-3">Background</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-3">
                {["#FDF8F3", "#F5EDE4", "#E8DED3", "#FFFFFF", "#1A1A1A", 
                  "#D4A5A5", "#B8B5C9", "#9CAF88", "#7FA6B5", "#C4A484"].map(color => (
                  <button
                    key={color}
                    onClick={() => updateBackground({ type: "color", value: color })}
                    className="w-10 h-10 rounded-lg border-2 border-sand/50 hover:border-terracotta transition-gentle"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => updateBackground({ 
                    type: "gradient", 
                    value: "#FDF8F3", 
                    secondaryValue: "#D4A5A5",
                    direction: 135 
                  })}
                  className="w-full h-10 rounded-lg border-2 border-sand/50 hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(135deg, #FDF8F3, #D4A5A5)" }}
                />
                <button
                  onClick={() => updateBackground({ 
                    type: "gradient", 
                    value: "#FDF8F3", 
                    secondaryValue: "#B8B5C9",
                    direction: 180 
                  })}
                  className="w-full h-10 rounded-lg border-2 border-sand/50 hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(180deg, #FDF8F3, #B8B5C9)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Collage Grid */}
      <main className="flex-1 p-6 md:p-10">
        <div 
          ref={collageRef}
          className="max-w-6xl mx-auto"
        >
          <div className="collage-grid">
            {collageItems.map((item, index) => (
              <CollageCard
                key={item.id}
                item={item}
                index={index}
                isGenerating={generatingImages.has(item.id)}
                onRegenerate={() => regenerateImage(item.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface CollageCardProps {
  item: CollageItem;
  index: number;
  isGenerating: boolean;
  onRegenerate: () => void;
}

function CollageCard({ item, index, isGenerating, onRegenerate }: CollageCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  
  const gridSize = item.data.gridSize || "small";
  
  // Map grid sizes to CSS classes
  const sizeClasses = {
    small: "collage-item-small",
    medium: "collage-item-medium", 
    large: "collage-item-large",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={cn(
        "collage-item group relative overflow-hidden rounded-2xl bg-cream-dark shadow-lg",
        sizeClasses[gridSize]
      )}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Image or Loading State */}
      {item.data.src && item.data.status === "complete" ? (
        <img
          src={item.data.src}
          alt={item.data.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          draggable={false}
        />
      ) : isGenerating || item.data.status === "pending" ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream to-cream-dark">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-terracotta/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 font-serif text-sm text-slate">Generating...</p>
          <p className="mt-1 font-sans text-xs text-slate/60 max-w-[200px] text-center line-clamp-2">
            {item.data.title}
          </p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-cream-dark">
          <Sparkles className="w-12 h-12 text-sand" />
        </div>
      )}

      {/* Overlay with affirmation */}
      <AnimatePresence>
        {(showOverlay && item.data.src) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent flex flex-col justify-end p-4"
          >
            <p className="font-display text-cream text-lg leading-tight mb-1">
              {item.data.title}
            </p>
            <p className="font-serif text-cream/90 text-sm italic">
              "{item.data.affirmation}"
            </p>
            
            {/* Regenerate button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate();
              }}
              disabled={isGenerating}
              className="absolute top-3 right-3 p-2 rounded-xl bg-cream/20 backdrop-blur-sm text-cream hover:bg-cream/30 transition-gentle"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
