var Game = {};

Game.Config = {
  // Logical game resolution
  WIDTH: 1344,
  HEIGHT: 1038,

  // Layout regions (y-coordinates)
  VIEWPORT_TOP: 0,
  VIEWPORT_HEIGHT: 768,
  ACTION_LINE_Y: 768,
  ACTION_LINE_HEIGHT: 46,
  BOTTOM_BAR_Y: 814,
  BOTTOM_BAR_HEIGHT: 224,

  // Verb panel (bottom-left)
  VERB_PANEL_X: 0,
  VERB_PANEL_WIDTH: 563,

  // Inventory panel (bottom-right)
  INVENTORY_X: 563,
  INVENTORY_WIDTH: 781,

  // Inventory item size
  ITEM_THUMB_SIZE: 98,
  ITEM_PADDING: 8,
  ITEM_PADDING_X: 17,
  INVENTORY_COLS: 6,
  INVENTORY_ROWS: 2,

  // Player
  PLAYER_SPEED: 400, // pixels per second
  PLAYER_WIDTH: 64,
  PLAYER_HEIGHT: 128,

  // Text
  FONT_FAMILY: '"Segoe UI", Arial, sans-serif',
  FONT_SIZE: 22,
  DIALOGUE_FONT_SIZE: 24,

  // Colors — Amazon brand palette
  // #131A22 Cool Black · #232F3E Ebony Clay · #37475A Space
  // #FF9900 Amazon Orange · #FEBD69 Orange Hint
  COLORS: {
    BG: '#131A22',
    VIEWPORT_BG: '#232F3E',
    ACTION_LINE_BG: '#0F1111',
    ACTION_LINE_TEXT: '#ffffff',
    BOTTOM_BAR_BG: '#232F3E',
    VERB_NORMAL: '#cccccc',
    VERB_HOVER: '#FF9900',
    VERB_ACTIVE: '#FEBD69',
    INVENTORY_BG: '#131A22',
    INVENTORY_BORDER: '#37475A',
    HOTSPOT_DEBUG: 'rgba(0, 255, 0, 0.3)',
    WALKAREA_DEBUG: 'rgba(0, 0, 255, 0.2)',
    PLAYER: '#FF9900',
    TEXT_DEFAULT: '#ffffff',
    TEXT_NPC: '#FEBD69',
    TEXT_PLAYER_CHOICE: '#FF9900',
    DIALOGUE_BG: 'rgba(19, 26, 34, 0.92)',
    SAVE_MENU_BG: 'rgba(35, 47, 62, 0.97)',
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
