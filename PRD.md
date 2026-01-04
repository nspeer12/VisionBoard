# Product Requirements Document (PRD)

## 1. Product Summary

VisionBoard is a guided, iterative vision-board application that blends:

- **Deep journaling-first onboarding** that guides users through their goals, values, and aspirations
- **AI image generation** (via xAI) for vivid, personalized visuals
- **A freeform canvas editor** (FigJam-style) for direct manipulation
- **Structured prompting** that turns vague desires into concrete representations
- **Evidence-informed psychology** framed as intention-setting and behavior design

The product differentiates by making the **journal the source of truth** — a 10-minute guided reflection creates a rich profile that automatically generates a personalized vision board.

## 2. Problem and Opportunity

### 2.1 User Problems

- People can imagine a desired future but struggle to articulate it precisely
- Traditional vision boards are static artifacts, not living systems
- AI generation is powerful but prompt iteration is frustrating without structure
- Inspiration does not reliably convert into consistent weekly action

### 2.2 Opportunity

Create a "living board" where:

- **Journaling drives creation** — structured prompts extract goals, values, and obstacles
- The board is easy to build and even easier to iterate
- Each visual can carry action plans and feedback loops
- Reviews make the board evolve as reality changes

## 3. Target Users

### 3.1 Primary Personas

1. **Growth-oriented planner**
   - Wants progress across career/health/relationships/finances
   - Needs structure and follow-through

2. **Creative mood-board builder**
   - Cares about aesthetic coherence
   - Wants fast iteration via canvas and generation

3. **Reflective journaler**
   - Uses writing to clarify intent
   - Wants prompts, retrospectives, and meaning

## 4. Product Principles

1. **Journal-first creation** — The journal is the source; the board is the visualization
2. **Dreamy, minimal, authentic** — Immaculate vibes with artistic cohesion
3. **Progressive disclosure** — Novices see simple flows; power users access advanced controls
4. **Low shame** — Reviews focus on learning and redesign, not failure
5. **User agency** — The user can override any AI suggestion
6. **Private by default** — Local storage, no accounts required (MVP)

## 5. Design Direction

### 5.1 Visual Aesthetic

- **Theme**: Light mode with customizable canvas backgrounds
- **Mood**: Dreamy, minimal, authentic
- **Typography**: Serif-heavy, artistic, cohesive typeface combinations
- **Canvas feel**: FigJam-style freeform with personal goal-setting focus

### 5.2 Onboarding Experience

- **Guided meditation feel** — slow, immersive, intentional
- **~10 minute ritual** covering all psychological techniques
- **Dynamic prompts** that adapt based on responses
- **Creates comprehensive user profile** for board generation

### 5.3 Canvas Backgrounds

- Solid colors
- Gradients
- Textures
- User-uploaded images

## 6. Evidence-Informed Psychology Loops

These techniques are woven into the journaling prompts and optionally attached to board clusters:

### 6.1 Goal Clarity + Feedback
- Make goals specific (definition of done)
- UI: "Make it measurable" suggestions, progress tracking

### 6.2 If–Then Planning (Implementation Intentions)
- Convert intentions into trigger + response
- UI: "If" chips (time/place/cue), "Then" chips (micro-action)

### 6.3 Mental Contrasting (Vision + Obstacle + Plan)
- Pair desired future with likely obstacles, then design the plan
- UI: Obstacle awareness in journal, linked plans on board

### 6.4 Autonomy, Competence, Relatedness
- Encourage self-endorsed goals, mastery progress
- UI: Values tagging, "minimum viable action"

### 6.5 Habit Design
- Promote cue stability, realistic time horizons
- UI: Cue inventory, context awareness

### 6.6 Planning Fallacy Guardrails
- Encourage "outside view" estimates
- UI: "Past similar effort" prompts, scope warnings

### 6.7 Self-Compassion Protocols
- When user falls off, guide a reset
- UI: Recovery prompts, gentle re-entry steps

## 7. Goals and Non-Goals

### 7.1 Product Goals

- Complete guided journal in **~10 minutes**
- Automatically generate personalized board from journal
- Freeform canvas editing (add, remove, move, resize)
- Support user photo uploads alongside AI generation
- Export to PNG and video (TikTok-style)
- Local storage with multiple journals/boards

### 7.2 Non-Goals (MVP)

- No user accounts/authentication
- No claims of guaranteed outcomes
- No team collaboration
- No marketplace
- No mobile app (web-first)

## 8. Core User Journeys

### 8.1 First-Session: Guided Journal Ritual (~10 min)

1. **Welcome** — Set the tone (dreamy, intentional)
2. **Year framing** — "How do you want 2026 to feel?"
3. **Life areas scan** — Career, health, relationships, finances, creativity, growth
4. **Values exploration** — "What matters most to you?"
5. **Identity prompts** — "Who do you want to become?"
6. **Obstacle awareness** — "What's gotten in your way before?"
7. **Specificity pass** — Refine vague answers into concrete visions
8. **Summary** — Review profile, ready for board generation

### 8.2 Board Generation

1. AI reads journal → generates board structure
2. Creates image prompts for each theme/goal
3. Generates 6-12 starter images (photorealistic default, style options available)
4. Arranges on freeform canvas
5. User reviews and provides feedback
6. Iterates: regenerate, edit, add, remove, move, resize

### 8.3 Canvas Editing

- **Freeform placement** — drag anywhere on infinite canvas
- **Resize and rotate** — handles on selection
- **Layer management** — bring forward/back
- **Add elements** — generate new images, upload photos, add text
- **Style controls** — background options, image filters
- **Group and lock** — organize clusters

### 8.4 Iteration via Prompt + UI

- Select image → "Make it warmer, more morning light"
- Select cluster → "Unify style across these"
- Natural language edits via AI
- Direct canvas manipulation

### 8.5 Export

- **PNG** — high-resolution board export
- **Video** — TikTok-style slideshow with transitions
- **Future**: Image-to-video AI generation

### 8.6 Return Visits

- Continue existing journal
- Create new journal/board
- Edit existing boards
- Review and reflect

## 9. Feature Requirements

### 9.1 Journaling System

- Dynamic prompt engine with psychological techniques
- Adaptive follow-up questions
- Save/continue capability
- Multiple journals per user
- Journal-to-board data pipeline

### 9.2 Board Generation

- Automatic board structure from journal analysis
- AI image generation via xAI
- Style options: photorealistic, illustrated, abstract, watercolor
- Phrase/text generation for affirmations

### 9.3 Canvas Editor (FigJam-style)

- Infinite canvas with zoom/pan
- Drag, resize, rotate with snap
- Layers (bring forward/back)
- Group and lock
- Text elements (serif fonts, artistic styles)
- Selection and multi-select
- Undo/redo (minimum 50 operations)

### 9.4 Image Management

- AI generation with prompt history
- User photo uploads
- Regenerate with style/mood modifiers
- Crop and mask (rounded rect, circle)

### 9.5 Backgrounds

- Solid colors (curated palette)
- Gradients (linear, radial)
- Textures (paper, fabric, abstract)
- User-uploaded backgrounds

### 9.6 Export

- PNG (full board, selection)
- Video export (slideshow with transitions)
- Wallpaper crops (phone dimensions)

### 9.7 Storage

- LocalStorage/IndexedDB for persistence
- Multiple boards support
- Version snapshots (auto-save)

## 10. MVP Scope

### Must-Have

- [ ] Guided journal onboarding (~10 min ritual)
- [ ] Journal persistence (save/continue)
- [ ] AI board generation from journal (xAI)
- [ ] Freeform canvas editor
- [ ] Drag, resize, rotate, layers
- [ ] AI image regeneration with style controls
- [ ] User photo uploads
- [ ] Text elements
- [ ] Canvas backgrounds (colors, gradients)
- [ ] PNG export
- [ ] Local storage (multiple boards)
- [ ] Undo/redo

### Nice-to-Have (Post-MVP)

- [ ] Video export (slideshow)
- [ ] Image-to-video AI
- [ ] Texture backgrounds
- [ ] If-then plan cards
- [ ] Weekly review flow
- [ ] User accounts and cloud sync
- [ ] Mobile optimization

## 11. Technical Architecture

### 11.1 Stack

- **Framework**: Next.js 14+ (App Router)
- **AI**: Vercel AI SDK + xAI API
- **Canvas**: React with custom canvas implementation or fabric.js
- **Storage**: IndexedDB via Dexie.js
- **Styling**: Tailwind CSS + custom design system
- **Animations**: Framer Motion

### 11.2 Key Components

```
app/
├── page.tsx                 # Landing/home
├── journal/
│   └── page.tsx            # Guided journal flow
├── board/
│   └── [id]/page.tsx       # Canvas editor
├── api/
│   ├── generate-board/     # Board generation from journal
│   ├── generate-image/     # xAI image generation
│   └── chat/               # Journal conversation
components/
├── journal/
│   ├── JournalFlow.tsx     # Main journal orchestrator
│   ├── PromptCard.tsx      # Individual prompt UI
│   └── ProgressIndicator.tsx
├── canvas/
│   ├── Canvas.tsx          # Main canvas component
│   ├── CanvasElement.tsx   # Draggable element
│   ├── Toolbar.tsx         # Tools and controls
│   └── Inspector.tsx       # Element properties
├── ui/
│   └── [shared components]
lib/
├── journal/
│   ├── prompts.ts          # Prompt definitions
│   └── analysis.ts         # Journal analysis for board gen
├── canvas/
│   └── operations.ts       # Canvas operations
├── storage/
│   └── db.ts               # IndexedDB setup
└── ai/
    └── xai.ts              # xAI integration
```

## 12. Data Model

### Journal
```typescript
interface Journal {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  responses: JournalResponse[]
  profile: UserProfile // Generated from responses
  boardId?: string
}

interface JournalResponse {
  promptId: string
  question: string
  answer: string
  timestamp: Date
}

interface UserProfile {
  yearTheme: string
  values: string[]
  lifeAreas: LifeAreaGoal[]
  identity: string[]
  obstacles: string[]
  feelings: string[]
}
```

### Board
```typescript
interface Board {
  id: string
  journalId: string
  title: string
  createdAt: Date
  updatedAt: Date
  canvas: CanvasState
  versions: BoardVersion[]
}

interface CanvasState {
  background: Background
  elements: CanvasElement[]
  viewport: { x: number, y: number, zoom: number }
}

interface CanvasElement {
  id: string
  type: 'image' | 'text' | 'shape'
  position: { x: number, y: number }
  size: { width: number, height: number }
  rotation: number
  layer: number
  locked: boolean
  data: ImageData | TextData | ShapeData
}

interface ImageData {
  src: string
  prompt?: string
  isGenerated: boolean
  style?: string
}
```

## 13. Metrics (Future)

- Time to complete journal
- Board generation success rate
- Canvas interactions per session
- Export completion rate
- Return visit rate
- Elements per board

## 14. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| xAI rate limits | Queue system, generation indicators |
| Large canvas performance | Virtualization, lazy loading |
| Local storage limits | Compression, cleanup prompts |
| Journal feels too long | Progress indicator, save/continue |
| Generated images miss the mark | Easy regeneration, style controls |

## 15. Design References

- **Canvas**: FigJam, Miro, Apple Freeform
- **Aesthetic**: Editorial design, serif typography, dreamy photography
- **Onboarding**: Calm app, guided meditation experiences
- **Vision boards**: Pinterest, traditional collage aesthetics

## 16. Epics

### Epic 1: Journaling Flow
- Guided prompt system
- Dynamic follow-ups
- Save/continue
- Profile generation

### Epic 2: Board Generation
- Journal analysis
- xAI integration
- Image generation
- Layout algorithm

### Epic 3: Canvas Editor
- Freeform canvas
- Element manipulation
- Tools and inspector
- Backgrounds

### Epic 4: Image Management
- Upload support
- Regeneration
- Style controls
- Prompt history

### Epic 5: Export & Storage
- PNG export
- Video export
- IndexedDB persistence
- Multi-board management
