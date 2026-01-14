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
  Plus,
  Pencil,
  Trash2,
  FileEdit,
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
    personalConnection?: string;
  };
}

const styleLabels: Record<string, string> = {
  photography: "Photography",
  watercolor: "Watercolor",
  abstract: "Abstract",
  oilpainting: "Oil Painting",
  minimalist: "Minimalist",
  impressionist: "Impressionist",
  cinematic: "Cinematic",
  macro: "Macro",
  landscape: "Landscape",
  symbolic: "Symbolic",
  dreamy: "Dreamy",
  vintage: "Vintage",
};

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
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState<CollageItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
        generateImage(el.id, (el.data as any).prompt, (el.data as any).style);
      });
    };
    load();
  }, [boardId, router]);

  // Generate image
  const generateImage = async (elementId: string, prompt: string, style?: string) => {
    if (!boardRef.current) return;
    
    console.log("[Client] Starting image generation:", { elementId, prompt, style });
    setGeneratingImages(prev => new Set(prev).add(elementId));

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: style || "photography" }),
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
                status: "complete" as const,
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

  // Update element
  const updateElement = useCallback(async (elementId: string, updates: Partial<CollageItem["data"]>) => {
    if (!board) return;
    
    const elements = board.canvas.elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          data: { ...el.data, ...updates },
        };
      }
      return el;
    });
    
    const newCanvas = { ...board.canvas, elements };
    await updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
  }, [board]);

  // Delete element
  const deleteElement = useCallback(async (elementId: string) => {
    if (!board) return;
    
    const elements = board.canvas.elements.filter(el => el.id !== elementId);
    const newCanvas = { ...board.canvas, elements };
    await updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
    setEditingItem(null);
  }, [board]);

  // Add new element
  const addElement = useCallback(async (data: {
    prompt: string;
    title: string;
    affirmation: string;
    gridSize: "small" | "medium" | "large";
    style: string;
  }) => {
    if (!board) return;
      
      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: "image",
      position: { x: 0, y: 0 },
        size: { width: 350, height: 280 },
        rotation: 0,
        layer: board.canvas.elements.length,
        locked: false,
        data: {
        src: "",
        prompt: data.prompt,
        isGenerated: true,
        style: data.style,
        title: data.title,
        affirmation: data.affirmation,
        gridSize: data.gridSize,
        status: "pending" as const,
        },
      };

      const elements = [...board.canvas.elements, newElement];
    const newCanvas = { ...board.canvas, elements };
    await updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
    
    // Start generating the image
    generateImage(newElement.id, data.prompt, data.style);
    setShowAddModal(false);
  }, [board]);

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
          : "#0D0D0D",
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
          : "#0D0D0D",
        backgroundImage: board?.canvas.background.type === "gradient"
          ? `linear-gradient(${board.canvas.background.direction || 135}deg, ${board.canvas.background.value}, ${board.canvas.background.secondaryValue || "#1A1A1A"})`
          : undefined,
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal shrink-0"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="h-5 sm:h-6 w-px bg-sand hidden sm:block" />
            <h1 className="font-display text-base sm:text-xl text-charcoal truncate">{board?.title}</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Edit Vision Button - only show if board has an associated journal */}
            {board?.journalId && (
              <button
                onClick={() => router.push(`/journal/${board.journalId}?edit=true&boardId=${board.id}`)}
                className="p-2 sm:px-3 sm:py-2.5 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal font-sans text-sm"
                title="Edit your vision prompt and regenerate"
              >
                <FileEdit className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Edit Vision</span>
              </button>
            )}

            {/* Add Image Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal font-sans text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Add Image</span>
            </button>

          <button
              onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
            className={cn(
                "p-2 sm:p-2.5 rounded-xl transition-gentle relative",
                showBackgroundPicker ? "bg-cream-dark text-charcoal" : "hover:bg-cream-dark text-slate hover:text-charcoal"
            )}
          >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={exportPNG}
            disabled={isExporting}
            className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-gentle font-sans text-xs sm:text-sm",
              isExporting 
                ? "bg-sand text-slate cursor-not-allowed" 
                : "bg-terracotta text-cream hover:bg-terracotta-dark"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Export</span>
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
              className="absolute right-2 sm:right-4 top-full mt-2 bg-cream-dark rounded-xl sm:rounded-2xl shadow-xl border border-white/10 p-3 sm:p-4 w-64 sm:w-72"
            >
              <h3 className="font-display text-sm sm:text-base text-charcoal mb-2 sm:mb-3">Background</h3>
              
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {["#0D0D0D", "#161616", "#1A1A1A", "#242424", "#2A2A2A", 
                  "#3D2424", "#2D2A3D", "#2A3D2A", "#2A3D3D", "#3D3428"].map(color => (
                  <button
                    key={color}
                    onClick={() => updateBackground({ type: "color", value: color })}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg border-2 border-white/10 hover:border-terracotta transition-gentle"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <button
                  onClick={() => updateBackground({ 
                    type: "gradient", 
                    value: "#0D0D0D", 
                    secondaryValue: "#3D2424",
                    direction: 135 
                  })}
                  className="w-full h-8 sm:h-10 rounded-md sm:rounded-lg border-2 border-white/10 hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(135deg, #0D0D0D, #3D2424)" }}
                />
                <button
                  onClick={() => updateBackground({ 
                    type: "gradient", 
                    value: "#0D0D0D", 
                    secondaryValue: "#2D2A3D",
                    direction: 180 
                  })}
                  className="w-full h-8 sm:h-10 rounded-md sm:rounded-lg border-2 border-white/10 hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(180deg, #0D0D0D, #2D2A3D)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Collage Grid */}
      <main className="flex-1 p-3 sm:p-6 md:p-10">
        <div 
          ref={collageRef}
          className="max-w-6xl mx-auto"
        >
          {collageItems.length === 0 ? (
            // Empty state for blank boards
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 sm:py-20 px-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-cream-dark flex items-center justify-center mb-4 sm:mb-6">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-terracotta/50" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl text-charcoal mb-2 text-center">Your canvas awaits</h2>
              <p className="font-serif text-sm sm:text-base text-slate mb-6 sm:mb-8 text-center max-w-md">
                Tap the button below to start building your vision board with AI-generated imagery.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-terracotta text-cream hover:bg-terracotta-dark transition-gentle font-sans text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Your First Image
              </button>
            </motion.div>
          ) : (
            <div className="collage-grid">
              {collageItems.map((item, index) => (
                <CollageCard
                  key={item.id}
                  item={item}
                  index={index}
                  isGenerating={generatingImages.has(item.id)}
                  onEdit={() => setEditingItem(item)}
                  onRegenerate={() => generateImage(item.id, item.data.prompt, item.data.style)}
                />
              ))}
              {/* Add New Image Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="collage-item-small rounded-xl sm:rounded-2xl border-2 border-dashed border-sand/70 bg-cream-dark/30 hover:bg-cream-dark/50 hover:border-terracotta/50 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cream flex items-center justify-center group-hover:bg-terracotta/10 group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-slate group-hover:text-terracotta" />
                </div>
                <span className="font-sans text-xs sm:text-sm text-slate group-hover:text-charcoal">Add</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
        <AnimatePresence>
        {editingItem && (
          <EditImageModal
            item={editingItem}
            isGenerating={generatingImages.has(editingItem.id)}
            onClose={() => setEditingItem(null)}
            onSave={(updates) => {
              updateElement(editingItem.id, updates);
              setEditingItem(null);
            }}
            onRegenerate={(newPrompt, style) => {
              updateElement(editingItem.id, { prompt: newPrompt, style, status: "pending" as const, src: "" });
              generateImage(editingItem.id, newPrompt, style);
              setEditingItem(null);
            }}
            onDelete={() => deleteElement(editingItem.id)}
          />
        )}
      </AnimatePresence>

      {/* Add Image Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddImageModal
            onClose={() => setShowAddModal(false)}
            onAdd={addElement}
            />
          )}
        </AnimatePresence>
    </div>
  );
}

interface CollageCardProps {
  item: CollageItem;
  index: number;
  isGenerating: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
}

function CollageCard({ item, index, isGenerating, onEdit, onRegenerate }: CollageCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  
  const gridSize = item.data.gridSize || "small";
  
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
        "collage-item group relative overflow-hidden rounded-2xl bg-cream-dark shadow-lg cursor-pointer",
        sizeClasses[gridSize]
      )}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={onEdit}
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cream-dark to-sand">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-terracotta/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 font-serif text-sm text-slate">Generating...</p>
          <p className="mt-1 font-sans text-xs text-slate/60 max-w-[200px] text-center line-clamp-2">
            {item.data.title || "Your vision"}
          </p>
            </div>
          ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-cream-dark">
          <Sparkles className="w-12 h-12 text-sand mb-2" />
          <p className="font-sans text-xs text-slate/60">Click to edit</p>
            </div>
          )}

      {/* Hover Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent flex flex-col justify-end p-4"
          >
            {item.data.title && (
              <p className="font-display text-cream text-lg leading-tight mb-1">
                {item.data.title}
              </p>
            )}
            {item.data.affirmation && (
              <p className="font-serif text-cream/90 text-sm italic">
                "{item.data.affirmation}"
              </p>
            )}
            
            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 rounded-xl bg-cream/20 backdrop-blur-sm text-cream hover:bg-cream/30 transition-gentle"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isGenerating}
                className="p-2 rounded-xl bg-cream/20 backdrop-blur-sm text-cream hover:bg-cream/30 transition-gentle"
                title="Regenerate"
              >
                <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              </button>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Edit Image Modal
interface EditImageModalProps {
  item: CollageItem;
  isGenerating: boolean;
  onClose: () => void;
  onSave: (updates: Partial<CollageItem["data"]>) => void;
  onRegenerate: (prompt: string, style: string) => void;
  onDelete: () => void;
}

function EditImageModal({ item, isGenerating, onClose, onSave, onRegenerate, onDelete }: EditImageModalProps) {
  const [prompt, setPrompt] = useState(item.data.prompt || "");
  const [style, setStyle] = useState(item.data.style || "photography");
  const [title, setTitle] = useState(item.data.title || "");
  const [affirmation, setAffirmation] = useState(item.data.affirmation || "");
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">(item.data.gridSize || "medium");
  
  const hasChanges = prompt !== item.data.prompt || 
                     title !== item.data.title || 
                     affirmation !== item.data.affirmation ||
                     gridSize !== item.data.gridSize ||
                     style !== item.data.style;
  
  const handleSave = () => {
    onSave({ title, affirmation, gridSize, style });
  };

  const handleRegenerate = () => {
    if (prompt.trim()) {
      onRegenerate(prompt.trim(), style);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-cream-dark rounded-3xl shadow-2xl border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream-dark px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center">
              <Pencil className="w-5 h-5 text-cream" />
            </div>
      <div>
              <h2 className="font-display text-xl text-charcoal">Edit Image</h2>
              <p className="font-sans text-sm text-slate">Customize your vision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-cream-dark text-slate hover:text-charcoal transition-gentle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        {item.data.src && (
          <div className="mx-6 mt-4 mb-4 rounded-2xl overflow-hidden aspect-square bg-cream-dark">
            <img
              src={item.data.src}
              alt={item.data.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Personal Connection - shows why this was generated */}
        {item.data.personalConnection && (
          <div className="mx-6 mb-4 p-3 rounded-xl bg-lavender/10 border border-lavender/20">
            <p className="font-sans text-xs text-slate/70 mb-1">From your journal:</p>
            <p className="font-serif text-sm text-charcoal italic">{item.data.personalConnection}</p>
          </div>
        )}

        {/* Form */}
        <div className="px-6 pb-6 space-y-4">
          {/* Prompt */}
          <div>
            <label className="font-sans text-sm text-slate mb-2 block">Image Prompt</label>
        <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full p-3 rounded-xl bg-cream-dark/50 border border-sand/50 font-serif text-charcoal placeholder:text-slate/50 resize-none focus:outline-none focus:border-terracotta/50 transition-gentle"
          rows={3}
        />
      </div>

          {/* Title */}
      <div>
            <label className="font-sans text-sm text-slate mb-2 block">Title</label>
        <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inner Peace"
              className="w-full p-3 rounded-xl bg-cream-dark/50 border border-sand/50 font-sans text-charcoal placeholder:text-slate/50 focus:outline-none focus:border-terracotta/50 transition-gentle"
        />
      </div>

          {/* Affirmation */}
      <div>
            <label className="font-sans text-sm text-slate mb-2 block">Affirmation</label>
        <input
              type="text"
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="e.g., I am calm and centered"
              className="w-full p-3 rounded-xl bg-cream-dark/50 border border-sand/50 font-serif italic text-charcoal placeholder:text-slate/50 focus:outline-none focus:border-terracotta/50 transition-gentle"
        />
      </div>

          {/* Style */}
          <div>
            <label className="font-sans text-sm text-slate mb-2 block">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(styleLabels).slice(0, 6).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  className={cn(
                    "py-2 px-2 rounded-xl border-2 font-sans text-xs transition-gentle",
                    style === key 
                      ? "border-terracotta bg-terracotta/10 text-charcoal" 
                      : "border-sand/50 text-slate hover:border-sand"
                  )}
                >
                  {label}
                </button>
              ))}
    </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.entries(styleLabels).slice(6).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  className={cn(
                    "py-2 px-2 rounded-xl border-2 font-sans text-xs transition-gentle",
                    style === key 
                      ? "border-terracotta bg-terracotta/10 text-charcoal" 
                      : "border-sand/50 text-slate hover:border-sand"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Size */}
        <div>
            <label className="font-sans text-sm text-slate mb-2 block">Size in Grid</label>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl border-2 font-sans text-sm capitalize transition-gentle",
                    gridSize === size 
                      ? "border-terracotta bg-terracotta/10 text-charcoal" 
                      : "border-sand/50 text-slate hover:border-sand"
                  )}
                >
                  {size}
                </button>
              ))}
        </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDelete}
              className="p-3 rounded-xl border border-rose/50 text-rose hover:bg-rose/10 transition-gentle"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-sans text-sm transition-gentle",
                hasChanges 
                  ? "bg-cream-dark text-charcoal hover:bg-sand/50"
                  : "bg-sand/30 text-slate/50 cursor-not-allowed"
              )}
            >
              Save Changes
            </button>
            
        <button
              onClick={handleRegenerate}
              disabled={!prompt.trim() || isGenerating}
          className={cn(
                "flex-1 py-3 px-4 rounded-xl font-sans text-sm font-medium transition-gentle flex items-center justify-center gap-2",
                prompt.trim() && !isGenerating
                  ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg"
                  : "bg-sand/50 text-slate/50 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Regenerate
            </>
          )}
        </button>
      </div>
    </div>
      </motion.div>
    </motion.div>
  );
}

// Add Image Modal
interface AddImageModalProps {
  onClose: () => void;
  onAdd: (data: { prompt: string; title: string; affirmation: string; gridSize: "small" | "medium" | "large"; style: string }) => void;
}

const inspirationPrompts = [
  { prompt: "Zen garden with raked sand patterns, single smooth stone, soft morning light", title: "Serenity", style: "minimalist" },
  { prompt: "Cozy reading nook with stacked books, warm blanket, steaming tea by window", title: "Comfort", style: "photography" },
  { prompt: "Winding forest path disappearing into morning mist, ancient trees", title: "Journey", style: "cinematic" },
  { prompt: "Seedling pushing through rich soil, dewdrops catching light", title: "Growth", style: "macro" },
  { prompt: "Open road stretching to mountains, dramatic clouds, sense of freedom", title: "Freedom", style: "landscape" },
  { prompt: "Still lake at dawn reflecting pink sky, single lotus flower floating", title: "Peace", style: "watercolor" },
];

function AddImageModal({ onClose, onAdd }: AddImageModalProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photography");
  const [title, setTitle] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">("medium");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onAdd({
        prompt: prompt.trim(),
        title: title.trim() || "Vision",
        affirmation: affirmation.trim(),
        gridSize,
        style,
      });
    }
  };

  const useInspiration = (idea: typeof inspirationPrompts[0]) => {
    setPrompt(idea.prompt);
    setTitle(idea.title);
    setStyle(idea.style);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-cream-dark rounded-3xl shadow-2xl border border-white/10 w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cream-dark px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cream" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl text-charcoal">Add Image</h2>
                <p className="font-sans text-xs sm:text-sm text-slate">Describe your vision</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-sand/30 text-slate hover:text-charcoal transition-gentle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
          {/* Prompt */}
          <div>
            <label className="font-sans text-xs sm:text-sm text-slate mb-1.5 sm:mb-2 block">What do you want to visualize?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A peaceful sunrise over calm ocean waves..."
              className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-cream-dark/50 border border-sand/50 font-serif text-sm sm:text-base text-charcoal placeholder:text-slate/50 resize-none focus:outline-none focus:border-terracotta/50 transition-gentle"
              rows={3}
              autoFocus
            />
          </div>

          {/* Inspiration chips */}
          <div>
            <label className="font-sans text-[10px] sm:text-xs text-slate mb-1.5 sm:mb-2 block">Need inspiration?</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {inspirationPrompts.map((idea) => (
                <button
                  key={idea.prompt}
                  onClick={() => useInspiration(idea)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cream-dark/50 border border-sand/50 font-sans text-[10px] sm:text-xs text-slate hover:bg-cream-dark hover:border-terracotta/30 transition-gentle"
                >
                  {idea.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-sans text-xs sm:text-sm text-slate mb-1.5 sm:mb-2 block">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inner Peace"
              className="w-full p-2.5 sm:p-3 rounded-xl bg-cream-dark/50 border border-sand/50 font-sans text-sm sm:text-base text-charcoal placeholder:text-slate/50 focus:outline-none focus:border-terracotta/50 transition-gentle"
            />
          </div>

          {/* Affirmation */}
          <div>
            <label className="font-sans text-xs sm:text-sm text-slate mb-1.5 sm:mb-2 block">Affirmation (optional)</label>
            <input
              type="text"
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="e.g., I am calm and centered"
              className="w-full p-2.5 sm:p-3 rounded-xl bg-cream-dark/50 border border-sand/50 font-serif italic text-sm sm:text-base text-charcoal placeholder:text-slate/50 focus:outline-none focus:border-terracotta/50 transition-gentle"
            />
          </div>

          {/* Style */}
          <div>
            <label className="font-sans text-sm text-slate mb-2 block">Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {Object.entries(styleLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  className={cn(
                    "py-1.5 px-1.5 sm:px-2 rounded-lg border-2 font-sans text-[10px] sm:text-xs transition-gentle",
                    style === key 
                      ? "border-terracotta bg-terracotta/10 text-charcoal" 
                      : "border-sand/50 text-slate hover:border-sand"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Size */}
          <div>
            <label className="font-sans text-xs sm:text-sm text-slate mb-1.5 sm:mb-2 block">Size in Grid</label>
            <div className="flex gap-1.5 sm:gap-2">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={cn(
                    "flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl border-2 font-sans text-xs sm:text-sm capitalize transition-gentle",
                    gridSize === size 
                      ? "border-terracotta bg-terracotta/10 text-charcoal" 
                      : "border-sand/50 text-slate hover:border-sand"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-sand font-sans text-xs sm:text-sm text-slate hover:bg-cream-dark transition-gentle"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={cn(
                "flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-sans text-xs sm:text-sm font-medium transition-gentle flex items-center justify-center gap-1.5 sm:gap-2",
                prompt.trim()
                  ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg"
                  : "bg-sand/50 text-slate/50 cursor-not-allowed"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Generate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
