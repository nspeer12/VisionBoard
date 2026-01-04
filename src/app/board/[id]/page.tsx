"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Download, 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw,
  Lock,
  Unlock,
  Layers,
  Palette,
  Upload,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Move,
  X,
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

type CanvasMode = "select" | "pan";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>("select");
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load board
  useEffect(() => {
    const load = async () => {
      const b = await db.boards.get(boardId);
      if (!b) {
        router.replace("/");
        return;
      }
      setBoard(b);
      setViewport(b.canvas.viewport);
      setHistory([b.canvas.elements]);
      setHistoryIndex(0);
      setIsLoading(false);

      // Start generating pending images
      b.canvas.elements.forEach((el) => {
        if (el.type === "image" && (el.data as any).status === "pending") {
          generateImage(el.id, (el.data as any).prompt);
        }
      });
    };
    load();
  }, [boardId, router]);

  // Save board
  const saveBoard = useCallback(async (elements: CanvasElement[]) => {
    if (!board) return;
    const newCanvas = { ...board.canvas, elements, viewport };
    await updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
  }, [board, viewport]);

  // Add to history
  const pushHistory = useCallback((elements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements);
    setHistory(newHistory.slice(-50)); // Keep last 50 states
    setHistoryIndex(newHistory.length - 1);
    saveBoard(elements);
  }, [history, historyIndex, saveBoard]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const elements = history[historyIndex - 1];
      saveBoard(elements);
    }
  }, [history, historyIndex, saveBoard]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const elements = history[historyIndex + 1];
      saveBoard(elements);
    }
  }, [history, historyIndex, saveBoard]);

  // Generate image
  const generateImage = async (elementId: string, prompt: string) => {
    if (!board) return;
    setGeneratingImages(prev => new Set(prev).add(elementId));

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const { imageUrl } = await response.json();
        const elements = board.canvas.elements.map(el => {
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
        pushHistory(elements);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
    }
  };

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    if (!board) return;
    const elements = board.canvas.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    pushHistory(elements);
  }, [board, pushHistory]);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    if (!board) return;
    const elements = board.canvas.elements.filter(el => el.id !== id);
    pushHistory(elements);
    setSelectedId(null);
  }, [board, pushHistory]);

  // Add element
  const addElement = useCallback((type: "image" | "text") => {
    if (!board) return;
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type,
      position: { x: 200 - viewport.x, y: 200 - viewport.y },
      size: type === "text" ? { width: 300, height: 60 } : { width: 350, height: 280 },
      rotation: 0,
      layer: board.canvas.elements.length,
      locked: false,
      data: type === "text" 
        ? {
            content: "Your affirmation here",
            fontFamily: "Playfair Display",
            fontSize: 24,
            fontWeight: 500,
            color: "#2D3436",
            textAlign: "center",
          }
        : {
            src: "",
            prompt: "",
            isGenerated: false,
            style: "photorealistic",
          },
    };

    const elements = [...board.canvas.elements, newElement];
    pushHistory(elements);
    setSelectedId(newElement.id);
    setShowInspector(true);
  }, [board, pushHistory, viewport]);

  // Handle file upload
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !board) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: "image",
        position: { x: 200 - viewport.x, y: 200 - viewport.y },
        size: { width: 350, height: 280 },
        rotation: 0,
        layer: board.canvas.elements.length,
        locked: false,
        data: {
          src: dataUrl,
          isGenerated: false,
        },
      };

      const elements = [...board.canvas.elements, newElement];
      pushHistory(elements);
      setSelectedId(newElement.id);
    };
    reader.readAsDataURL(file);
  }, [board, pushHistory, viewport]);

  // Update background
  const updateBackground = useCallback((background: Background) => {
    if (!board) return;
    const newCanvas = { ...board.canvas, background };
    updateBoard(board.id, { canvas: newCanvas });
    setBoard({ ...board, canvas: newCanvas });
  }, [board]);

  // Export as PNG
  const exportPNG = useCallback(async () => {
    if (!canvasRef.current || !board) return;
    
    // Create a version snapshot
    await addBoardVersion(board.id, "Export snapshot");
    
    // Use html2canvas or similar (simplified for now)
    alert("Export feature coming soon! Your board has been saved.");
  }, [board]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !showInspector) {
          deleteElement(selectedId);
        }
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setShowInspector(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, showInspector, deleteElement, undo, redo]);

  const selectedElement = board?.canvas.elements.find(el => el.id === selectedId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-cream-dark overflow-hidden">
      {/* Toolbar */}
      <header className="h-16 bg-cream border-b border-sand flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-sand" />
          <h1 className="font-display text-lg text-charcoal">{board?.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-cream-dark rounded-xl p-1">
            <button
              onClick={() => setMode("select")}
              className={cn(
                "p-2 rounded-lg transition-gentle",
                mode === "select" ? "bg-cream text-charcoal shadow-sm" : "text-slate"
              )}
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode("pan")}
              className={cn(
                "p-2 rounded-lg transition-gentle",
                mode === "pan" ? "bg-cream text-charcoal shadow-sm" : "text-slate"
              )}
            >
              <Move className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-sand" />

          {/* Zoom */}
          <button
            onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.25, v.zoom - 0.25) }))}
            className="p-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="font-sans text-sm text-slate min-w-[4rem] text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2, v.zoom + 0.25) }))}
            className="p-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-sand" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className={cn(
              "p-2 rounded-xl transition-gentle",
              historyIndex > 0 ? "hover:bg-cream-dark text-slate" : "text-sand cursor-not-allowed"
            )}
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-sand" />

          {/* Export */}
          <button
            onClick={exportPNG}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta text-cream hover:bg-terracotta-dark transition-gentle"
          >
            <Download className="w-4 h-4" />
            <span className="font-sans text-sm">Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Tools */}
        <aside className="w-16 bg-cream border-r border-sand flex flex-col items-center py-4 gap-2 shrink-0">
          <button
            onClick={() => addElement("text")}
            className="p-3 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal group relative"
          >
            <Type className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-charcoal text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Add Text
            </span>
          </button>
          
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => handleUpload(e as any);
              input.click();
            }}
            className="p-3 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal group relative"
          >
            <Upload className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-charcoal text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Upload Image
            </span>
          </button>

          <button
            onClick={() => setShowImageModal(true)}
            className="p-3 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal group relative"
          >
            <Sparkles className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-charcoal text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Generate Image
            </span>
          </button>

          <div className="h-px w-8 bg-sand my-2" />

          <button
            onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
            className={cn(
              "p-3 rounded-xl transition-gentle group relative",
              showBackgroundPicker ? "bg-cream-dark text-charcoal" : "hover:bg-cream-dark text-slate hover:text-charcoal"
            )}
          >
            <Palette className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-charcoal text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Background
            </span>
          </button>
        </aside>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundColor: board?.canvas.background.type === "color" 
              ? board.canvas.background.value 
              : "#FDF8F3",
            backgroundImage: board?.canvas.background.type === "gradient"
              ? `linear-gradient(${board.canvas.background.direction || 135}deg, ${board.canvas.background.value}, ${board.canvas.background.secondaryValue || "#E8DED3"})`
              : board?.canvas.background.type === "image"
              ? `url(${board.canvas.background.value})`
              : undefined,
            backgroundSize: "cover",
          }}
          onClick={() => {
            if (mode === "select") {
              setSelectedId(null);
              setShowInspector(false);
            }
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {board?.canvas.elements.map((element) => (
              <CanvasElementComponent
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                isGenerating={generatingImages.has(element.id)}
                onSelect={() => {
                  if (mode === "select") {
                    setSelectedId(element.id);
                    setShowInspector(true);
                  }
                }}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onDelete={() => deleteElement(element.id)}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar - Inspector */}
        <AnimatePresence>
          {showInspector && selectedElement && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-cream border-l border-sand overflow-hidden shrink-0"
            >
              <div className="p-4 w-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-charcoal">
                    {selectedElement.type === "text" ? "Text" : "Image"}
                  </h3>
                  <button
                    onClick={() => setShowInspector(false)}
                    className="p-1 rounded hover:bg-cream-dark text-slate"
                  >
                    ×
                  </button>
                </div>

                {selectedElement.type === "text" && (
                  <TextInspector
                    element={selectedElement}
                    onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                  />
                )}

                {selectedElement.type === "image" && (
                  <ImageInspector
                    element={selectedElement}
                    isGenerating={generatingImages.has(selectedElement.id)}
                    onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                    onRegenerate={() => {
                      const prompt = (selectedElement.data as any).prompt;
                      if (prompt) {
                        generateImage(selectedElement.id, prompt);
                      }
                    }}
                  />
                )}

                <div className="mt-6 pt-4 border-t border-sand">
                  <button
                    onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                    className="flex items-center gap-2 w-full p-2 rounded-xl hover:bg-cream-dark text-slate transition-gentle"
                  >
                    {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span className="font-sans text-sm">{selectedElement.locked ? "Unlock" : "Lock"}</span>
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="flex items-center gap-2 w-full p-2 rounded-xl hover:bg-rose/20 text-rose transition-gentle"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-sans text-sm">Delete</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Background picker */}
        <AnimatePresence>
          {showBackgroundPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-20 top-4 bg-cream rounded-2xl shadow-xl border border-sand p-4 w-64"
            >
              <h3 className="font-display text-lg text-charcoal mb-4">Background</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {["#FDF8F3", "#F5EDE4", "#E8DED3", "#FFFFFF", "#1A1A1A", 
                  "#D4A5A5", "#B8B5C9", "#9CAF88", "#7FA6B5", "#C4A484"].map(color => (
                  <button
                    key={color}
                    onClick={() => updateBackground({ type: "color", value: color })}
                    className="w-8 h-8 rounded-lg border-2 border-sand hover:border-terracotta transition-gentle"
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
                  className="w-full h-8 rounded-lg border-2 border-sand hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(135deg, #FDF8F3, #D4A5A5)" }}
                />
                <button
                  onClick={() => updateBackground({ 
                    type: "gradient", 
                    value: "#FDF8F3", 
                    secondaryValue: "#B8B5C9",
                    direction: 180 
                  })}
                  className="w-full h-8 rounded-lg border-2 border-sand hover:border-terracotta transition-gentle"
                  style={{ background: "linear-gradient(180deg, #FDF8F3, #B8B5C9)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Generation Modal */}
        <AnimatePresence>
          {showImageModal && (
            <ImageGenerationModal
              onClose={() => setShowImageModal(false)}
              onGenerate={(prompt, style) => {
                if (board) {
                  const newElement: CanvasElement = {
                    id: crypto.randomUUID(),
                    type: "image",
                    position: { x: 200 - viewport.x, y: 200 - viewport.y },
                    size: { width: 350, height: 280 },
                    rotation: 0,
                    layer: board.canvas.elements.length,
                    locked: false,
                    data: {
                      src: "",
                      prompt,
                      isGenerated: true,
                      style,
                      status: "pending",
                    },
                  };
                  const elements = [...board.canvas.elements, newElement];
                  pushHistory(elements);
                  generateImage(newElement.id, prompt);
                  setShowImageModal(false);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CanvasElementComponentProps {
  element: CanvasElement;
  isSelected: boolean;
  isGenerating: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

function CanvasElementComponent({ 
  element, 
  isSelected, 
  isGenerating,
  onSelect, 
  onUpdate,
}: CanvasElementComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
    // Only allow dragging if not locked
    if (element.locked) return;
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - element.position.x, 
      y: e.clientY - element.position.y 
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onUpdate({
        position: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, onUpdate]);

  return (
    <div
      className={cn(
        "canvas-element",
        isSelected && "selected",
        element.locked ? "cursor-pointer" : "cursor-move"
      )}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.layer,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {element.type === "image" && (
        <div className="w-full h-full rounded-xl overflow-hidden bg-cream-dark relative">
          {(element.data as any).src ? (
            <img
              src={(element.data as any).src}
              alt={(element.data as any).title || "Vision"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : isGenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
              <p className="font-sans text-sm text-slate">Generating...</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-sand" />
            </div>
          )}
        </div>
      )}

      {element.type === "text" && (
        <div 
          className="w-full h-full flex items-center justify-center p-4"
          style={{
            fontFamily: (element.data as any).fontFamily,
            fontSize: (element.data as any).fontSize,
            fontWeight: (element.data as any).fontWeight,
            color: (element.data as any).color,
            textAlign: (element.data as any).textAlign,
          }}
        >
          {(element.data as any).content}
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          <div className="resize-handle -top-1.5 -left-1.5 cursor-nw-resize" />
          <div className="resize-handle -top-1.5 -right-1.5 cursor-ne-resize" />
          <div className="resize-handle -bottom-1.5 -left-1.5 cursor-sw-resize" />
          <div className="resize-handle -bottom-1.5 -right-1.5 cursor-se-resize" />
        </>
      )}
    </div>
  );
}

interface TextInspectorProps {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

function TextInspector({ element, onUpdate }: TextInspectorProps) {
  const data = element.data as any;

  return (
    <div className="space-y-4">
      <div>
        <label className="font-sans text-xs text-slate mb-1 block">Content</label>
        <textarea
          value={data.content}
          onChange={(e) => onUpdate({ data: { ...data, content: e.target.value } })}
          className="w-full p-2 rounded-xl bg-cream-dark border border-sand font-serif text-sm resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="font-sans text-xs text-slate mb-1 block">Font Size</label>
        <input
          type="range"
          min="12"
          max="72"
          value={data.fontSize}
          onChange={(e) => onUpdate({ data: { ...data, fontSize: parseInt(e.target.value) } })}
          className="w-full"
        />
      </div>

      <div>
        <label className="font-sans text-xs text-slate mb-1 block">Color</label>
        <input
          type="color"
          value={data.color}
          onChange={(e) => onUpdate({ data: { ...data, color: e.target.value } })}
          className="w-full h-10 rounded-xl cursor-pointer"
        />
      </div>
    </div>
  );
}

interface ImageInspectorProps {
  element: CanvasElement;
  isGenerating: boolean;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onRegenerate: () => void;
}

function ImageInspector({ element, isGenerating, onUpdate, onRegenerate }: ImageInspectorProps) {
  const data = element.data as any;

  return (
    <div className="space-y-4">
      {data.prompt && (
        <div>
          <label className="font-sans text-xs text-slate mb-1 block">Prompt</label>
          <textarea
            value={data.prompt}
            onChange={(e) => onUpdate({ data: { ...data, prompt: e.target.value } })}
            className="w-full p-2 rounded-xl bg-cream-dark border border-sand font-sans text-sm resize-none"
            rows={3}
          />
        </div>
      )}

      {data.isGenerated && (
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-sans text-sm transition-gentle",
            isGenerating 
              ? "bg-sand text-slate cursor-not-allowed"
              : "bg-terracotta text-cream hover:bg-terracotta-dark"
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
      )}

      <div>
        <label className="font-sans text-xs text-slate mb-1 block">Style</label>
        <select
          value={data.style || "photorealistic"}
          onChange={(e) => onUpdate({ data: { ...data, style: e.target.value } })}
          className="w-full p-2 rounded-xl bg-cream-dark border border-sand font-sans text-sm"
        >
          <option value="photorealistic">Photorealistic</option>
          <option value="illustrated">Illustrated</option>
          <option value="watercolor">Watercolor</option>
          <option value="abstract">Abstract</option>
        </select>
      </div>
    </div>
  );
}

interface ImageGenerationModalProps {
  onClose: () => void;
  onGenerate: (prompt: string, style: string) => void;
}

const styleOptions = [
  { id: "photorealistic", label: "Photorealistic", icon: "📷", description: "Lifelike, professional photography" },
  { id: "illustrated", label: "Illustrated", icon: "🎨", description: "Digital art, vibrant colors" },
  { id: "watercolor", label: "Watercolor", icon: "🖌️", description: "Soft, artistic brushstrokes" },
  { id: "abstract", label: "Abstract", icon: "✨", description: "Conceptual, symbolic imagery" },
];

const inspirationPrompts = [
  "A serene mountain lake at golden hour",
  "A cozy reading nook with warm sunlight",
  "A path through an ancient forest",
  "A peaceful garden with blooming flowers",
  "An open road leading to the horizon",
  "A tranquil beach at sunrise",
];

function ImageGenerationModal({ onClose, onGenerate }: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onGenerate(prompt.trim(), style);
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-cream rounded-3xl shadow-2xl border border-sand/50 w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cream" />
              </div>
              <div>
                <h2 className="font-display text-xl text-charcoal">Generate Image</h2>
                <p className="font-sans text-sm text-slate">Describe your vision</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-cream-dark text-slate hover:text-charcoal transition-gentle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="font-sans text-sm text-slate mb-2 block">What do you want to visualize?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A peaceful sunrise over calm ocean waves, golden light reflecting on the water..."
              className="w-full p-4 rounded-2xl bg-cream-dark/50 border border-sand/50 font-serif text-charcoal placeholder:text-slate/50 resize-none focus:outline-none focus:border-terracotta/50 transition-gentle"
              rows={3}
              autoFocus
            />
          </div>

          {/* Inspiration chips */}
          <div>
            <label className="font-sans text-xs text-slate mb-2 block">Need inspiration?</label>
            <div className="flex flex-wrap gap-2">
              {inspirationPrompts.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="px-3 py-1.5 rounded-full bg-cream-dark/50 border border-sand/50 font-sans text-xs text-slate hover:bg-cream-dark hover:border-terracotta/30 transition-gentle"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="font-sans text-sm text-slate mb-2 block">Choose a style</label>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStyle(option.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-gentle",
                    style === option.id 
                      ? "border-terracotta bg-terracotta/5" 
                      : "border-sand/50 hover:border-sand"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{option.icon}</span>
                    <span className="font-sans text-sm font-medium text-charcoal">{option.label}</span>
                  </div>
                  <p className="font-sans text-xs text-slate">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-sand font-sans text-sm text-slate hover:bg-cream-dark transition-gentle"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl font-sans text-sm font-medium transition-gentle flex items-center justify-center gap-2",
                prompt.trim()
                  ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg"
                  : "bg-sand/50 text-slate/50 cursor-not-allowed"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
