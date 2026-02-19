var Game = {};

Game.Config = {
  // Logical game resolution
  WIDTH: 1344,
  HEIGHT: 1038,

  // Layout regions (y-coordinates)
  VIEWPORT_TOP: 0,
  VIEWPORT_HEIGHT: 768,
  ACTION_LINE_Y: 768,
  ACTION_LINE_HEIGHT: 30,
  BOTTOM_BAR_Y: 798,
  BOTTOM_BAR_HEIGHT: 240,

  // Verb panel (bottom-left)
  VERB_PANEL_X: 0,
  VERB_PANEL_WIDTH: 448,

  // Inventory panel (bottom-right)
  INVENTORY_X: 448,
  INVENTORY_WIDTH: 896,

  // Inventory item size
  ITEM_THUMB_SIZE: 72,
  ITEM_PADDING: 8,
  INVENTORY_COLS: 11,
  INVENTORY_ROWS: 2,

  // Player
  PLAYER_SPEED: 400, // pixels per second
  PLAYER_WIDTH: 64,
  PLAYER_HEIGHT: 128,

  // Text
  FONT_FAMILY: '"Segoe UI", Arial, sans-serif',
  FONT_SIZE: 22,
  DIALOGUE_FONT_SIZE: 24,

  // Colors
  COLORS: {
    BG: '#1a1a2e',
    VIEWPORT_BG: '#2a2a3e',
    ACTION_LINE_BG: '#16213e',
    ACTION_LINE_TEXT: '#e0e0e0',
    BOTTOM_BAR_BG: '#0f3460',
    VERB_NORMAL: '#e0e0e0',
    VERB_HOVER: '#ffdd57',
    VERB_ACTIVE: '#ff6b6b',
    INVENTORY_BG: '#1a1a2e',
    INVENTORY_BORDER: '#333366',
    HOTSPOT_DEBUG: 'rgba(0, 255, 0, 0.3)',
    WALKAREA_DEBUG: 'rgba(0, 0, 255, 0.2)',
    PLAYER: '#e94560',
    TEXT_DEFAULT: '#ffffff',
    TEXT_NPC: '#7ec8e3',
    TEXT_PLAYER_CHOICE: '#ffdd57',
    DIALOGUE_BG: 'rgba(0, 0, 0, 0.85)',
    SAVE_MENU_BG: 'rgba(15, 52, 96, 0.95)',
    FADE: '#000000',
  },

  // Verbs
  VERBS: [
    'Open',    'Close',  'Push',
    'Pull',    'Give',   'Pick up',
    'Talk to', 'Look at','Use'
  ],

  DEFAULT_VERB: 'Walk to',

  // Two-object verbs (need "with" / "to" preposition)
  TWO_OBJECT_VERBS: {
    'Use': 'with',
    'Give': 'to',
  },

  // Debug
  DEBUG: false,
};
