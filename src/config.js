// ─────────────────────────────────────────────────────────────
//  Settings — this is the only file you normally need to edit.
// ─────────────────────────────────────────────────────────────

// From Supabase: Project Settings > API (or the Connect button).
// The URL is just the project address, with nothing after ".supabase.co".
export const SUPABASE_URL = "https://uvbrkotsytciplajbomh.supabase.co";

// The publishable (anon) key. It is safe to have this in public code:
// the database's RLS policy only allows reading.
export const SUPABASE_KEY = "sb_publishable_-pDh2Sx3Ewt0OgOfkoPfpQ_ROhg8rcE";

// Name of the table to read from.
export const TABLE = "exercises";

// Text shown on the page.
export const SITE_TITLE = "Exercise library";
export const SITE_INTRO =
    "Search by number, name, body part, equipment, source or anything in the instructions.";

// Which list columns get a row of filter buttons, in this order.
// Possible keys: region, body_part, type, equipment, area
export const FILTERS = [
    { key: "body_part", label: "Body part" },
    { key: "position", label: "Position" },
    { key: "area", label: "Area" },
];
// Table view: columns not shown, and columns moved to come straight after "number"
// (in this order). All other database columns follow in their database order.
export const TABLE_HIDDEN = ["name", "created_at"];
export const TABLE_AFTER_NUMBER = ["image_url", "instructions", "comment"];

// Columns whose tick-box filter has a choice of how the ticks are used (Only / Exactly / Any;
// see MODES in search.js). A value like "Mat/Bed" counts as either item.
//   mode:   the mode the filter starts in
//   ignore: values that never hide an exercise in "Only these" mode (e.g. "None")
//   onlyLabel: a clearer name for "Only these" in this column
//   emptyOk: an exercise with nothing filled in shows in "Only these" (no equipment = needs nothing)
export const TABLE_MATCH_ALL = {
    equipment: { mode: "have", ignore: ["None"], onlyLabel: "I have these", emptyOk: true },
    body_part: { mode: "any", ignore: [] },
};

// A column whose cell also shows a second column's values, as lighter "also involved" tags.
// Its filter gets a tick box to count those too.
export const TABLE_SECONDARY = { body_part: "body_part_other" };
export const SECONDARY_LABELS = { body_part: "Also count other body parts" };

// Small coloured tags shown when an exercise is opened.
export const TAG_COLUMNS = ["region", "type", "equipment", "area"];

// Colour names you can use below. You can also write any colour code directly, e.g. "#C0392B".
export const PALETTE = {
    // reds and pinks
    red: "#D64545",
    crimson: "#B0233F",
    coral: "#F07C6C",
    rose: "#E8708F",
    pink: "#D14D8B",
    magenta: "#C03BB0",
    // oranges and yellows
    orange: "#E07B39",
    peach: "#F2A877",
    amber: "#D9A21B",
    gold: "#C9A227",
    yellow: "#F2D02E",
    // greens
    lime: "#8DB33A",
    olive: "#7F8A2E",
    green: "#3E9A5B",
    forest: "#2A6B3F",
    mint: "#5CC8A0",
    // blues
    teal: "#1D8A8A",
    cyan: "#2DB5C8",
    sky: "#3A9AD9",
    blue: "#3B6FD6",
    navy: "#2B3F8C",
    // purples
    indigo: "#5B5BD6",
    violet: "#7A4FE0",
    purple: "#8E4FC9",
    lavender: "#A98BDB",
    plum: "#7D3C6B",
    // neutrals
    brown: "#8B6A4E",
    tan: "#C2A27C",
    grey: "#7A8A90",
    slate: "#4E5D6C",
    black: "#2B2B2B",
};

// Colour of each list value. Values left out get a plain grey tag.
// Body part and equipment colours are switched off for now: remove the /* and */ around them to use them.
export const COLOURS = {
    region: { "Upper body": "red", "Lower body": "blue", "Torso": "orange" },
    /* body_part: {
        // upper body
        "Shoulder": "orange",
        "Elbow": "lime",
        "Wrist": "sky",
        "Hand": "purple",
        // torso
        "Neck": "amber",
        "Upper back": "orange",
        "Lower back": "brown",
        "Chest": "red",
        "Abdomen": "amber",
        // lower body
        "Hip": "green",
        "Knee": "lime",
        "Ankle": "teal",
        "Foot": "grey",
    }, */
    type: { "Strength": "red", "Stretch": "yellow", "Mobility": "blue", "Balance": "green" },
    /* equipment: {
        "None": "grey",
        "Small ball": "orange",
        "Exercise ball": "orange",
        "Egg ball": "orange",
        "Stress ball": "orange",
        "Resistance band": "pink",
        "Mini band": "pink",
        "Dumbbell": "red",
        "Ankle weight": "red",
        "Chair": "brown",
        "Step": "brown",
        "Foam roller": "sky",
        "Foam bar": "sky",
        "Yoga block": "purple",
        "Wooden stick": "amber",
        "Wand": "amber",
        "Dynair": "teal",
        "Bosu": "teal",
        "Balance pad": "teal",
    }, */
    area: {
        "Cardiology": "red",
        "Rheumatology": "magenta",
        "Orthopaedics": "blue",
        "Neurology": "yellow",
        "Pulmonology": "sky",
        "Geriatrics": "brown",
        "Sports": "green",
    },
};

// Search words meaning "or" and "and". Accents are ignored, so "es" also covers "és".
export const OR_WORDS = ["or", "vagy", "|"];
export const AND_WORDS = ["and", "es", "&"];