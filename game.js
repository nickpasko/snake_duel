const GRID_SIZE = 11;
const VIEW_SIZE = 7;
const VIEW_CENTER = Math.floor(VIEW_SIZE / 2);
const BATTLE_DURATION_MS = 120000; // 2 minutes
const TICK_MS = 350;
const FOOD_LIFETIME_MS = 20000; // Food expires after 20 seconds
const MAX_EVENT_LOG_ENTRIES = 80; // Keep enough context without letting the log grow indefinitely.
const CELL_TYPES = ["any", "empty", "self", "enemy", "enemyHead", "food", "wall"];
const TURN_ORDER = ["up", "right", "down", "left"];
const DIRECTION_DELTAS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
const SNAKE_KEYS = ["snakeA", "snakeB"];

const LAST_RULE_NONE = "__none__";
const LAST_RULE_DEAD = "__dead__";
const LAST_RULE_DEFAULT = "__default__";
const LANG_STORAGE_KEY = "snakeDuelLang";

const SCREENS = ["menu", "missionSelect", "missionPlay", "duel"];
let currentScreen = "menu";

const STRINGS = {
  en: {
    pageTitle: "Snake Duel Arena",
    heroTitle: "Snake Duel Arena",
    heroText: "You do not steer the snakes directly. Instead, you author their instincts: each snake scans a 5×5 view around its head, matches the first visual rule, and turns left, right, or continues straight.",
    languageLabel: "Language",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    step: "Step",
    timerLabel: "Timer",
    statusLabel: "Status",
    lengthALabel: "Snake A length",
    lengthBLabel: "Snake B length",
    lastRuleALabel: "Snake A last rule",
    lastRuleBLabel: "Snake B last rule",
    battleResultLabel: "Battle result",
    arenaAriaLabel: "Snake duel arena",
    addRule: "Add rule",
    saveScript: "Save script",
    loadScript: "Load script",
    scriptNameAriaA: "Script name for Snake A",
    scriptNameAriaB: "Script name for Snake B",
    actionLabelText: "Action",
    firstMatchWins: "First matching rule wins.",
    noRulesYet: "No rules yet. Add one to define this snake's instincts.",
    battleLogHeading: "Battle log",
    battleLogHelper: "The event log explains which rule fired, when food was eaten, who bit whom, and how the duel ended.",
    noEventsYet: "No events yet.",
    unnamedRule: "Unnamed rule",
    ruleWord: "rule",
    deleteRule: "Delete",
    ruleNameAria: ({ label }) => `${label} rule name`,
    actionAria: ({ label }) => `${label} rule action`,
    snakeLabel: { snakeA: "Snake A", snakeB: "Snake B" },
    legend: {
      any: "ANY",
      empty: "EMPTY",
      self: "SELF",
      enemy: "ENEMY",
      enemyHead: "ENEMY HEAD",
      food: "FOOD",
      wall: "WALL",
      head: "HEAD (fixed center)"
    },
    pattern: {
      any: "ANY",
      empty: "EMP",
      self: "SELF",
      enemy: "ENMY",
      enemyHead: "EHEAD",
      food: "FOOD",
      wall: "WALL",
      head: "HEAD"
    },
    action: { left: "left", straight: "straight", right: "right" },
    status: { paused: "paused", running: "running", finished: "finished" },
    lastRuleNone: "—",
    lastRuleDead: "dead",
    lastRuleDefault: "default straight",
    demoRuleTurnFoodLeft: ({ label }) => `${label}: turn to food on the left`,
    demoRuleTurnFoodRight: ({ label }) => `${label}: turn to food on the right`,
    demoRuleAvoidWall: ({ label }) => `${label}: avoid wall ahead`,
    menu: {
      chooseMode: "Choose your mode",
      multiplayerDuel: "Multiplayer Duel",
      multiplayerDescription: "Write two rule sets and watch them fight.",
      singlePlayer: "Single Player",
      singlePlayerDescription: "Climb a ladder of 8 missions.",
      backToMenu: "Back to menu"
    },
    missionSelect: {
      heading: "Missions",
      locked: "Locked",
      completed: "Completed",
      selectToPlay: "Select a mission to play"
    },
    missions: {
      m1: { name: "Survive", description: "Survive alone on the grid for 20 seconds.", objective: "Stay alive for 20 seconds." },
      m2: { name: "Grow to 10", description: "Eat food and grow your snake to length 10.", objective: "Reach length 10." },
      m3: { name: "Grow to 30", description: "Eat food and grow your snake to length 30.", objective: "Reach length 30." },
      m4: { name: "First Duel", description: "Defeat Forager, a food-seeking opponent.", objective: "Win the duel." },
      m5: { name: "Careful Opponent", description: "Defeat Cautious, who avoids walls and itself.", objective: "Win the duel." },
      m6: { name: "The Hunter", description: "Defeat Hunter, an aggressive attacker.", objective: "Win the duel." },
      m7: { name: "The Evader", description: "Defeat Evader, a defensive survivor.", objective: "Win the duel." },
      m8: { name: "The Expert", description: "Defeat Expert, a well-rounded opponent.", objective: "Win the duel." }
    },
    missionPlay: {
      backToMissions: "Back to missions",
      winBanner: ({ missionName }) => `Mission complete: ${missionName}!`,
      loseBanner: () => "Mission failed. Try again?",
      retry: "Retry",
      nextMission: "Next mission",
      backToMenuButton: "Back to menu",
      yourSnakeLabel: "Your snake",
      opponentLabel: "Opponent snake",
      yourSnakeLengthLabel: "Your snake length",
      opponentLengthLabel: "Opponent length",
      yourSnakeLastRuleLabel: "Your snake last rule",
      opponentLastRuleLabel: "Opponent last rule",
      scriptNameAriaYourSnake: "Script name for your snake"
    },
    resultMsgs: {
      inProgress: () => "In progress",
      winsAlive: ({ label }) => `${label} wins`,
      winsByLength: ({ label }) => `${label} wins by length`,
      draw: () => "Draw",
      winsByLastGreaterLength: ({ label }) => `${label} wins by last greater length`,
      missionWon: () => "Mission complete",
      missionLost: () => "Mission failed"
    },
    log: {
      reset: () => "Battle reset.",
      started: () => "Battle started.",
      pausedLog: () => "Battle paused.",
      ruleUsed: ({ label, ruleName, actionText }) => `${label} used rule: ${ruleName} → ${actionText}`,
      diedWall: ({ label }) => `${label} died by wall.`,
      diedSelfCollision: ({ label }) => `${label} died by self collision.`,
      diedBiteLengthDrop: ({ label }) => `${label} died: body length dropped below 2.`,
      headCollision: () => "snakes heads collided, both died",
      bite: ({ attackerLabel, enemyLabel, x, y }) => `${attackerLabel} bit ${enemyLabel} at (${x}, ${y}): ${attackerLabel} +1 length, ${enemyLabel} -1 segment.`,
      ateFood: ({ label }) => `${label} ate food.`,
      foodExpired: ({ x, y, seconds }) => `Food at (${x}, ${y}) expired after ${seconds}s.`,
      newFood: ({ x, y }) => `New food appeared at (${x}, ${y}).`,
      scriptSaved: ({ name }) => `Script "${name}" saved.`,
      scriptLoaded: ({ name, label }) => `Script "${name}" loaded into ${label}.`,
      battleFinishedGeneric: ({ resultText }) => `Battle finished. ${resultText}.`,
      battleFinishedTimeExpired: () => "Battle finished. Time expired.",
      battleFinishedPlain: () => "Battle finished.",
      missionStarted: ({ missionName }) => `Mission started: ${missionName}.`,
      missionCompleted: ({ missionName }) => `Mission completed: ${missionName}.`,
      missionFailed: ({ missionName }) => `Mission failed: ${missionName}.`
    }
  },
  ru: {
    pageTitle: "Арена дуэли змей",
    heroTitle: "Арена дуэли змей",
    heroText: "Вы не управляете змеями напрямую. Вместо этого вы задаёте их инстинкты: каждая змея сканирует область 5×5 вокруг своей головы, находит первое совпавшее правило и поворачивает налево, направо или продолжает двигаться прямо.",
    languageLabel: "Язык",
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    step: "Шаг",
    timerLabel: "Таймер",
    statusLabel: "Статус",
    lengthALabel: "Длина змеи A",
    lengthBLabel: "Длина змеи B",
    lastRuleALabel: "Последнее правило змеи A",
    lastRuleBLabel: "Последнее правило змеи B",
    battleResultLabel: "Результат боя",
    arenaAriaLabel: "Арена дуэли змей",
    addRule: "Добавить правило",
    saveScript: "Сохранить сценарий",
    loadScript: "Загрузить сценарий",
    scriptNameAriaA: "Название сценария для змеи A",
    scriptNameAriaB: "Название сценария для змеи B",
    actionLabelText: "Действие",
    firstMatchWins: "Побеждает первое совпавшее правило.",
    noRulesYet: "Правил пока нет. Добавьте хотя бы одно, чтобы задать инстинкты змеи.",
    battleLogHeading: "Журнал боя",
    battleLogHelper: "Журнал событий показывает, какое правило сработало, когда была съедена еда, кто кого укусил и чем закончилась дуэль.",
    noEventsYet: "Событий пока нет.",
    unnamedRule: "Безымянное правило",
    ruleWord: "правило",
    deleteRule: "Удалить",
    ruleNameAria: ({ label }) => `Название правила для ${label}`,
    actionAria: ({ label }) => `Действие правила для ${label}`,
    snakeLabel: { snakeA: "Змея A", snakeB: "Змея B" },
    legend: {
      any: "ЛЮБОЕ",
      empty: "ПУСТО",
      self: "СВОЯ",
      enemy: "ВРАГ",
      enemyHead: "ГОЛОВА ВРАГА",
      food: "ЕДА",
      wall: "СТЕНА",
      head: "ГОЛОВА (центр, фикс.)"
    },
    pattern: {
      any: "ЛЮБ",
      empty: "ПУСТ",
      self: "СВОЯ",
      enemy: "ВРАГ",
      enemyHead: "ГВР",
      food: "ЕДА",
      wall: "СТЕН",
      head: "ГОЛ"
    },
    action: { left: "налево", straight: "прямо", right: "направо" },
    status: { paused: "пауза", running: "идёт бой", finished: "завершено" },
    lastRuleNone: "—",
    lastRuleDead: "погибла",
    lastRuleDefault: "по умолчанию прямо",
    demoRuleTurnFoodLeft: ({ label }) => `${label}: поворот к еде слева`,
    demoRuleTurnFoodRight: ({ label }) => `${label}: поворот к еде справа`,
    demoRuleAvoidWall: ({ label }) => `${label}: избегать стены впереди`,
    menu: {
      chooseMode: "Выберите режим",
      multiplayerDuel: "Дуэль (два игрока)",
      multiplayerDescription: "Напишите два набора правил и наблюдайте за схваткой.",
      singlePlayer: "Одиночная игра",
      singlePlayerDescription: "Пройдите лестницу из 8 миссий.",
      backToMenu: "В главное меню"
    },
    missionSelect: {
      heading: "Миссии",
      locked: "Заблокировано",
      completed: "Пройдено",
      selectToPlay: "Выберите миссию"
    },
    missions: {
      m1: { name: "Выживание", description: "Продержитесь одна на поле 20 секунд.", objective: "Продержаться 20 секунд." },
      m2: { name: "Рост до 10", description: "Ешьте еду и вырастите змею до длины 10.", objective: "Достичь длины 10." },
      m3: { name: "Рост до 30", description: "Ешьте еду и вырастите змею до длины 30.", objective: "Достичь длины 30." },
      m4: { name: "Первая дуэль", description: "Победите Собирателя — противника, который ищет еду.", objective: "Победить в дуэли." },
      m5: { name: "Осторожный противник", description: "Победите Осторожного, избегающего стен и себя.", objective: "Победить в дуэли." },
      m6: { name: "Охотник", description: "Победите Охотника — агрессивного противника.", objective: "Победить в дуэли." },
      m7: { name: "Уклонист", description: "Победите Уклониста — защищающегося противника.", objective: "Победить в дуэли." },
      m8: { name: "Эксперт", description: "Победите Эксперта — разностороннего противника.", objective: "Победить в дуэли." }
    },
    missionPlay: {
      backToMissions: "К списку миссий",
      winBanner: ({ missionName }) => `Миссия пройдена: ${missionName}!`,
      loseBanner: () => "Миссия провалена. Повторить?",
      retry: "Повторить",
      nextMission: "Следующая миссия",
      backToMenuButton: "В главное меню",
      yourSnakeLabel: "Ваша змея",
      opponentLabel: "Змея противника",
      yourSnakeLengthLabel: "Длина вашей змеи",
      opponentLengthLabel: "Длина противника",
      yourSnakeLastRuleLabel: "Последнее правило вашей змеи",
      opponentLastRuleLabel: "Последнее правило противника",
      scriptNameAriaYourSnake: "Название сценария для вашей змеи"
    },
    resultMsgs: {
      inProgress: () => "Идёт бой",
      winsAlive: ({ label }) => `${label} побеждает`,
      winsByLength: ({ label }) => `${label} побеждает по длине`,
      draw: () => "Ничья",
      winsByLastGreaterLength: ({ label }) => `${label} побеждает по последней большей длине`,
      missionWon: () => "Миссия пройдена",
      missionLost: () => "Миссия провалена"
    },
    log: {
      reset: () => "Бой сброшен.",
      started: () => "Бой начался.",
      pausedLog: () => "Бой на паузе.",
      ruleUsed: ({ label, ruleName, actionText }) => `${label} применила правило: ${ruleName} → ${actionText}`,
      diedWall: ({ label }) => `${label} погибла, врезавшись в стену.`,
      diedSelfCollision: ({ label }) => `${label} погибла от столкновения с собой.`,
      diedBiteLengthDrop: ({ label }) => `${label} погибла: длина тела опустилась ниже 2.`,
      headCollision: () => "змеи столкнулись головами, обе погибли",
      bite: ({ attackerLabel, enemyLabel, x, y }) => `${attackerLabel} укусила ${enemyLabel} в точке (${x}, ${y}): ${attackerLabel} +1 к длине, ${enemyLabel} -1 сегмент.`,
      ateFood: ({ label }) => `${label} съела еду.`,
      foodExpired: ({ x, y, seconds }) => `Еда в точке (${x}, ${y}) исчезла через ${seconds} с.`,
      newFood: ({ x, y }) => `Новая еда появилась в точке (${x}, ${y}).`,
      scriptSaved: ({ name }) => `Сценарий "${name}" сохранён.`,
      scriptLoaded: ({ name, label }) => `Сценарий "${name}" загружен в ${label}.`,
      battleFinishedGeneric: ({ resultText }) => `Бой завершён. ${resultText}.`,
      battleFinishedTimeExpired: () => "Бой завершён. Время истекло.",
      battleFinishedPlain: () => "Бой завершён.",
      missionStarted: ({ missionName }) => `Миссия начата: ${missionName}.`,
      missionCompleted: ({ missionName }) => `Миссия пройдена: ${missionName}.`,
      missionFailed: ({ missionName }) => `Миссия провалена: ${missionName}.`
    }
  }
};

let currentLang = "ru";
try {
  const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
  if (storedLang === "en" || storedLang === "ru") {
    currentLang = storedLang;
  }
} catch (error) {
  // localStorage unavailable (e.g. sandboxed iframe); fall back to default language.
}

function tr(path, params) {
  const segments = path.split(".");
  let node = STRINGS[currentLang];
  for (const segment of segments) {
    node = node && node[segment];
  }
  return typeof node === "function" ? node(params) : node;
}

function snakeLabel(snakeKey) {
  if (state.mode === "mission") {
    return snakeKey === "snakeA" ? tr("missionPlay.yourSnakeLabel") : tr("missionPlay.opponentLabel");
  }
  return tr(`snakeLabel.${snakeKey}`);
}

function actionText(action) {
  return tr(`action.${action}`);
}

function applyStaticTranslations() {
  document.title = tr("pageTitle");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = tr(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", tr(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-legend]").forEach((el) => {
    el.textContent = tr(`legend.${el.dataset.legend}`);
  });
}

function setLanguage(lang) {
  currentLang = lang === "en" ? "en" : "ru";
  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
  } catch (error) {
    // localStorage unavailable; language choice just won't persist across reloads.
  }
  applyStaticTranslations();
  if (currentScreen === "missionSelect") {
    renderMissionSelect();
  }
  if (currentScreen === "missionPlay" && state.mission) {
    renderMissionObjective(state.mission.def);
  }
  renderAll();
}

let ruleIdCounter = 1;

const state = {
  status: "paused",
  remainingMs: BATTLE_DURATION_MS,
  snakes: {},
  rules: {
    snakeA: [],
    snakeB: []
  },
  food: null,
  foodSpawnedAt: null,
  eventLog: [],
  timerId: null,
  runEndsAt: null,
  result: { key: "inProgress" },
  lastRule: {
    snakeA: LAST_RULE_NONE,
    snakeB: LAST_RULE_NONE
  },
  lastRuleIndex: {
    snakeA: -1,
    snakeB: -1
  },
  mode: "duel",
  mission: null
};

const refs = {
  languageSelect: document.getElementById("languageSelect"),
  menuMultiplayerButton: document.getElementById("menuMultiplayerButton"),
  menuSinglePlayerButton: document.getElementById("menuSinglePlayerButton"),
  missionSelectBackButton: document.getElementById("missionSelectBackButton"),
  missionGrid: document.getElementById("missionGrid"),
  missionPlayBackButton: document.getElementById("missionPlayBackButton"),
  missionObjective: document.getElementById("missionObjective"),
  missionStatusGrid: document.querySelector("#screen-missionPlay .status-grid"),
  missionBanner: document.querySelector("#screen-missionPlay .mission-banner")
};
refs.missionBannerText = refs.missionBanner.querySelector(".mission-banner-text");
refs.missionRetryButton = refs.missionBanner.querySelector("[data-mission-retry]");
refs.missionNextButton = refs.missionBanner.querySelector("[data-mission-next]");
refs.missionBannerBackButton = refs.missionBanner.querySelector("[data-mission-back]");

function buildView(suffix) {
  return {
    arena: document.getElementById(`arena-${suffix}`),
    timerValue: document.getElementById(`timerValue-${suffix}`),
    statusValue: document.getElementById(`statusValue-${suffix}`),
    lengthAValue: document.getElementById(`lengthAValue-${suffix}`),
    lengthBValue: document.getElementById(`lengthBValue-${suffix}`),
    lastRuleAValue: document.getElementById(`lastRuleAValue-${suffix}`),
    lastRuleBValue: document.getElementById(`lastRuleBValue-${suffix}`),
    resultValue: document.getElementById(`resultValue-${suffix}`),
    eventLog: document.getElementById(`eventLog-${suffix}`),
    startButton: document.getElementById(`startButton-${suffix}`),
    pauseButton: document.getElementById(`pauseButton-${suffix}`),
    resetButton: document.getElementById(`resetButton-${suffix}`),
    stepButton: document.getElementById(`stepButton-${suffix}`)
  };
}

function buildEditor(suffix, snakeKey) {
  const letter = snakeKey === "snakeA" ? "A" : "B";
  return {
    snakeKey,
    root: document.getElementById(`editorSnake${letter}-${suffix}`),
    rulesContainer: document.getElementById(`rulesSnake${letter}-${suffix}`),
    scriptNameInput: document.getElementById(`scriptName${letter}-${suffix}`),
    loadFileInput: document.getElementById(`loadFile${letter}-${suffix}`)
  };
}

const editors = {
  duelA: buildEditor("duel", "snakeA"),
  duelB: buildEditor("duel", "snakeB"),
  missionA: buildEditor("mission", "snakeA")
};

const views = {
  duel: buildView("duel"),
  mission: buildView("mission")
};
views.duel.editors = [editors.duelA, editors.duelB];
views.mission.editors = [editors.missionA];

function activeView() {
  return state.mode === "mission" ? views.mission : views.duel;
}

function showScreen(name) {
  currentScreen = name;
  for (const screenName of SCREENS) {
    document.getElementById(`screen-${screenName}`).classList.toggle("active", screenName === name);
  }
}

function createPattern() {
  return Array.from({ length: VIEW_SIZE }, (_, row) =>
    Array.from({ length: VIEW_SIZE }, (_, col) =>
      row === VIEW_CENTER && col === VIEW_CENTER ? "head" : "any"
    )
  );
}

function createRule(name, action, pattern) {
  return {
    id: `rule-${ruleIdCounter++}`,
    name,
    action,
    pattern: normalizePattern(pattern || createPattern())
  };
}

function createDemoRules(snakeKey) {
  const label = snakeLabel(snakeKey);
  const foodLeft = createPattern();
  foodLeft[VIEW_CENTER][VIEW_CENTER - 1] = "food";

  const foodRight = createPattern();
  foodRight[VIEW_CENTER][VIEW_CENTER + 1] = "food";

  const wallAhead = createPattern();
  wallAhead[VIEW_CENTER - 1][VIEW_CENTER] = "wall";

  return [
    createRule(tr("demoRuleTurnFoodLeft", { label }), "left", foodLeft),
    createRule(tr("demoRuleTurnFoodRight", { label }), "right", foodRight),
    createRule(tr("demoRuleAvoidWall", { label }), "left", wallAhead)
  ];
}

function resetRulesToDefaults() {
  ruleIdCounter = 1;
  state.rules.snakeA = createDemoRules("snakeA");
  state.rules.snakeB = createDemoRules("snakeB");
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSnakeBodyFromHead(head, direction, length = 3) {
  const opposite = { up: "down", down: "up", left: "right", right: "left" };
  const delta = DIRECTION_DELTAS[opposite[direction]];
  const body = [];
  for (let i = 0; i < length; i += 1) {
    body.push({ x: head.x + delta.x * i, y: head.y + delta.y * i });
  }
  return body;
}

function isBodyInsideGrid(body) {
  return body.every((seg) => seg.x >= 0 && seg.x < GRID_SIZE && seg.y >= 0 && seg.y < GRID_SIZE);
}

function bodiesOverlap(bodyA, bodyB) {
  return bodyA.some((segA) => bodyB.some((segB) => segA.x === segB.x && segA.y === segB.y));
}

function createRandomSpawnForHalf(half) {
  const SNAKE_LENGTH = 3;
  const MAX_ATTEMPTS = 50;
  const xMin = half === "left" ? 0 : Math.ceil(GRID_SIZE / 2);
  const xMax = half === "left" ? Math.floor(GRID_SIZE / 2) - 1 : GRID_SIZE - 1;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const randomDirection = TURN_ORDER[getRandomInt(0, TURN_ORDER.length - 1)];
    const head = { x: getRandomInt(xMin, xMax), y: getRandomInt(0, GRID_SIZE - 1) };
    const body = buildSnakeBodyFromHead(head, randomDirection, SNAKE_LENGTH);
    const bodyInHalf = body.every((seg) => seg.x >= xMin && seg.x <= xMax);
    if (isBodyInsideGrid(body) && bodyInHalf) {
      return { direction: randomDirection, body };
    }
  }
  return null;
}

function createRandomInitialSnakes() {
  const MAX_ATTEMPTS = 20;
  const fallbackA = {
    key: "snakeA", alive: true, direction: "right",
    body: buildSnakeBodyFromHead({ x: 2, y: 6 }, "right")
  };
  const fallbackB = {
    key: "snakeB", alive: true, direction: "left",
    body: buildSnakeBodyFromHead({ x: 10, y: 6 }, "left")
  };
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const spawnA = createRandomSpawnForHalf("left");
    const spawnB = createRandomSpawnForHalf("right");
    if (!spawnA || !spawnB) {
      continue;
    }
    if (bodiesOverlap(spawnA.body, spawnB.body)) {
      continue;
    }
    return {
      snakeA: { key: "snakeA", alive: true, direction: spawnA.direction, body: spawnA.body },
      snakeB: { key: "snakeB", alive: true, direction: spawnB.direction, body: spawnB.body }
    };
  }
  return { snakeA: fallbackA, snakeB: fallbackB };
}

function resetBattleState(logReset = true) {
  stopTimer();
  state.status = "paused";
  state.remainingMs = BATTLE_DURATION_MS;
  state.result = { key: "inProgress" };
  state.runEndsAt = null;
  state.lastRule = { snakeA: LAST_RULE_NONE, snakeB: LAST_RULE_NONE };
  state.lastRuleIndex = { snakeA: -1, snakeB: -1 };
  const initialSnakes = createRandomInitialSnakes();
  state.snakes.snakeA = initialSnakes.snakeA;
  state.snakes.snakeB = initialSnakes.snakeB;
  state.food = null;
  placeFood();
  if (logReset) {
    state.eventLog = [];
    pushLog("reset");
  }
  renderAll();
}

function pushLog(key, params) {
  state.eventLog.unshift({ key, params });
  state.eventLog = state.eventLog.slice(0, MAX_EVENT_LOG_ENTRIES);
  renderLog();
}

function renderLog() {
  const view = activeView();
  view.eventLog.innerHTML = state.eventLog.length
    ? state.eventLog
        .map((entry) => `<div class="log-entry"><strong>•</strong> ${escapeHtml(tr(`log.${entry.key}`, entry.params))}</div>`)
        .join("")
    : `<div class="log-entry">${escapeHtml(tr("noEventsYet"))}</div>`;
}

function formatTimer(ms) {
  if (ms === Infinity) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - (state.mission ? state.mission.startedAt : Date.now())) / 1000));
    return `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  }
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderArena() {
  const view = activeView();
  view.arena.style.setProperty("--grid-size", GRID_SIZE);
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const classes = ["cell"];
      if (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) {
        classes.push("edge");
      }
      if (state.food && state.food.x === x && state.food.y === y) {
        classes.push("food");
      }
      for (const snakeKey of SNAKE_KEYS) {
        const snake = state.snakes[snakeKey];
        if (!snake.alive) {
          continue;
        }
        const segmentIndex = snake.body.findIndex((segment) => segment.x === x && segment.y === y);
        if (segmentIndex !== -1) {
          classes.push(snakeKey === "snakeA" ? "snake-a" : "snake-b");
          if (segmentIndex === 0) {
            classes.push("head");
          }
        }
      }
      cells.push(`<div class="${classes.join(" ")}"></div>`);
    }
  }
  view.arena.innerHTML = cells.join("");
}

function formatLastRule(value) {
  if (value === LAST_RULE_NONE) return tr("lastRuleNone");
  if (value === LAST_RULE_DEAD) return tr("lastRuleDead");
  if (value === LAST_RULE_DEFAULT) return tr("lastRuleDefault");
  return value;
}

function formatResult(result) {
  const params = result.params ? { label: snakeLabel(result.params.snakeKey) } : undefined;
  return tr(`resultMsgs.${result.key}`, params);
}

function renderStatus() {
  const view = activeView();
  view.timerValue.textContent = formatTimer(state.remainingMs);
  view.statusValue.textContent = tr(`status.${state.status}`);
  view.lengthAValue.textContent = String(state.snakes.snakeA.body.length);
  view.lengthBValue.textContent = String(state.snakes.snakeB.body.length);
  view.lastRuleAValue.textContent = formatLastRule(state.lastRule.snakeA);
  view.lastRuleBValue.textContent = formatLastRule(state.lastRule.snakeB);
  view.resultValue.textContent = formatResult(state.result);
}

function renderRuleList(editor) {
  const { snakeKey, rulesContainer } = editor;
  const rules = state.rules[snakeKey];
  rulesContainer.style.setProperty("--view-size", VIEW_SIZE);
  rulesContainer.innerHTML = rules.length
    ? rules
        .map((rule, index) => {
          const activeClass = state.lastRuleIndex[snakeKey] === index ? " active" : "";
          const ruleLabel = snakeLabel(snakeKey);
          return `
            <article class="rule-card${activeClass}" data-snake="${snakeKey}" data-rule-id="${rule.id}">
              <div class="rule-header">
                <input type="text" value="${escapeAttribute(rule.name)}" data-field="name" aria-label="${escapeAttribute(tr("ruleNameAria", { label: ruleLabel }))}" />
                <button data-move="up" ${index === 0 ? "disabled" : ""}>↑</button>
                <button data-move="down" ${index === rules.length - 1 ? "disabled" : ""}>↓</button>
                <button data-delete-rule="true">${tr("deleteRule")}</button>
              </div>
              <div class="rule-meta">
                <label>
                  <span class="helper">${tr("actionLabelText")}</span>
                  <select data-field="action" aria-label="${escapeAttribute(tr("actionAria", { label: ruleLabel }))}">
                    ${["left", "straight", "right"]
                      .map(
                        (action) =>
                          `<option value="${action}" ${rule.action === action ? "selected" : ""}>${actionText(action)}</option>`
                      )
                      .join("")}
                  </select>
                </label>
                <div class="helper">${tr("firstMatchWins")}</div>
              </div>
              <div class="pattern-grid">
                ${renderPatternButtons(rule.pattern)}
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="helper">${tr("noRulesYet")}</p>`;
}

function renderPatternButtons(pattern) {
  return pattern
    .map((row, rowIndex) =>
      row
        .map((cell, colIndex) => {
          const disabled = rowIndex === VIEW_CENTER && colIndex === VIEW_CENTER;
          const cellClass = cell.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
          return `
            <button
              type="button"
              class="pattern-cell ${cellClass}"
              data-pattern-row="${rowIndex}"
              data-pattern-col="${colIndex}"
              title="${escapeAttribute(tr(`legend.${cell}`))}"
              ${disabled ? "disabled" : ""}
            >${tr(`pattern.${cell}`)}</button>
          `;
        })
        .join("")
    )
    .join("");
}

function renderEditors() {
  for (const editor of activeView().editors) {
    renderRuleList(editor);
  }
}

function renderAll() {
  renderArena();
  renderStatus();
  renderEditors();
  renderLog();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function stopTimer() {
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function startBattle() {
  if (state.status === "finished") {
    return;
  }
  if (state.timerId) {
    return;
  }
  state.status = "running";
  state.runEndsAt = Date.now() + state.remainingMs;
  renderStatus();
  pushLog("started");
  scheduleNextTick();
}

function scheduleNextTick() {
  state.timerId = window.setTimeout(() => {
    state.timerId = null;
    if (state.status !== "running") {
      return;
    }
    stepBattle(true);
    if (state.status === "running") {
      scheduleNextTick();
    }
  }, TICK_MS);
}

function pauseBattle(log = true) {
  if (state.status === "running" && state.runEndsAt) {
    state.remainingMs = Math.max(0, state.runEndsAt - Date.now());
  }
  stopTimer();
  state.runEndsAt = null;
  if (state.status !== "finished") {
    state.status = "paused";
  }
  renderStatus();
  if (log) {
    pushLog("pausedLog");
  }
}

function finalizeBattle(reasonKey) {
  stopTimer();
  state.runEndsAt = null;
  state.status = "finished";
  const snakeAAlive = state.snakes.snakeA.alive;
  const snakeBAlive = state.snakes.snakeB.alive;
  const lenA = state.snakes.snakeA.body.length;
  const lenB = state.snakes.snakeB.body.length;

  if (snakeAAlive && !snakeBAlive) {
    state.result = { key: "winsAlive", params: { snakeKey: "snakeA" } };
  } else if (!snakeAAlive && snakeBAlive) {
    state.result = { key: "winsAlive", params: { snakeKey: "snakeB" } };
  } else if (snakeAAlive && snakeBAlive) {
    if (lenA > lenB) {
      state.result = { key: "winsByLength", params: { snakeKey: "snakeA" } };
    } else if (lenB > lenA) {
      state.result = { key: "winsByLength", params: { snakeKey: "snakeB" } };
    } else {
      state.result = { key: "draw" };
    }
  } else if (lenA > lenB) {
    state.result = { key: "winsByLastGreaterLength", params: { snakeKey: "snakeA" } };
  } else if (lenB > lenA) {
    state.result = { key: "winsByLastGreaterLength", params: { snakeKey: "snakeB" } };
  } else {
    state.result = { key: "draw" };
  }

  renderStatus();
  pushLog(reasonKey || "battleFinishedGeneric", { resultText: formatResult(state.result) });
}

function turnDirection(direction, action) {
  const currentIndex = TURN_ORDER.indexOf(direction);
  if (action === "straight") {
    return direction;
  }
  if (action === "left") {
    return TURN_ORDER[(currentIndex + 3) % TURN_ORDER.length];
  }
  if (action === "right") {
    return TURN_ORDER[(currentIndex + 1) % TURN_ORDER.length];
  }
  return direction;
}

function isInsideGrid(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function isOccupiedBySnake(snake, x, y) {
  return snake.body.some((segment) => segment.x === x && segment.y === y);
}

function normalizePattern(pattern) {
  const normalized = Array.from({ length: VIEW_SIZE }, (_, row) =>
    Array.from({ length: VIEW_SIZE }, (_, col) => {
      if (row === VIEW_CENTER && col === VIEW_CENTER) {
        return "head";
      }
      const value = pattern && pattern[row] && pattern[row][col];
      return CELL_TYPES.includes(value) ? value : "any";
    })
  );
  normalized[VIEW_CENTER][VIEW_CENTER] = "head";
  return normalized;
}

function normalizeRule(rawRule, fallbackName) {
  const action = ["left", "right", "straight"].includes(rawRule && rawRule.action)
    ? rawRule.action
    : "straight";
  const name = rawRule && typeof rawRule.name === "string" && rawRule.name.trim()
    ? rawRule.name.trim()
    : fallbackName;
  return createRule(name, action, normalizePattern(rawRule && rawRule.pattern));
}

function saveScript(editor) {
  const scriptName = editor.scriptNameInput.value.trim() || snakeLabel(editor.snakeKey);
  const payload = {
    scriptName,
    rules: state.rules[editor.snakeKey].map((rule) => ({
      name: rule.name,
      action: rule.action,
      pattern: normalizePattern(rule.pattern)
    }))
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${scriptName.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "script"}.json`;
  a.click();
  URL.revokeObjectURL(url);
  pushLog("scriptSaved", { name: scriptName });
}

function loadScript(editor, file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      const rules = Array.isArray(parsed.rules)
        ? parsed.rules.map((rule, index) => normalizeRule(rule, `${snakeLabel(editor.snakeKey)} ${tr("ruleWord")} ${index + 1}`))
        : [];
      state.rules[editor.snakeKey] = rules;
      state.lastRule[editor.snakeKey] = LAST_RULE_NONE;
      state.lastRuleIndex[editor.snakeKey] = -1;
      if (parsed.scriptName && typeof parsed.scriptName === "string") {
        editor.scriptNameInput.value = parsed.scriptName;
      }
      renderEditors();
      pushLog("scriptLoaded", { name: parsed.scriptName || file.name, label: snakeLabel(editor.snakeKey) });
    } catch (error) {
      window.alert(`Invalid JSON: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function placeFood() {
  const freeCells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const occupied = SNAKE_KEYS.some((snakeKey) => {
        const snake = state.snakes[snakeKey];
        return snake.alive && isOccupiedBySnake(snake, x, y);
      });
      if (!occupied) {
        freeCells.push({ x, y });
      }
    }
  }
  if (!freeCells.length) {
    state.food = null;
    return;
  }
  state.food = freeCells[Math.floor(Math.random() * freeCells.length)];
  state.foodSpawnedAt = Date.now();
}

function getWorldPositionFromView(head, direction, relX, relY) {
  switch (direction) {
    case "up":
      return { x: head.x + relX, y: head.y + relY };
    case "right":
      return { x: head.x - relY, y: head.y + relX };
    case "down":
      return { x: head.x - relX, y: head.y - relY };
    case "left":
      return { x: head.x + relY, y: head.y - relX };
    default:
      return { x: head.x + relX, y: head.y + relY };
  }
}

function getVisibleToken(snakeKey, worldX, worldY) {
  if (!isInsideGrid(worldX, worldY)) {
    return "wall";
  }

  if (state.food && state.food.x === worldX && state.food.y === worldY) {
    return "food";
  }

  const snake = state.snakes[snakeKey];
  if (isOccupiedBySnake(snake, worldX, worldY)) {
    return "self";
  }

  const enemyKey = snakeKey === "snakeA" ? "snakeB" : "snakeA";
  const enemy = state.snakes[enemyKey];
  if (
    enemy.alive &&
    enemy.body.length &&
    enemy.body[0].x === worldX &&
    enemy.body[0].y === worldY
  ) {
    return "enemyHead";
  }

  if (enemy.alive && isOccupiedBySnake(enemy, worldX, worldY)) {
    return "enemy";
  }

  return "empty";
}

function ruleMatches(snakeKey, rule) {
  const snake = state.snakes[snakeKey];
  const head = snake.body[0];

  for (let row = 0; row < VIEW_SIZE; row += 1) {
    for (let col = 0; col < VIEW_SIZE; col += 1) {
      if (row === VIEW_CENTER && col === VIEW_CENTER) {
        continue;
      }
      const required = rule.pattern[row][col];
      if (required === "any") {
        continue;
      }
      const relX = col - VIEW_CENTER;
      const relY = row - VIEW_CENTER;
      const world = getWorldPositionFromView(head, snake.direction, relX, relY);
      const actual = getVisibleToken(snakeKey, world.x, world.y);
      if (actual !== required) {
        return false;
      }
    }
  }
  return true;
}

function evaluateRuleForSnake(snakeKey) {
  const snake = state.snakes[snakeKey];
  if (!snake.alive) {
    return {
      action: "straight",
      direction: snake.direction,
      ruleName: LAST_RULE_DEAD,
      ruleIndex: -1
    };
  }

  for (let index = 0; index < state.rules[snakeKey].length; index += 1) {
    const rule = state.rules[snakeKey][index];
    if (ruleMatches(snakeKey, rule)) {
      return {
        action: rule.action,
        direction: turnDirection(snake.direction, rule.action),
        ruleName: rule.name,
        ruleIndex: index
      };
    }
  }

  return {
    action: "straight",
    direction: snake.direction,
    ruleName: LAST_RULE_DEFAULT,
    ruleIndex: -1
  };
}

function markSnakeDead(snakeKey, logKey) {
  const snake = state.snakes[snakeKey];
  if (!snake.alive) {
    return;
  }
  snake.alive = false;
  playDeathSound();
  pushLog(logKey, { label: snakeLabel(snakeKey) });
}

function handleFoodExpiry() {
  if (!state.food || !state.foodSpawnedAt) {
    return;
  }
  if (Date.now() - state.foodSpawnedAt >= FOOD_LIFETIME_MS) {
    const old = state.food;
    state.food = null;
    state.foodSpawnedAt = null;
    pushLog("foodExpired", { x: old.x, y: old.y, seconds: FOOD_LIFETIME_MS / 1000 });
    placeFood();
    if (state.food) {
      pushLog("newFood", { x: state.food.x, y: state.food.y });
    }
  }
}

function stepBattle(fromTimer = false) {
  if (state.status === "finished") {
    return;
  }

  if (fromTimer && state.status !== "running") {
    return;
  }

  if (fromTimer && state.runEndsAt && Date.now() >= state.runEndsAt) {
    state.remainingMs = 0;
    renderAll();
    if (state.mode === "mission") {
      const diedThisTick = state.mission.phantom && !state.snakes.snakeA.alive;
      finalizeMission(diedThisTick ? "died" : "timeExpired");
    } else {
      finalizeBattle("battleFinishedTimeExpired");
      playBattleEndSound();
    }
    return;
  }

  const decisions = {};
  const targets = {};
  const willGrow = {};

  handleFoodExpiry();

  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    if (!snake.alive) {
      state.lastRule[snakeKey] = LAST_RULE_DEAD;
      state.lastRuleIndex[snakeKey] = -1;
      continue;
    }

    const decision = evaluateRuleForSnake(snakeKey);
    decisions[snakeKey] = decision;
    state.lastRule[snakeKey] = decision.ruleName;
    state.lastRuleIndex[snakeKey] = decision.ruleIndex;
    if (decision.ruleIndex !== -1) {
      pushLog("ruleUsed", { label: snakeLabel(snakeKey), ruleName: decision.ruleName, actionText: actionText(decision.action) });
    }
    snake.direction = decision.direction;
    const delta = DIRECTION_DELTAS[snake.direction];
    targets[snakeKey] = {
      x: snake.body[0].x + delta.x,
      y: snake.body[0].y + delta.y
    };
    willGrow[snakeKey] = Boolean(state.food && targets[snakeKey].x === state.food.x && targets[snakeKey].y === state.food.y);
  }

  const snakeA = state.snakes.snakeA;
  const snakeB = state.snakes.snakeB;
  if (
    snakeA.alive &&
    snakeB.alive &&
    targets.snakeA &&
    targets.snakeB &&
    (
      (targets.snakeA.x === targets.snakeB.x && targets.snakeA.y === targets.snakeB.y) ||
      (targets.snakeA.x === snakeB.body[0].x &&
        targets.snakeA.y === snakeB.body[0].y &&
        targets.snakeB.x === snakeA.body[0].x &&
        targets.snakeB.y === snakeA.body[0].y)
    )
  ) {
    snakeA.alive = false;
    snakeB.alive = false;
    playDeathSound();
    pushLog("headCollision");
  }

  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    const target = targets[snakeKey];
    if (!snake.alive || !target) {
      continue;
    }
    if (!isInsideGrid(target.x, target.y)) {
      markSnakeDead(snakeKey, "diedWall");
      continue;
    }
    if (
      snake.body.some((segment, index) => {
        const isTail = index === snake.body.length - 1;
        if (isTail && !willGrow[snakeKey]) {
          return false;
        }
        return segment.x === target.x && segment.y === target.y;
      })
    ) {
      markSnakeDead(snakeKey, "diedSelfCollision");
    }
  }

  const bitePlans = [];
  const biters = new Set();
  const biteRemovals = {
    snakeA: new Set(),
    snakeB: new Set()
  };
  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    const target = targets[snakeKey];
    if (!snake.alive || !target) {
      continue;
    }
    const enemyKey = snakeKey === "snakeA" ? "snakeB" : "snakeA";
    const enemy = state.snakes[enemyKey];
    const projectedBodySourceIndices = enemy.alive
      ? enemy.body
        .map((_, index) => index)
        .slice(0, Math.max(0, enemy.body.length - (willGrow[enemyKey] ? 0 : 1)))
      : [];
    const bittenIndex = projectedBodySourceIndices.find((index) => {
      const segment = enemy.body[index];
      return segment.x === target.x && segment.y === target.y;
    });
    if (bittenIndex !== undefined) {
      bitePlans.push({ attackerKey: snakeKey, enemyKey, target, bittenIndex });
      biters.add(snakeKey);
      biteRemovals[enemyKey].add(bittenIndex);
    }
  }

  for (const plan of bitePlans) {
    playBiteSound();
    pushLog("bite", {
      attackerLabel: snakeLabel(plan.attackerKey),
      enemyLabel: snakeLabel(plan.enemyKey),
      x: plan.target.x,
      y: plan.target.y
    });
  }

  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    if (!snake.alive || biteRemovals[snakeKey].size === 0) {
      continue;
    }
    snake.body = snake.body.filter((_, index) => !biteRemovals[snakeKey].has(index));
    if (snake.body.length < 2) {
      snake.alive = false;
      playDeathSound();
      pushLog("diedBiteLengthDrop", { label: snakeLabel(snakeKey) });
    }
  }

  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    const target = targets[snakeKey];
    if (!snake.alive || !target) {
      continue;
    }
    snake.body.unshift(target);
    const ateFood = state.food && target.x === state.food.x && target.y === state.food.y;
    if (ateFood) {
      playFoodEatenSound();
      pushLog("ateFood", { label: snakeLabel(snakeKey) });
      state.food = null;
    } else if (!biters.has(snakeKey)) {
      snake.body.pop();
    }
  }

  if (!state.food) {
    placeFood();
  }

  for (const snakeKey of SNAKE_KEYS) {
    const snake = state.snakes[snakeKey];
    if (snake.alive && snake.body.length < 2) {
      snake.alive = false;
      playDeathSound();
      pushLog("diedBiteLengthDrop", { label: snakeLabel(snakeKey) });
    }
  }

  if (fromTimer && state.runEndsAt) {
    state.remainingMs = Math.max(0, state.runEndsAt - Date.now());
  } else {
    state.remainingMs = Math.max(0, state.remainingMs - TICK_MS);
  }

  if (state.remainingMs <= 0) {
    state.remainingMs = 0;
    renderAll();
    if (state.mode === "mission") {
      const diedThisTick = state.mission.phantom && !state.snakes.snakeA.alive;
      finalizeMission(diedThisTick ? "died" : "timeExpired");
    } else {
      finalizeBattle("battleFinishedTimeExpired");
      playBattleEndSound();
    }
    return;
  }

  renderAll();

  if (state.mode === "mission") {
    const def = state.mission.def;
    if (state.mission.phantom) {
      if (!state.snakes.snakeA.alive) {
        finalizeMission("died");
        return;
      }
      if (def.type === "growTo" && state.snakes.snakeA.body.length >= def.targetLength) {
        finalizeMission("reachedLength");
        return;
      }
      // Survive's win condition is handled entirely above: remainingMs hits 0 while snakeA is still alive.
    } else {
      const livingSnakes = SNAKE_KEYS.filter((snakeKey) => state.snakes[snakeKey].alive);
      if (livingSnakes.length <= 1) {
        finalizeMission("elimination");
      }
    }
  } else {
    const livingSnakes = SNAKE_KEYS.filter((snakeKey) => state.snakes[snakeKey].alive);
    if (livingSnakes.length <= 1) {
      finalizeBattle("battleFinishedPlain");
      playBattleEndSound();
    }
  }
}

function moveRule(snakeKey, ruleId, direction) {
  const rules = state.rules[snakeKey];
  const index = rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) {
    return;
  }
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rules.length) {
    return;
  }
  [rules[index], rules[targetIndex]] = [rules[targetIndex], rules[index]];
  renderEditors();
}

function cyclePatternCell(snakeKey, ruleId, row, col) {
  if (row === VIEW_CENTER && col === VIEW_CENTER) {
    return;
  }
  const rule = state.rules[snakeKey].find((candidate) => candidate.id === ruleId);
  if (!rule) {
    return;
  }
  const current = rule.pattern[row][col];
  const nextIndex = (CELL_TYPES.indexOf(current) + 1) % CELL_TYPES.length;
  rule.pattern[row][col] = CELL_TYPES[nextIndex];
  renderEditors();
}

function addRule(snakeKey) {
  const ruleNumber = state.rules[snakeKey].length + 1;
  state.rules[snakeKey].push(createRule(`${snakeLabel(snakeKey)} ${tr("ruleWord")} ${ruleNumber}`, "straight"));
  renderEditors();
}

function deleteRule(snakeKey, ruleId) {
  state.rules[snakeKey] = state.rules[snakeKey].filter((rule) => rule.id !== ruleId);
  renderEditors();
}

function bindEditorEvents(editor) {
  const { root, snakeKey, loadFileInput } = editor;

  root.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-rule]");
    if (addButton) {
      playEditorClickSound();
      addRule(snakeKey);
      return;
    }

    const saveButton = event.target.closest("[data-save-script]");
    if (saveButton) {
      playEditorClickSound();
      saveScript(editor);
      return;
    }

    const loadButton = event.target.closest("[data-load-script]");
    if (loadButton) {
      playEditorClickSound();
      loadFileInput.click();
      return;
    }

    const card = event.target.closest(".rule-card");
    if (!card) {
      return;
    }
    const ruleId = card.dataset.ruleId;

    const deleteButton = event.target.closest("[data-delete-rule]");
    if (deleteButton) {
      playEditorClickSound();
      deleteRule(snakeKey, ruleId);
      return;
    }

    const moveButton = event.target.closest("[data-move]");
    if (moveButton) {
      playEditorClickSound();
      moveRule(snakeKey, ruleId, moveButton.dataset.move);
      return;
    }

    // Pattern-cell cycling is intentionally silent — it's clicked dozens of times in quick
    // succession while authoring a single rule's 7x7 grid, where a sound per click would grate.
    const patternButton = event.target.closest(".pattern-cell");
    if (patternButton) {
      cyclePatternCell(
        snakeKey,
        ruleId,
        Number(patternButton.dataset.patternRow),
        Number(patternButton.dataset.patternCol)
      );
    }
  });

  root.addEventListener("input", (event) => {
    const card = event.target.closest(".rule-card");
    if (!card) {
      return;
    }
    const rule = state.rules[snakeKey].find((candidate) => candidate.id === card.dataset.ruleId);
    if (!rule) {
      return;
    }
    if (event.target.dataset.field === "name") {
      rule.name = event.target.value || tr("unnamedRule");
    }
  });

  root.addEventListener("change", (event) => {
    const card = event.target.closest(".rule-card");
    if (!card) {
      return;
    }
    const rule = state.rules[snakeKey].find((candidate) => candidate.id === card.dataset.ruleId);
    if (!rule) {
      return;
    }
    if (event.target.dataset.field === "action") {
      rule.action = event.target.value;
    }
  });

  loadFileInput.addEventListener("change", (event) => {
    if (event.target.files[0]) {
      loadScript(editor, event.target.files[0]);
    }
    event.target.value = "";
  });
}

// ===== Single Player: mission progress persistence =====

function loadMissionProgress() {
  const fallback = { version: 1, completed: {} };
  try {
    const raw = localStorage.getItem(MISSION_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === 1 && parsed.completed ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveMissionProgress(progress) {
  try {
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // localStorage unavailable; progress just won't persist across reloads.
  }
}

function isMissionUnlocked(missionId, progress) {
  const index = MISSIONS.findIndex((m) => m.id === missionId);
  if (index <= 0) {
    return true;
  }
  return Boolean(progress.completed[MISSIONS[index - 1].id]);
}

function markMissionComplete(missionId) {
  const progress = loadMissionProgress();
  progress.completed[missionId] = true;
  saveMissionProgress(progress);
}

// ===== Single Player: mission screens and battle integration =====

function renderMissionSelect() {
  const progress = loadMissionProgress();
  refs.missionGrid.innerHTML = MISSIONS.map((mission) => {
    const unlocked = isMissionUnlocked(mission.id, progress);
    const completed = Boolean(progress.completed[mission.id]);
    const classes = ["mission-card"];
    if (!unlocked) classes.push("locked");
    if (completed) classes.push("completed");
    const badge = completed ? tr("missionSelect.completed") : (!unlocked ? tr("missionSelect.locked") : "");
    return `
      <button type="button" class="${classes.join(" ")}" data-mission-id="${mission.id}" ${unlocked ? "" : "disabled"}>
        <h3>${escapeHtml(tr(`missions.${mission.id}.name`))}</h3>
        <p>${escapeHtml(tr(`missions.${mission.id}.description`))}</p>
        ${badge ? `<span class="mission-badge">${escapeHtml(badge)}</span>` : ""}
      </button>
    `;
  }).join("");
}

function renderMissionObjective(def) {
  refs.missionObjective.innerHTML = `
    <h2>${escapeHtml(tr(`missions.${def.id}.name`))}</h2>
    <p>${escapeHtml(tr(`missions.${def.id}.objective`))}</p>
  `;
}

function showMissionBanner(won) {
  const missionName = tr(`missions.${state.mission.id}.name`);
  refs.missionBannerText.textContent = won
    ? tr("missionPlay.winBanner", { missionName })
    : tr("missionPlay.loseBanner");
  const currentIndex = MISSIONS.findIndex((m) => m.id === state.mission.id);
  const hasNext = won && currentIndex !== -1 && currentIndex < MISSIONS.length - 1;
  refs.missionNextButton.hidden = !hasNext;
  refs.missionBanner.hidden = false;
}

function startMission(missionId) {
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) {
    return;
  }
  state.mode = "mission";
  state.mission = { id: missionId, def, phantom: def.opponent === null, startedAt: Date.now() };

  resetBattleState(true);

  if (state.mission.phantom) {
    state.snakes.snakeB = { key: "snakeB", alive: false, direction: "right", body: [] };
    state.rules.snakeB = [];
  } else {
    const script = OPPONENT_SCRIPTS[def.opponent];
    state.rules.snakeB = script.rules.map((r, i) => normalizeRule(r, `${script.name} ${i + 1}`));
  }

  state.remainingMs = def.untimed ? Infinity : (def.durationMs || BATTLE_DURATION_MS);

  refs.missionStatusGrid.classList.toggle("mission-solo", state.mission.phantom);
  renderMissionObjective(def);
  refs.missionBanner.hidden = true;
  pushLog("missionStarted", { missionName: tr(`missions.${missionId}.name`) });
  showScreen("missionPlay");
  renderAll();
}

function finalizeMission(reasonKey) {
  const def = state.mission.def;
  let won = false;
  if (def.type === "survive") {
    won = reasonKey === "timeExpired";
  } else if (def.type === "growTo") {
    won = reasonKey === "reachedLength";
  } else if (def.type === "duel") {
    finalizeBattle(reasonKey === "elimination" ? "battleFinishedPlain" : "battleFinishedTimeExpired");
    won = (state.result.key === "winsAlive" || state.result.key === "winsByLength" || state.result.key === "winsByLastGreaterLength")
      && state.result.params && state.result.params.snakeKey === "snakeA";
  }

  if (def.type !== "duel") {
    stopTimer();
    state.status = "finished";
    state.runEndsAt = null;
    state.result = { key: won ? "missionWon" : "missionLost" };
    renderStatus();
  }

  const missionName = tr(`missions.${state.mission.id}.name`);
  pushLog(won ? "missionCompleted" : "missionFailed", { missionName });
  if (won) {
    markMissionComplete(state.mission.id);
    playWinSound();
  } else {
    playLoseSound();
  }
  showMissionBanner(won);
}

function handleResetClick() {
  if (state.mode === "mission" && state.mission) {
    startMission(state.mission.id);
  } else {
    resetBattleState(true);
  }
}

// ===== Sound effects (synthesized via Web Audio API — no audio assets needed) =====

let audioContext = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function playTone(ctx, { frequency, frequencyEnd, startTime, duration, type = "triangle", peakGain = 0.2 }) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (frequencyEnd) {
    oscillator.frequency.exponentialRampToValueAtTime(frequencyEnd, startTime + duration);
  }
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + Math.min(0.015, duration * 0.3));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playNoiseBurst(ctx, { startTime, duration, peakGain = 0.3, filterType = "lowpass", filterFrequency = 1200, filterFrequencyEnd }) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, startTime);
  if (filterFrequencyEnd) {
    filter.frequency.exponentialRampToValueAtTime(filterFrequencyEnd, startTime + duration);
  }
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  noiseSource.start(startTime);
  noiseSource.stop(startTime + duration + 0.02);
}

function playMenuClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, i) => {
    playTone(ctx, { frequency, startTime: now + i * 0.06, duration: 0.14, type: "square", peakGain: 0.12 });
  });
}

function playEditorClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, { frequency: 220, frequencyEnd: 90, startTime: now, duration: 0.09, type: "sine", peakGain: 0.16 });
}

function playDeathSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playNoiseBurst(ctx, { startTime: now, duration: 0.35, peakGain: 0.32, filterType: "lowpass", filterFrequency: 3000, filterFrequencyEnd: 300 });
  playTone(ctx, { frequency: 140, frequencyEnd: 40, startTime: now, duration: 0.4, type: "sawtooth", peakGain: 0.22 });
}

function playWinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const melody = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  melody.forEach((frequency, i) => {
    const startTime = now + i * 0.12;
    playTone(ctx, { frequency, startTime, duration: 0.3, type: "square", peakGain: 0.16 });
    playTone(ctx, { frequency: frequency * 1.5, startTime, duration: 0.3, type: "triangle", peakGain: 0.08 });
  });
  const chordStart = now + melody.length * 0.12;
  [1046.5, 1318.51, 1567.98].forEach((frequency) => {
    playTone(ctx, { frequency, startTime: chordStart, duration: 0.55, type: "square", peakGain: 0.13 });
  });
}

function playLoseSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const melody = [196.0, 185.0, 164.81, 146.83]; // G3, F#3, E3, D3 — slow descending, funeral-march-like
  melody.forEach((frequency, i) => {
    playTone(ctx, { frequency, startTime: now + i * 0.42, duration: 0.5, type: "triangle", peakGain: 0.15 });
  });
}

function playFoodEatenSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, { frequency: 500, frequencyEnd: 150, startTime: now, duration: 0.16, type: "sine", peakGain: 0.2 });
}

function playBiteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playNoiseBurst(ctx, { startTime: now, duration: 0.12, peakGain: 0.3, filterType: "bandpass", filterFrequency: 2000 });
  playTone(ctx, { frequency: 180, frequencyEnd: 90, startTime: now, duration: 0.1, type: "square", peakGain: 0.15 });
}

function playBattleEndSound() {
  if (state.result.key !== "draw") {
    playWinSound();
  }
}

function wireControls() {
  refs.languageSelect.addEventListener("change", (event) => {
    setLanguage(event.target.value);
  });

  refs.menuMultiplayerButton.addEventListener("click", () => {
    playMenuClickSound();
    state.mode = "duel";
    state.mission = null;
    resetBattleState(true);
    showScreen("duel");
  });

  refs.menuSinglePlayerButton.addEventListener("click", () => {
    playMenuClickSound();
    renderMissionSelect();
    showScreen("missionSelect");
  });

  refs.missionSelectBackButton.addEventListener("click", () => showScreen("menu"));

  refs.missionGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".mission-card");
    if (!card || card.disabled) {
      return;
    }
    startMission(card.dataset.missionId);
  });

  refs.missionPlayBackButton.addEventListener("click", () => showScreen("missionSelect"));

  refs.missionRetryButton.addEventListener("click", () => startMission(state.mission.id));
  refs.missionNextButton.addEventListener("click", () => {
    const currentIndex = MISSIONS.findIndex((m) => m.id === state.mission.id);
    const next = MISSIONS[currentIndex + 1];
    if (next) {
      startMission(next.id);
    } else {
      renderMissionSelect();
      showScreen("missionSelect");
    }
  });
  refs.missionBannerBackButton.addEventListener("click", () => showScreen("menu"));

  for (const view of Object.values(views)) {
    view.startButton.addEventListener("click", startBattle);
    view.pauseButton.addEventListener("click", () => pauseBattle(true));
    view.resetButton.addEventListener("click", handleResetClick);
    view.stepButton.addEventListener("click", () => {
      if (state.status === "running") {
        pauseBattle(false);
      }
      if (state.status !== "finished") {
        stepBattle();
      }
    });
  }

  for (const editor of Object.values(editors)) {
    bindEditorEvents(editor);
  }
}

refs.languageSelect.value = currentLang;
applyStaticTranslations();
editors.duelA.scriptNameInput.value = tr("snakeLabel.snakeA");
editors.duelB.scriptNameInput.value = tr("snakeLabel.snakeB");
editors.missionA.scriptNameInput.value = tr("missionPlay.yourSnakeLabel");
resetRulesToDefaults();
wireControls();
resetBattleState(true);
showScreen("menu");

let ysdk;

async function initYandexSDK() {
  try {
    ysdk = await YaGames.init();
    console.log("Yandex Games SDK initialized");
    ysdk.features.LoadingAPI?.ready();
  } catch (error) {
    console.error("Yandex SDK initialization error:", error);
  }
}

initYandexSDK();
