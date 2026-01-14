import Dexie, { type EntityTable } from "dexie";

export interface JournalResponse {
  promptId: string;
  question: string;
  answer: string;
  timestamp: Date;
}

export interface UserProfile {
  // Core vision elements
  antiVisionStatement: string;
  visionStatement: string;
  identityStatement: string;
  
  // Excavation insights
  dissatisfactions: string[];
  patternsThatKeepYouStuck: string[];
  whatYoureProtecting: string;
  embarrassingTruth: string;
  
  // Anti-vision details
  antiVisionScenario: string;
  identityToGiveUp: string;
  
  // Vision details
  dreamTuesday: string;
  beliefRequired: string;
  
  // Game plan
  oneYearGoal: string;
  oneMonthGoal: string;
  dailyActions: string[];
  constraints: string[];
  
  // Legacy fields for backward compatibility
  yearTheme?: string;
  values?: string[];
  obstacles?: string[];
  
  // Synthesis
  theRealEnemy: string;
  keyInsight: string;
  summary: string;
}

export interface Journal {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  responses: JournalResponse[];
  profile?: UserProfile;
  boardId?: string;
  isComplete: boolean;
}

export interface CanvasElement {
  id: string;
  type: "image" | "text" | "shape";
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  layer: number;
  locked: boolean;
  data: ImageData | TextData | ShapeData;
}

export interface ImageData {
  src: string;
  prompt?: string;
  isGenerated: boolean;
  style?: string;
  title?: string;
  affirmation?: string;
  gridSize?: "small" | "medium" | "large";
  status?: "pending" | "complete" | "error";
  personalConnection?: string;
}

export interface TextData {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: "left" | "center" | "right";
}

export interface ShapeData {
  shapeType: "rectangle" | "circle" | "line";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface Background {
  type: "color" | "gradient" | "texture" | "image";
  value: string;
  secondaryValue?: string;
  direction?: number;
}

export interface CanvasState {
  background: Background;
  elements: CanvasElement[];
  viewport: { x: number; y: number; zoom: number };
}

export interface BoardVersion {
  id: string;
  snapshot: CanvasState;
  createdAt: Date;
  description?: string;
}

export interface Board {
  id: string;
  journalId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  canvas: CanvasState;
  versions: BoardVersion[];
}

const db = new Dexie("VisionBoardDB") as Dexie & {
  journals: EntityTable<Journal, "id">;
  boards: EntityTable<Board, "id">;
};

db.version(1).stores({
  journals: "id, createdAt, updatedAt, boardId",
  boards: "id, journalId, createdAt, updatedAt",
});

export { db };

export async function createJournal(title: string): Promise<Journal> {
  const journal: Journal = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    responses: [],
    isComplete: false,
  };
  await db.journals.add(journal);
  return journal;
}

export async function updateJournal(id: string, updates: Partial<Journal>): Promise<void> {
  await db.journals.update(id, { ...updates, updatedAt: new Date() });
}

export async function getJournal(id: string): Promise<Journal | undefined> {
  return db.journals.get(id);
}

export async function createBoard(journalId: string, title: string): Promise<Board> {
  const board: Board = {
    id: crypto.randomUUID(),
    journalId,
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    canvas: {
      background: { type: "color", value: "#0D0D0D" },
      elements: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    versions: [],
  };
  await db.boards.add(board);
  return board;
}

export async function createBlankBoard(title: string): Promise<string> {
  const board: Board = {
    id: crypto.randomUUID(),
    journalId: "", // No associated journal
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    canvas: {
      background: { type: "color", value: "#0D0D0D" },
      elements: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    versions: [],
  };
  await db.boards.add(board);
  return board.id;
}

export async function updateBoard(id: string, updates: Partial<Board>): Promise<void> {
  await db.boards.update(id, { ...updates, updatedAt: new Date() });
}

export async function getBoard(id: string): Promise<Board | undefined> {
  return db.boards.get(id);
}

export async function addBoardVersion(boardId: string, description?: string): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) return;

  const version: BoardVersion = {
    id: crypto.randomUUID(),
    snapshot: JSON.parse(JSON.stringify(board.canvas)),
    createdAt: new Date(),
    description,
  };

  const versions = [...board.versions, version].slice(-10);
  await updateBoard(boardId, { versions });
}
