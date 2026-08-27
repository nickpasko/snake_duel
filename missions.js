// Mission and opponent-script data for Single Player mode.
// Loaded before game.js — pure data, no DOM/state access here.

const MISSION_STORAGE_KEY = "snakeDuelMissionProgress"; // distinct from game.js's LANG_STORAGE_KEY

// Coordinates below use the same [row, col] scheme as the in-game rule editor's
// 7x7 pattern grid (VIEW_SIZE=7, center=[3,3]=own head, row decreases = ahead,
// col decreases = left, col increases = right).
const AHEAD = [2, 3];
const AHEAD_LEFT1 = [2, 2];
const AHEAD_RIGHT1 = [2, 4];
const LEFT1 = [3, 2];
const RIGHT1 = [3, 4];

function buildOpponentPattern(cells) {
  const size = 7;
  const center = 3;
  const grid = [];
  for (let row = 0; row < size; row += 1) {
    const r = [];
    for (let col = 0; col < size; col += 1) {
      r.push(row === center && col === center ? "head" : "any");
    }
    grid.push(r);
  }
  for (const [row, col, value] of cells) {
    grid[row][col] = value;
  }
  return grid;
}

function opponentRule(name, action, cells) {
  return { name, action, pattern: buildOpponentPattern(cells) };
}

const OPPONENT_SCRIPTS = {
  // Difficulty 1: food-seeking only, no self-preservation beyond the outer wall. Easy to outlast.
  opponent1: {
    name: "Forager",
    rules: [
      opponentRule("Wall ahead", "left", [[...AHEAD, "wall"]]),
      opponentRule("Food left", "left", [[...LEFT1, "food"]]),
      opponentRule("Food right", "right", [[...RIGHT1, "food"]]),
      opponentRule("Food ahead-left", "left", [[...AHEAD_LEFT1, "food"]]),
      opponentRule("Food ahead-right", "right", [[...AHEAD_RIGHT1, "food"]])
    ]
  },
  // Difficulty 2: adds self-collision avoidance before food-seeking. Still no enemy-awareness.
  opponent2: {
    name: "Cautious",
    rules: [
      opponentRule("Wall ahead", "left", [[...AHEAD, "wall"]]),
      opponentRule("Self ahead", "left", [[...AHEAD, "self"]]),
      opponentRule("Self ahead-left", "right", [[...AHEAD_LEFT1, "self"]]),
      opponentRule("Self ahead-right", "left", [[...AHEAD_RIGHT1, "self"]]),
      opponentRule("Food left", "left", [[...LEFT1, "food"]]),
      opponentRule("Food right", "right", [[...RIGHT1, "food"]]),
      opponentRule("Food ahead-left", "left", [[...AHEAD_LEFT1, "food"]]),
      opponentRule("Food ahead-right", "right", [[...AHEAD_RIGHT1, "food"]])
    ]
  },
  // Difficulty 3: adds aggression — bites an adjacent enemy body segment before seeking food.
  opponent3: {
    name: "Hunter",
    rules: [
      opponentRule("Wall ahead", "left", [[...AHEAD, "wall"]]),
      opponentRule("Self ahead", "left", [[...AHEAD, "self"]]),
      opponentRule("Self ahead-left", "right", [[...AHEAD_LEFT1, "self"]]),
      opponentRule("Self ahead-right", "left", [[...AHEAD_RIGHT1, "self"]]),
      opponentRule("Enemy left", "left", [[...LEFT1, "enemy"]]),
      opponentRule("Enemy right", "right", [[...RIGHT1, "enemy"]]),
      opponentRule("Enemy ahead", "straight", [[...AHEAD, "enemy"]]),
      opponentRule("Food left", "left", [[...LEFT1, "food"]]),
      opponentRule("Food right", "right", [[...RIGHT1, "food"]]),
      opponentRule("Food ahead-left", "left", [[...AHEAD_LEFT1, "food"]]),
      opponentRule("Food ahead-right", "right", [[...AHEAD_RIGHT1, "food"]])
    ]
  },
  // Difficulty 4: defensive — actively steers away from the enemy head (avoids mutual head-on death),
  // stronger self/wall avoidance, food-seeking as filler. Outlasts rather than attacks.
  opponent4: {
    name: "Evader",
    rules: [
      opponentRule("Wall ahead", "left", [[...AHEAD, "wall"]]),
      opponentRule("Self ahead", "left", [[...AHEAD, "self"]]),
      opponentRule("Self ahead-left", "right", [[...AHEAD_LEFT1, "self"]]),
      opponentRule("Self ahead-right", "left", [[...AHEAD_RIGHT1, "self"]]),
      opponentRule("Enemy head ahead", "left", [[...AHEAD, "enemyHead"]]),
      opponentRule("Enemy head left", "right", [[...LEFT1, "enemyHead"]]),
      opponentRule("Enemy head right", "left", [[...RIGHT1, "enemyHead"]]),
      opponentRule("Enemy head ahead-left", "right", [[...AHEAD_LEFT1, "enemyHead"]]),
      opponentRule("Enemy head ahead-right", "left", [[...AHEAD_RIGHT1, "enemyHead"]]),
      opponentRule("Food left", "left", [[...LEFT1, "food"]]),
      opponentRule("Food right", "right", [[...RIGHT1, "food"]]),
      opponentRule("Food ahead-left", "left", [[...AHEAD_LEFT1, "food"]]),
      opponentRule("Food ahead-right", "right", [[...AHEAD_RIGHT1, "food"]])
    ]
  },
  // Difficulty 5: the union of Hunter's safe aggression and Evader's caution — avoids every hazard
  // first, bites the enemy body only when it's not a head-on risk, eats food as lowest priority.
  opponent5: {
    name: "Expert",
    rules: [
      opponentRule("Wall ahead", "left", [[...AHEAD, "wall"]]),
      opponentRule("Self ahead", "left", [[...AHEAD, "self"]]),
      opponentRule("Self ahead-left", "right", [[...AHEAD_LEFT1, "self"]]),
      opponentRule("Self ahead-right", "left", [[...AHEAD_RIGHT1, "self"]]),
      opponentRule("Enemy head ahead", "left", [[...AHEAD, "enemyHead"]]),
      opponentRule("Enemy head left", "right", [[...LEFT1, "enemyHead"]]),
      opponentRule("Enemy head right", "left", [[...RIGHT1, "enemyHead"]]),
      opponentRule("Enemy left", "left", [[...LEFT1, "enemy"]]),
      opponentRule("Enemy right", "right", [[...RIGHT1, "enemy"]]),
      opponentRule("Enemy ahead", "straight", [[...AHEAD, "enemy"]]),
      opponentRule("Food left", "left", [[...LEFT1, "food"]]),
      opponentRule("Food right", "right", [[...RIGHT1, "food"]]),
      opponentRule("Food ahead-left", "left", [[...AHEAD_LEFT1, "food"]]),
      opponentRule("Food ahead-right", "right", [[...AHEAD_RIGHT1, "food"]])
    ]
  }
};

const MISSIONS = [
  { id: "m1", type: "survive", durationMs: 20000, opponent: null },
  { id: "m2", type: "growTo", targetLength: 10, opponent: null, untimed: true },
  { id: "m3", type: "growTo", targetLength: 30, opponent: null, untimed: true },
  { id: "m4", type: "duel", opponent: "opponent1" },
  { id: "m5", type: "duel", opponent: "opponent2" },
  { id: "m6", type: "duel", opponent: "opponent3" },
  { id: "m7", type: "duel", opponent: "opponent4" },
  { id: "m8", type: "duel", opponent: "opponent5" }
];
