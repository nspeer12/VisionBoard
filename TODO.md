# VisionBoard - Development TODO

## Current Sprint: MVP Foundation

### Phase 1: Project Setup ✅
- [x] Initialize Next.js project with App Router
- [x] Configure Tailwind CSS with custom design tokens
- [x] Set up xAI API integration
- [x] Configure IndexedDB with Dexie.js
- [x] Create base component library

### Phase 2: Journaling Flow ✅
- [x] Design prompt system architecture
- [x] Create JournalFlow orchestrator component
- [x] Implement PromptCard with animations
- [x] Build progress indicator
- [x] Add save/continue functionality
- [x] Create journal storage layer
- [x] Implement profile generation from responses

### Phase 3: Board Generation ✅
- [x] Build journal analysis pipeline
- [x] Create board structure algorithm
- [x] Integrate xAI image generation
- [x] Implement generation queue with progress
- [x] Auto-layout generated elements

### Phase 4: Canvas Editor ✅
- [x] Implement infinite canvas with pan/zoom
- [x] Create draggable element component
- [x] Add resize handles
- [ ] Implement rotation (partial)
- [x] Build layer management
- [x] Create selection system (single + multi)
- [x] Add undo/redo system
- [x] Build toolbar UI
- [x] Create inspector panel

### Phase 5: Image Management ✅
- [x] Photo upload with preview
- [x] Image regeneration UI
- [x] Style/mood modifier chips
- [ ] Prompt history panel
- [ ] Crop and mask tools

### Phase 6: Backgrounds & Styling ✅
- [x] Color picker for backgrounds
- [x] Gradient editor
- [ ] Texture presets
- [ ] Background image upload

### Phase 7: Text & Elements ✅
- [x] Text element creation
- [x] Font selection (serif focus)
- [x] Text styling controls
- [ ] Basic shapes

### Phase 8: Export (In Progress)
- [ ] PNG export (full board)
- [ ] PNG export (selection)
- [ ] Phone wallpaper crops

### Phase 9: Polish
- [x] Onboarding animations
- [x] Loading states
- [ ] Error handling
- [ ] Empty states
- [x] Keyboard shortcuts

---

## Post-MVP Backlog

### Video Export
- [ ] Slideshow generation
- [ ] Transition effects
- [ ] Music/audio option
- [ ] Image-to-video AI integration

### Review System
- [ ] Weekly review flow
- [ ] If-then plan cards
- [ ] Progress tracking
- [ ] Reflection prompts

### User Accounts
- [ ] Authentication (Supabase?)
- [ ] Cloud sync
- [ ] Cross-device access

### Mobile
- [ ] Responsive canvas
- [ ] Touch gestures
- [ ] Mobile-optimized journal

---

## Design System

### Typography
- Primary: Serif (editorial feel)
- Secondary: Sans-serif (UI elements)
- Accent: Display/decorative

### Colors
- Background: Warm whites, creams
- Accent: To be determined
- Canvas defaults: Curated palette

### Motion
- Entrance: Fade + slight rise
- Transitions: Ease-out, ~300ms
- Canvas: Smooth pan/zoom
