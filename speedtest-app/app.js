const DEFAULT_SERVERS = [
  {
    id: "auto",
    name: "Auto select nearest",
    location: "Lowest latency",
    provider: "Mixed",
    protocol: "auto"
  },
  {
    id: "cloudflare-global",
    name: "Cloudflare Global",
    location: "Anycast CDN",
    provider: "Cloudflare",
    protocol: "cloudflare",
    server: "https://speed.cloudflare.com"
  }
];

const TRANSFER_CHUNKS = {
  download: [5_000_000, 10_000_000, 15_000_000, 25_000_000],
  upload: [1_000_000, 2_500_000, 5_000_000, 8_000_000]
};

const STORAGE_KEY = "linje-speed-history-v1";
const GITHUB_COMMITS_URL = "/api/github/commits";
const PROFILE_STORAGE_KEY = "linje-profile-v1";
const GAME_SERVICE_TARGETS = [
  {
    id: "fortnite",
    name: "Fortnite",
    network: "Epic Games",
    region: "Global",
    url: "https://status.epicgames.com"
  },
  {
    id: "rocket-league",
    name: "Rocket League",
    network: "Epic Games",
    region: "Global",
    url: "https://status.epicgames.com"
  },
  {
    id: "fall-guys",
    name: "Fall Guys",
    network: "Epic Games",
    region: "Global",
    url: "https://status.epicgames.com"
  },
  {
    id: "valorant",
    name: "Valorant",
    network: "Riot Games",
    region: "Global",
    url: "https://status.riotgames.com"
  },
  {
    id: "league",
    name: "League of Legends",
    network: "Riot Games",
    region: "Global",
    url: "https://status.riotgames.com"
  },
  {
    id: "tft",
    name: "Teamfight Tactics",
    network: "Riot Games",
    region: "Global",
    url: "https://status.riotgames.com"
  },
  {
    id: "wild-rift",
    name: "Wild Rift",
    network: "Riot Games",
    region: "Global",
    url: "https://status.riotgames.com"
  },
  {
    id: "steam",
    name: "Steam",
    network: "Valve",
    region: "Global",
    url: "https://store.steampowered.com"
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    network: "Valve",
    region: "Global",
    url: "https://store.steampowered.com"
  },
  {
    id: "dota2",
    name: "Dota 2",
    network: "Valve",
    region: "Global",
    url: "https://store.steampowered.com"
  },
  {
    id: "roblox",
    name: "Roblox",
    network: "Roblox",
    region: "Global",
    url: "https://status.roblox.com"
  },
  {
    id: "minecraft",
    name: "Minecraft",
    network: "Mojang",
    region: "Global",
    url: "https://sessionserver.mojang.com"
  },
  {
    id: "apex",
    name: "Apex Legends",
    network: "EA",
    region: "Global",
    url: "https://www.ea.com/games/apex-legends"
  },
  {
    id: "fc",
    name: "EA Sports FC",
    network: "EA",
    region: "Global",
    url: "https://www.ea.com/games/ea-sports-fc"
  },
  {
    id: "battlefield",
    name: "Battlefield",
    network: "EA",
    region: "Global",
    url: "https://www.ea.com/games/battlefield"
  },
  {
    id: "cod",
    name: "Call of Duty",
    network: "Activision",
    region: "Global",
    url: "https://support.activision.com/onlineservices"
  },
  {
    id: "warzone",
    name: "Warzone",
    network: "Activision",
    region: "Global",
    url: "https://support.activision.com/onlineservices"
  },
  {
    id: "overwatch",
    name: "Overwatch 2",
    network: "Battle.net",
    region: "Global",
    url: "https://overwatch.blizzard.com"
  },
  {
    id: "wow",
    name: "World of Warcraft",
    network: "Battle.net",
    region: "Global",
    url: "https://worldofwarcraft.blizzard.com"
  },
  {
    id: "diablo",
    name: "Diablo",
    network: "Battle.net",
    region: "Global",
    url: "https://diablo.blizzard.com"
  },
  {
    id: "destiny",
    name: "Destiny 2",
    network: "Bungie",
    region: "Global",
    url: "https://www.bungie.net"
  },
  {
    id: "r6",
    name: "Rainbow Six Siege",
    network: "Ubisoft",
    region: "Global",
    url: "https://www.ubisoft.com/en-us/game/rainbow-six/siege/status"
  },
  {
    id: "the-division",
    name: "The Division",
    network: "Ubisoft",
    region: "Global",
    url: "https://www.ubisoft.com"
  },
  {
    id: "pubg",
    name: "PUBG",
    network: "Krafton",
    region: "Global",
    url: "https://pubg.com"
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    network: "HoYoverse",
    region: "Global",
    url: "https://genshin.hoyoverse.com"
  },
  {
    id: "star-rail",
    name: "Honkai: Star Rail",
    network: "HoYoverse",
    region: "Global",
    url: "https://hsr.hoyoverse.com"
  },
  {
    id: "zzz",
    name: "Zenless Zone Zero",
    network: "HoYoverse",
    region: "Global",
    url: "https://zenless.hoyoverse.com"
  },
  {
    id: "warframe",
    name: "Warframe",
    network: "Digital Extremes",
    region: "Global",
    url: "https://www.warframe.com"
  },
  {
    id: "ffxiv",
    name: "Final Fantasy XIV",
    network: "Square Enix",
    region: "Global",
    url: "https://na.finalfantasyxiv.com/lodestone/worldstatus/"
  },
  {
    id: "runescape",
    name: "RuneScape",
    network: "Jagex",
    region: "Global",
    url: "https://secure.runescape.com"
  },
  {
    id: "osrs",
    name: "Old School RuneScape",
    network: "Jagex",
    region: "Global",
    url: "https://oldschool.runescape.com"
  },
  {
    id: "tarkov",
    name: "Escape from Tarkov",
    network: "Battlestate",
    region: "Global",
    url: "https://status.escapefromtarkov.com"
  },
  {
    id: "palworld",
    name: "Palworld",
    network: "Pocketpair",
    region: "Global",
    url: "https://www.pocketpair.jp/palworld"
  },
  {
    id: "helldivers",
    name: "Helldivers 2",
    network: "Arrowhead",
    region: "Global",
    url: "https://www.arrowheadgamestudios.com"
  },
  {
    id: "playstation",
    name: "PlayStation Network",
    network: "Sony",
    region: "Global",
    url: "https://status.playstation.com"
  },
  {
    id: "xbox",
    name: "Xbox Network",
    network: "Microsoft",
    region: "Global",
    url: "https://support.xbox.com/xbox-live-status"
  },
  {
    id: "nintendo",
    name: "Nintendo Network",
    network: "Nintendo",
    region: "Global",
    url: "https://www.nintendo.com/consumer/network/en_na/network_status.jsp"
  },
  {
    id: "pokemon-go",
    name: "Pokemon GO",
    network: "Niantic",
    region: "Global",
    url: "https://niantic.helpshift.com"
  }
];
const state = {
  running: false,
  controller: null,
  history: loadHistory(),
  serverCatalog: DEFAULT_SERVERS,
  servers: DEFAULT_SERVERS,
  blockedServerIds: new Set(),
  user: null,
  githubCommitsLoaded: false,
  gameServersLoaded: false
};

const els = {
  body: document.body,
  auth: document.querySelector("#auth"),
  authCanvas: document.querySelector("#authCanvas"),
  siteCanvas: document.querySelector("#siteCanvas"),
  app: document.querySelector("#app"),
  appOnly: document.querySelectorAll(".app-only"),
  authTabs: document.querySelectorAll("[data-auth-mode]"),
  registerForm: document.querySelector("#registerForm"),
  loginForm: document.querySelector("#loginForm"),
  registerUsername: document.querySelector("#registerUsername"),
  registerPassword: document.querySelector("#registerPassword"),
  registerCaptchaQuestion: document.querySelector("#registerCaptchaQuestion"),
  registerCaptchaToken: document.querySelector("#registerCaptchaToken"),
  registerCaptchaAnswer: document.querySelector("#registerCaptchaAnswer"),
  refreshRegisterCaptcha: document.querySelector("#refreshRegisterCaptcha"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginCaptchaQuestion: document.querySelector("#loginCaptchaQuestion"),
  loginCaptchaToken: document.querySelector("#loginCaptchaToken"),
  loginCaptchaAnswer: document.querySelector("#loginCaptchaAnswer"),
  refreshLoginCaptcha: document.querySelector("#refreshLoginCaptcha"),
  authStatus: document.querySelector("#authStatus"),
  visitorIp: document.querySelector("#visitorIp"),
  visitorUserAgent: document.querySelector("#visitorUserAgent"),
  toolsButton: document.querySelector("#toolsButton"),
  toolsMenu: document.querySelector("#toolsMenu"),
  toolLinks: document.querySelectorAll("[data-tool-link]"),
  accountButton: document.querySelector("#accountButton"),
  accountMenu: document.querySelector("#accountMenu"),
  profileMenuButton: document.querySelector("#profileMenuButton"),
  logout: document.querySelector("#logoutButton"),
  adminLink: document.querySelector("#adminLink"),
  adminView: document.querySelector("#admin"),
  adminStatus: document.querySelector("#adminStatus"),
  adminEvents: document.querySelector("#adminEvents"),
  refreshAdmin: document.querySelector("#refreshAdmin"),
  home: document.querySelector("#home"),
  githubCommitHeatmap: document.querySelector("#githubCommitHeatmap"),
  githubCommitTotal: document.querySelector("#githubCommitTotal"),
  githubCommitStatus: document.querySelector("#githubCommitStatus"),
  profileView: document.querySelector("#profile"),
  profileTitle: document.querySelector("#profile-title"),
  profileStatus: document.querySelector("#profileStatus"),
  profileAvatarPreview: document.querySelector("#profileAvatarPreview"),
  profileForm: document.querySelector("#profileForm"),
  profileAvatar: document.querySelector("#profileAvatar"),
  profileAbout: document.querySelector("#profileAbout"),
  passwordForm: document.querySelector("#passwordForm"),
  currentPassword: document.querySelector("#currentPassword"),
  newPassword: document.querySelector("#newPassword"),
  emailResetForm: document.querySelector("#emailResetForm"),
  resetEmail: document.querySelector("#resetEmail"),
  emailResetStatus: document.querySelector("#emailResetStatus"),
  visitProfileForm: document.querySelector("#visitProfileForm"),
  visitUsername: document.querySelector("#visitUsername"),
  publicProfileResult: document.querySelector("#publicProfileResult"),
  speedView: document.querySelector("#speed"),
  serverPingView: document.querySelector("#server-ping"),
  refreshGameServers: document.querySelector("#refreshGameServers"),
  gameServerStatus: document.querySelector("#gameServerStatus"),
  gameServerList: document.querySelector("#gameServerList"),
  gameServersOnline: document.querySelector("#gameServersOnline"),
  gameServersFastest: document.querySelector("#gameServersFastest"),
  gameServersChecked: document.querySelector("#gameServersChecked"),
  viewLinks: document.querySelectorAll("[data-view-link]"),
  refreshServers: document.querySelector("#refreshServers"),
  serverCheckStatus: document.querySelector("#serverCheckStatus"),
  serverCheckList: document.querySelector("#serverCheckList"),
  start: document.querySelector("#startTest"),
  stop: document.querySelector("#stopTest"),
  phase: document.querySelector("#phaseLabel"),
  primary: document.querySelector("#primaryValue"),
  unit: document.querySelector("#primaryUnit"),
  status: document.querySelector("#statusText"),
  dial: document.querySelector(".dial"),
  dialProgress: document.querySelector(".dial-progress"),
  ping: document.querySelector("#pingValue"),
  download: document.querySelector("#downloadValue"),
  upload: document.querySelector("#uploadValue"),
  jitter: document.querySelector("#jitterValue"),
  score: document.querySelector("#scoreValue"),
  quality: document.querySelector("#qualityValue"),
  loadedLatency: document.querySelector("#loadedLatencyValue"),
  loss: document.querySelector("#lossValue"),
  historyList: document.querySelector("#historyList"),
  template: document.querySelector("#historyItemTemplate"),
  server: document.querySelector("#serverSelect"),
  durations: document.querySelectorAll("input[name='testDuration']"),
  saveHistory: document.querySelector("#saveHistory"),
  clear: document.querySelector("#clearHistory"),
  exportCsv: document.querySelector("#exportCsv")
};

els.authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
});
els.registerForm.addEventListener("submit", register);
els.loginForm.addEventListener("submit", login);
els.refreshRegisterCaptcha.addEventListener("click", () => loadCaptcha("register"));
els.refreshLoginCaptcha.addEventListener("click", () => loadCaptcha("login"));
els.toolsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleToolsMenu();
});
els.toolLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeToolsMenu();
    if (link.dataset.toolLink === "server-ping") {
      showServerPingView();
    } else {
      showSpeedView();
    }
  });
});
els.accountButton.addEventListener("click", (event) => {
  event.stopPropagation();
  closeToolsMenu();
  toggleAccountMenu();
});
els.profileMenuButton.addEventListener("click", () => {
  closeAccountMenu();
  showProfileView();
});
els.adminLink.addEventListener("click", () => {
  closeAccountMenu();
  showAdminView();
});
els.logout.addEventListener("click", logout);
els.profileForm.addEventListener("submit", saveProfile);
els.passwordForm.addEventListener("submit", updatePassword);
els.emailResetForm.addEventListener("submit", requestEmailReset);
els.visitProfileForm.addEventListener("submit", visitProfile);
els.refreshAdmin.addEventListener("click", loadAdminEvents);
els.refreshServers.addEventListener("click", () => checkAllServers());
els.refreshGameServers.addEventListener("click", () => checkGameServers());
els.start.addEventListener("click", runTest);
els.stop.addEventListener("click", stopTest);
els.clear.addEventListener("click", clearHistory);
els.exportCsv.addEventListener("click", exportCsv);
els.viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.dataset.viewLink === "speed") {
      showSpeedView();
    } else {
      showHomeView();
    }
  });
});
document.addEventListener("click", (event) => {
  if (
    !els.toolsMenu.hidden
    && !event.target.closest("#toolsButton")
    && !event.target.closest("#toolsMenu")
  ) {
    closeToolsMenu();
  }
  if (
    !els.accountMenu.hidden
    && !event.target.closest("#accountButton")
    && !event.target.closest("#accountMenu")
  ) {
    closeAccountMenu();
  }
});
window.addEventListener("hashchange", applyRoute);

initialize();
initAuthBackground();
initSiteBackground();
initUiAnimations();

async function register(event) {
  event.preventDefault();
  setAuthStatus("Creating account...");
  setAuthBusy(true);

  try {
    const user = await authRequest("/api/register", {
      username: normalizeUsername(els.registerUsername.value),
      password: els.registerPassword.value,
      captchaToken: els.registerCaptchaToken.value,
      captchaAnswer: els.registerCaptchaAnswer.value,
      client: getClientContext()
    });
    await enterApp(user, { route: "home" });
  } catch (error) {
    setAuthStatus(error.message || "Registration failed.", "error");
    loadCaptcha("register");
  } finally {
    setAuthBusy(false);
  }
}

async function login(event) {
  event.preventDefault();
  setAuthStatus("Logging in...");
  setAuthBusy(true);

  try {
    const user = await authRequest("/api/login", {
      username: normalizeUsername(els.loginUsername.value),
      password: els.loginPassword.value,
      captchaToken: els.loginCaptchaToken.value,
      captchaAnswer: els.loginCaptchaAnswer.value,
      client: getClientContext()
    });
    await enterApp(user, { route: "home" });
  } catch (error) {
    setAuthStatus(error.message || "Login failed.", "error");
    loadCaptcha("login");
  } finally {
    setAuthBusy(false);
  }
}

async function logout() {
  if (state.running) stopTest();
  closeAccountMenu();

  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    // The interface still returns to auth if the network drops during logout.
  }

  state.user = null;
  els.body.dataset.auth = "guest";
  els.appOnly.forEach((node) => {
    node.hidden = true;
  });
  els.auth.hidden = false;
  setAuthMode("login");
  setAuthStatus("Logged out.");
}

async function restoreSession() {
  try {
    const response = await fetch("/api/session", {
      cache: "no-store",
      credentials: "same-origin"
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.authenticated ? data.user : null;
  } catch {
    return null;
  }
}

async function runTest() {
  if (state.running) return;

  const durationSeconds = getSelectedDuration();
  const pingCount = durationSeconds >= 45 ? 8 : 6;
  const controller = new AbortController();
  let activeServer = null;
  state.running = true;
  state.controller = controller;
  setRunning(true);
  resetReadout();

  try {
    const server = await resolveSelectedServer(controller.signal);
    activeServer = server;

    setPhase("Ping", 6, `Finding latency to ${server.name}`);
    const latency = await measurePing(server, pingCount, controller.signal);
    updateMetric("ping", latency.ping);
    updateMetric("jitter", latency.jitter);
    els.loss.textContent = `${latency.loss.toFixed(0)}%`;

    setPhase("Download", 18, `Measuring inbound throughput from ${server.name} for ${durationSeconds}s`);
    const download = await measureTransfer({
      server,
      bytesList: TRANSFER_CHUNKS.download,
      durationSeconds,
      direction: "download",
      signal: controller.signal,
      progressStart: 18,
      progressEnd: 58
    });
    updateMetric("download", download.mbps);

    setPhase("Upload", 62, `Measuring outbound throughput to ${server.name} for ${durationSeconds}s`);
    const upload = await measureTransfer({
      server,
      bytesList: TRANSFER_CHUNKS.upload,
      durationSeconds,
      direction: "upload",
      signal: controller.signal,
      progressStart: 62,
      progressEnd: 90
    });
    updateMetric("upload", upload.mbps);

    setPhase("Loaded", 94, "Checking latency under load");
    const loadedLatency = await measureLoadedLatency(server, controller.signal);

    const result = buildResult({
      server,
      latency,
      download,
      upload,
      loadedLatency
    });

    showResult(result);
    if (els.saveHistory.checked) saveResult(result);
    setPhase("Complete", 100, `Finished ${formatTime(result.createdAt)}`);
  } catch (error) {
    if (error.name === "AbortError") {
      setPhase("Stopped", 0, "Test stopped before saving a result.");
    } else {
      setPhase("Offline", 0, "Test could not complete. Check the connection or CORS access to the selected endpoint.");
      markServerUnavailable(activeServer);
      console.error(error);
    }
  } finally {
    state.running = false;
    state.controller = null;
    setRunning(false);
  }
}

function stopTest() {
  if (state.controller) state.controller.abort();
}

function getSelectedDuration() {
  const selected = [...els.durations].find((input) => input.checked);
  return Number(selected ? selected.value : 15);
}

async function initialize() {
  loadVisitorDisclosure();
  const user = await restoreSession();
  if (user) {
    await enterApp(user, { route: "current" });
  } else {
    showAuth();
  }
}

async function enterApp(user, { route = "home" } = {}) {
  state.user = user;
  els.body.dataset.auth = "authenticated";
  els.auth.hidden = true;
  els.appOnly.forEach((node) => {
    node.hidden = false;
  });
  const isAdmin = user.username === "seb";
  els.adminLink.hidden = !isAdmin;
  els.adminLink.tabIndex = isAdmin ? 0 : -1;
  els.adminLink.setAttribute("aria-hidden", String(!isAdmin));
  els.adminLink.textContent = isAdmin ? "Admin" : "";
  els.accountButton.textContent = `@${user.username || "user"}`;
  setAuthStatus(`Signed in as @${user.username || "user"}.`, "success");

  state.serverCatalog = await loadServers();
  state.servers = getFallbackServers();
  populateServerSelect();
  renderHistory();
  loadGitHubCommitTracker();
  loadProfile();
  checkAllServers();
  if (route === "current") {
    applyRoute();
  } else {
    showHomeView();
  }
}

function showAuth() {
  els.body.dataset.auth = "guest";
  els.appOnly.forEach((node) => {
    node.hidden = true;
  });
  els.adminLink.hidden = true;
  els.adminLink.tabIndex = -1;
  els.adminLink.setAttribute("aria-hidden", "true");
  els.adminView.hidden = true;
  closeAccountMenu();
  els.auth.hidden = false;
  setAuthMode("register");
  setAuthStatus("Register to enter Linje.dev.");
}

function setAuthMode(mode) {
  const isRegister = mode === "register";
  els.registerForm.hidden = !isRegister;
  els.loginForm.hidden = isRegister;
  els.authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authMode === mode);
  });
  setAuthStatus(isRegister ? "Choose a clean @username and create your account." : "Welcome back.");
  loadCaptcha(isRegister ? "register" : "login");
}

function setAuthBusy(busy) {
  [...els.registerForm.elements, ...els.loginForm.elements, ...els.authTabs].forEach((element) => {
    element.disabled = busy;
  });
}

function setAuthStatus(message, tone = "") {
  els.authStatus.textContent = message;
  if (tone) {
    els.authStatus.dataset.tone = tone;
  } else {
    delete els.authStatus.dataset.tone;
  }
}

async function loadCaptcha(mode) {
  const prefix = mode === "login" ? "login" : "register";
  const question = els[`${prefix}CaptchaQuestion`];
  const token = els[`${prefix}CaptchaToken`];
  const answer = els[`${prefix}CaptchaAnswer`];
  if (!question || !token || !answer) return;

  question.textContent = "Loading...";
  token.value = "";
  answer.value = "";

  try {
    const response = await fetch("/api/captcha", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Captcha unavailable.");
    question.textContent = data.question || "Complete the check.";
    token.value = data.token || "";
  } catch {
    question.textContent = "Refresh to retry.";
  }
}

async function authRequest(path, body) {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Account service is not available yet.");
  }
  return data.user;
}

function normalizeUsername(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function getClientContext() {
  return {
    language: navigator.language || "",
    languages: Array.isArray(navigator.languages) ? navigator.languages.slice(0, 5) : [],
    platform: navigator.platform || "",
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };
}

async function loadGitHubCommitTracker() {
  if (state.githubCommitsLoaded) return;
  state.githubCommitsLoaded = true;
  updateGitHubCommitTracker("--", "Loading commits for linjedev...");

  try {
    const response = await fetch(GITHUB_COMMITS_URL, {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Number.isFinite(data.totalCommits)) {
      throw new Error(data.error || "Commit total is unavailable.");
    }
    const status = data.fallback
      ? data.status || "Snapshot from latest deployment."
      : `Live from GitHub. Cached for ${data.cachedFor || 60}s.`;
    updateGitHubCommitTracker(data.totalCommits, status, data.hourBuckets || []);
  } catch {
    updateGitHubCommitTracker("--", "Commit total unavailable.", []);
  }
}

function updateGitHubCommitTracker(count, status, hourBuckets = []) {
  if (!els.githubCommitTotal || !els.githubCommitStatus) return;
  els.githubCommitTotal.textContent = Number.isFinite(count) ? new Intl.NumberFormat().format(count) : String(count);
  els.githubCommitStatus.textContent = status;
  renderCommitHeatmap(hourBuckets);
}

function renderCommitHeatmap(hourBuckets) {
  if (!els.githubCommitHeatmap) return;
  const buckets = Array.from({ length: 24 }, (_, hour) => {
    const bucket = hourBuckets.find((item) => item.hour === hour) || { commits: [], count: 0, hour };
    return {
      commits: bucket.commits || [],
      count: Number(bucket.count) || 0,
      hour
    };
  });
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  els.githubCommitHeatmap.innerHTML = "";
  buckets.forEach((bucket) => {
    const hour = document.createElement("section");
    hour.className = "commit-hour";

    const label = document.createElement("span");
    label.textContent = formatHour(bucket.hour);
    hour.append(label);

    const cells = document.createElement("div");
    cells.className = "commit-cells";
    const cellCount = Math.max(3, bucket.count);
    for (let index = 0; index < cellCount; index += 1) {
      const cell = document.createElement("i");
      const active = index < bucket.count;
      const level = active ? Math.max(1, Math.ceil((bucket.count / maxCount) * 4)) : 0;
      cell.dataset.level = String(level);
      cell.title = `${bucket.count} commits around ${formatHour(bucket.hour)}`;
      cells.append(cell);
    }
    hour.append(cells);
    els.githubCommitHeatmap.append(hour);
  });
  animate(els.githubCommitHeatmap.querySelectorAll(".commit-hour"), {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 360,
    delay: window.anime ? window.anime.stagger(18) : 0,
    easing: "easeOutCubic"
  });
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

async function loadVisitorDisclosure() {
  const fallback = {
    ipAddress: "unavailable",
    userAgent: navigator.userAgent || "unavailable"
  };

  try {
    const response = await fetch("/api/visitor", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = response.ok ? await response.json() : fallback;
    renderVisitorDisclosure(data);
  } catch {
    renderVisitorDisclosure(fallback);
  }
}

function renderVisitorDisclosure(data) {
  if (els.visitorIp) {
    els.visitorIp.textContent = data.ipAddress || "unavailable";
  }
  if (els.visitorUserAgent) {
    els.visitorUserAgent.textContent = data.userAgent || "unavailable";
  }
}

function initSiteBackground() {
  const canvas = els.siteCanvas;
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  const pointer = {
    x: window.innerWidth * .5,
    y: window.scrollY + window.innerHeight * .5,
    targetX: window.innerWidth * .5,
    targetY: window.scrollY + window.innerHeight * .5
  };
  const ribbons = Array.from({ length: 22 }, (_, index) => ({
    base: .05 + index * .042,
    phase: index * .62,
    speed: .12 + index * .007,
    amplitude: 16 + (index % 5) * 9,
    drift: index % 2 ? 1 : -1
  }));
  const particles = Array.from({ length: 42 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    phase: index * 1.6,
    size: .7 + Math.random() * 1.7,
    speed: .07 + Math.random() * .13
  }));
  let width = 0;
  let height = 0;
  let dpr = 1;
  let started = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = measureSiteBackgroundHeight();
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function measureSiteBackgroundHeight() {
    const contentBottom = [...document.body.children].reduce((bottom, node) => {
      if (node === canvas || node.hidden) return bottom;
      const rect = node.getBoundingClientRect();
      return Math.max(bottom, rect.bottom + window.scrollY);
    }, 0);
    return Math.ceil(Math.max(window.innerHeight, contentBottom + 96));
  }

  function move(x, y) {
    pointer.targetX = x;
    pointer.targetY = y + window.scrollY;
  }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", resize, { passive: true });
  window.addEventListener("pointermove", (event) => move(event.clientX, event.clientY), { passive: true });
  window.addEventListener("touchmove", (event) => {
    if (event.touches.length === 1) {
      move(event.touches[0].clientX, event.touches[0].clientY);
    }
  }, { passive: true });

  resize();
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(document.body);
  }
  requestAnimationFrame(drawSiteBackground);

  function drawSiteBackground(now) {
    if (els.body.dataset.auth !== "authenticated") {
      requestAnimationFrame(drawSiteBackground);
      return;
    }

    const time = (now - started) / 1000;
    pointer.x += (pointer.targetX - pointer.x) * .06;
    pointer.y += (pointer.targetY - pointer.y) * .06;

    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
    drawSiteGrid(time);
    drawSiteRibbons(time);
    drawSiteParticles(time);

    requestAnimationFrame(drawSiteBackground);
  }

  function drawSiteGrid(time) {
    context.save();
    context.strokeStyle = "rgba(247, 247, 242, .055)";
    context.lineWidth = 1;
    const spacing = width < 640 ? 56 : 82;
    const offsetX = (time * 7) % spacing;
    const offsetY = (time * 4) % spacing;

    for (let x = -spacing; x < width + spacing; x += spacing) {
      context.beginPath();
      context.moveTo(x + offsetX, 0);
      context.lineTo(x - width * .18 + offsetX, height);
      context.stroke();
    }

    for (let y = -spacing; y < height + spacing; y += spacing) {
      context.beginPath();
      context.moveTo(0, y + offsetY);
      context.lineTo(width, y - height * .12 + offsetY);
      context.stroke();
    }
    context.restore();
  }

  function drawSiteRibbons(time) {
    context.save();
    ribbons.forEach((ribbon, index) => {
      const yBase = height * ribbon.base;
      const glow = Math.max(0, 1 - Math.abs(pointer.y - yBase) / 220);
      context.globalAlpha = .08 + glow * .18;
      context.strokeStyle = index % 4 === 0 ? "rgba(247, 247, 242, .42)" : "rgba(247, 247, 242, .24)";
      context.lineWidth = index % 4 === 0 ? 2 : 1;
      context.beginPath();
      for (let x = -80; x <= width + 80; x += 18) {
        const wave = Math.sin((x * .008) + ribbon.phase + time * ribbon.speed)
          + Math.sin((x * .017) - ribbon.phase + time * ribbon.speed * 1.6) * .42;
        const pull = Math.max(0, 1 - Math.abs(x - pointer.x) / 260) * glow * 36;
        const y = yBase + wave * ribbon.amplitude + pull * ribbon.drift;
        if (x === -80) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });
    context.restore();
  }

  function drawSiteParticles(time) {
    context.save();
    particles.forEach((particle) => {
      const x = ((particle.x * width) + Math.sin(time * particle.speed + particle.phase) * 38 + width) % width;
      const y = ((particle.y * height) + Math.cos(time * particle.speed * 1.5 + particle.phase) * 24 + height) % height;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const glow = Math.max(0, 1 - distance / 180);

      context.globalAlpha = .07 + glow * .2;
      context.fillStyle = "#f7f7f2";
      context.beginPath();
      context.arc(x + (dx / distance) * glow * 20, y + (dy / distance) * glow * 20, particle.size + glow * 1.5, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }
}

function initAuthBackground() {
  const canvas = els.authCanvas;
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  const pointer = {
    x: window.innerWidth * .5,
    y: window.innerHeight * .5,
    targetX: window.innerWidth * .5,
    targetY: window.innerHeight * .5,
    active: false
  };
  const ribbons = Array.from({ length: 24 }, (_, index) => ({
    base: .03 + index * .043,
    phase: index * .58,
    speed: .16 + index * .009,
    amplitude: 18 + (index % 6) * 10,
    drift: index % 2 ? 1 : -1
  }));
  const particles = Array.from({ length: 46 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    phase: index * 1.8,
    size: .7 + Math.random() * 1.8,
    speed: .08 + Math.random() * .15
  }));
  const logo = {
    text: "Linje.dev",
    x: 0,
    y: 0,
    vx: 112,
    vy: 86,
    width: 170,
    height: 44,
    fontSize: 24,
    initialized: false,
    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastX: 0,
    lastY: 0,
    lastMoveTime: 0,
    lastGlueTime: 0,
    holdUntil: 0,
    lastInteraction: 0,
    edgeHits: 0,
    lastCornerAim: 0
  };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let started = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateLogoMetrics();
  }

  function move(x, y, active = true, target = null) {
    pointer.targetX = x;
    pointer.targetY = y;
    pointer.active = active;
    els.auth.style.setProperty("--pointer-x", `${(x / Math.max(width, 1)) * 100}%`);
    els.auth.style.setProperty("--pointer-y", `${(y / Math.max(height, 1)) * 100}%`);
    interactWithLogo(x, y, target);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    move(event.clientX, event.clientY, true, target);
  }, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    if (els.body.dataset.auth === "authenticated") return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(".auth-card")) return;
    if (!isPointNearLogo(event.clientX, event.clientY, 26)) return;

    captureLogo(event.clientX, event.clientY, performance.now());
  }, { passive: true });
  window.addEventListener("pointerup", releaseLogo, { passive: true });
  window.addEventListener("pointercancel", releaseLogo, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
    releaseLogo();
  }, { passive: true });
  window.addEventListener("touchmove", (event) => {
    if (els.body.dataset.auth !== "authenticated" && event.touches.length === 1) {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      move(touch.clientX, touch.clientY, true, target);
      if (!target?.closest(".auth-card")) {
        event.preventDefault();
      }
    }
  }, { passive: false });
  window.addEventListener("touchend", releaseLogo, { passive: true });
  window.addEventListener("touchcancel", releaseLogo, { passive: true });

  resize();
  requestAnimationFrame(drawAuthBackground);

  function drawAuthBackground(now) {
    if (els.auth.hidden || els.body.dataset.auth === "authenticated") {
      requestAnimationFrame(drawAuthBackground);
      return;
    }

    const time = (now - started) / 1000;
    pointer.x += (pointer.targetX - pointer.x) * .08;
    pointer.y += (pointer.targetY - pointer.y) * .08;

    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);

    drawGrid(time);
    drawRibbons(time);
    drawParticles(time);
    drawBouncingLogo(time, now);

    requestAnimationFrame(drawAuthBackground);
  }

  function updateLogoMetrics() {
    logo.fontSize = Math.max(20, Math.min(30, width * .026));
    const markSize = logo.fontSize * 1.45;
    context.font = `700 ${logo.fontSize}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    logo.width = markSize + logo.fontSize * .55 + context.measureText(logo.text).width;
    logo.height = markSize;

    if (!logo.initialized) {
      logo.x = width * .16;
      logo.y = Math.max(22, height * .1);
      logo.initialized = true;
    }

    clampLogo();
  }

  function clampLogo() {
    logo.x = Math.max(10, Math.min(width - logo.width - 10, logo.x));
    logo.y = Math.max(10, Math.min(height - logo.height - 10, logo.y));
  }

  function isPointNearLogo(x, y, padding = 0) {
    return x >= logo.x - padding
      && x <= logo.x + logo.width + padding
      && y >= logo.y - padding
      && y <= logo.y + logo.height + padding;
  }

  function interactWithLogo(x, y, target = null) {
    const now = performance.now();
    if (target?.closest(".auth-card")) {
      releaseLogo();
      return;
    }

    if (!logo.dragging && isPointNearLogo(x, y, 34)) {
      captureLogo(x, y, now);
    }

    if (logo.dragging) {
      const dt = Math.max(16, now - logo.lastMoveTime) / 1000;
      logo.vx = (x - logo.lastX) / dt * .92;
      logo.vy = (y - logo.lastY) / dt * .92;
      capLogoSpeed(width < 640 ? 620 : 780);
      logo.x = x - logo.dragOffsetX;
      logo.y = y - logo.dragOffsetY;
      logo.lastX = x;
      logo.lastY = y;
      logo.lastMoveTime = now;
      logo.lastGlueTime = now;
      logo.lastInteraction = now;
      logo.holdUntil = now + 90;
      clampLogo();
      return;
    }

    const centerX = logo.x + logo.width * .5;
    const centerY = logo.y + logo.height * .5;
    const dx = centerX - x;
    const dy = centerY - y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const influence = Math.max(0, 1 - distance / 170);
    if (influence > 0) {
      logo.vx += (dx / distance) * influence * 11;
      logo.vy += (dy / distance) * influence * 11;
      logo.lastInteraction = now;
      logo.holdUntil = Math.max(logo.holdUntil, now + 550);
    }
  }

  function captureLogo(x, y, now) {
    logo.dragging = true;
    logo.dragOffsetX = logo.width * .5;
    logo.dragOffsetY = logo.height * .5;
    logo.lastX = x;
    logo.lastY = y;
    logo.lastMoveTime = now;
    logo.lastGlueTime = now;
    logo.lastInteraction = now;
    logo.holdUntil = now + 90;
  }

  function releaseLogo() {
    if (!logo.dragging) return;
    logo.dragging = false;
    boostReleaseVelocity();
    keepLogoMoving(146);
    logo.lastInteraction = performance.now();
    logo.holdUntil = logo.lastInteraction + 90;
  }

  function drawBouncingLogo(time, now) {
    const dt = Math.min(.04, Math.max(.001, (now - (drawBouncingLogo.previous || now)) / 1000));
    drawBouncingLogo.previous = now;

    if (logo.dragging && now - logo.lastGlueTime > 140) {
      releaseLogo();
    }

    if (!logo.dragging && now > logo.holdUntil) {
      keepLogoMoving(width < 640 ? 90 : 118);
      const speed = Math.sqrt(logo.vx * logo.vx + logo.vy * logo.vy) || 1;
      const targetSpeed = width < 640 ? 98 : 132;
      logo.vx += (logo.vx / speed) * (targetSpeed - speed) * .024;
      logo.vy += (logo.vy / speed) * (targetSpeed - speed) * .024;
      logo.x += logo.vx * dt;
      logo.y += logo.vy * dt;
    }

    let bounced = false;
    if (logo.x <= 10 || logo.x + logo.width >= width - 10) {
      logo.x = Math.max(10, Math.min(width - logo.width - 10, logo.x));
      logo.vx *= -1;
      bounced = true;
    }
    if (logo.y <= 10 || logo.y + logo.height >= height - 10) {
      logo.y = Math.max(10, Math.min(height - logo.height - 10, logo.y));
      logo.vy *= -1;
      bounced = true;
    }

    if (bounced) {
      increaseCornerChance(now);
    }

    const pulse = Math.sin(time * 2.2) * .04;
    const idleGlow = Math.max(0, 1 - (now - logo.lastInteraction) / 2200);
    const markSize = logo.height;
    const textX = logo.x + markSize + logo.fontSize * .55;
    const textY = logo.y + logo.height * .72;

    context.save();
    context.translate(logo.x + logo.width * .5, logo.y + logo.height * .5);
    context.scale(1 + pulse * idleGlow, 1 + pulse * idleGlow);
    context.translate(-(logo.x + logo.width * .5), -(logo.y + logo.height * .5));

    context.shadowColor = "rgba(247, 247, 242, .24)";
    context.shadowBlur = 18 + idleGlow * 12;
    context.globalAlpha = .7 + idleGlow * .16;
    context.strokeStyle = "#f7f7f2";
    context.lineWidth = 2;
    context.strokeRect(logo.x + 1, logo.y + 1, markSize - 2, markSize - 2);

    context.beginPath();
    context.moveTo(logo.x + markSize * .22, logo.y + markSize * .36);
    context.lineTo(logo.x + markSize * .48, logo.y + markSize * .64);
    context.lineTo(logo.x + markSize * .8, logo.y + markSize * .3);
    context.stroke();

    context.shadowBlur = 16 + idleGlow * 10;
    context.globalAlpha = .82 + idleGlow * .12;
    context.font = `700 ${logo.fontSize}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    context.fillStyle = "#f7f7f2";
    context.fillText(logo.text, textX, textY);
    context.restore();
  }

  function keepLogoMoving(minSpeed) {
    const speed = Math.sqrt(logo.vx * logo.vx + logo.vy * logo.vy);
    if (speed < minSpeed * .45) {
      const centerX = logo.x + logo.width * .5;
      const centerY = logo.y + logo.height * .5;
      const dx = width * .5 - centerX || 1;
      const dy = height * .5 - centerY || .65;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      logo.vx = (dx / distance) * minSpeed;
      logo.vy = (dy / distance) * minSpeed;
    }

    if (logo.x <= 10 && logo.vx < 0) logo.vx = Math.abs(logo.vx);
    if (logo.x + logo.width >= width - 10 && logo.vx > 0) logo.vx = -Math.abs(logo.vx);
    if (logo.y <= 10 && logo.vy < 0) logo.vy = Math.abs(logo.vy);
    if (logo.y + logo.height >= height - 10 && logo.vy > 0) logo.vy = -Math.abs(logo.vy);
  }

  function boostReleaseVelocity() {
    const speed = Math.sqrt(logo.vx * logo.vx + logo.vy * logo.vy);
    if (!speed) return;

    const minFlick = width < 640 ? 180 : 220;
    const maxFlick = width < 640 ? 720 : 940;
    const boost = speed > minFlick ? 1.35 : 1.08;
    logo.vx *= boost;
    logo.vy *= boost;
    capLogoSpeed(maxFlick);
  }

  function capLogoSpeed(maxSpeed) {
    const speed = Math.sqrt(logo.vx * logo.vx + logo.vy * logo.vy);
    if (speed <= maxSpeed || !speed) return;
    logo.vx = (logo.vx / speed) * maxSpeed;
    logo.vy = (logo.vy / speed) * maxSpeed;
  }

  function increaseCornerChance(now) {
    logo.edgeHits += 1;
    if (now - logo.lastInteraction < 1600 || now - logo.lastCornerAim < 900) return;
    if (logo.edgeHits % 3 !== 0 && Math.random() > .38) return;

    const targetSpeed = width < 640 ? 112 : 148;
    const targetX = logo.vx >= 0 ? width - logo.width - 10 : 10;
    const targetY = logo.vy >= 0 ? height - logo.height - 10 : 10;
    const dx = targetX - logo.x;
    const dy = targetY - logo.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    logo.vx = (dx / distance) * targetSpeed;
    logo.vy = (dy / distance) * targetSpeed;
    logo.lastCornerAim = now;
  }

  function drawGrid(time) {
    context.save();
    context.globalAlpha = .08;
    context.strokeStyle = "#f7f7f2";
    context.lineWidth = 1;
    const gap = 64;
    const offset = (time * 10) % gap;
    for (let x = -gap; x < width + gap; x += gap) {
      context.beginPath();
      context.moveTo(x + offset, 0);
      context.lineTo(x - height * .18 + offset, height);
      context.stroke();
    }
    for (let y = -gap; y < height + gap; y += gap) {
      context.beginPath();
      context.moveTo(0, y + offset);
      context.lineTo(width, y - width * .1 + offset);
      context.stroke();
    }
    context.restore();
  }

  function drawRibbons(time) {
    ribbons.forEach((ribbon, ribbonIndex) => {
      const yBase = height * ribbon.base;
      const points = [];
      const step = 24;

      for (let x = -120; x <= width + 120; x += step) {
        const wave = Math.sin((x * .008) + ribbon.phase + time * ribbon.speed)
          + Math.sin((x * .017) - ribbon.phase + time * ribbon.speed * 1.7) * .45;
        let y = yBase + wave * ribbon.amplitude + Math.sin(time * .22 + ribbonIndex) * 34 * ribbon.drift;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const influence = Math.max(0, 1 - distance / 260);
        y += (dy / distance) * influence * (pointer.active ? 92 : 38);
        points.push({ x, y });
      }

      context.save();
      context.globalAlpha = .11 + (ribbonIndex % 5) * .026;
      context.strokeStyle = "#f7f7f2";
      context.lineWidth = ribbonIndex % 4 === 0 ? 1.45 : .82;
      context.beginPath();
      points.forEach((point, index) => {
        if (!index) {
          context.moveTo(point.x, point.y);
        } else {
          const previous = points[index - 1];
          context.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) / 2, (previous.y + point.y) / 2);
        }
      });
      context.stroke();
      context.restore();
    });
  }

  function drawParticles(time) {
    context.save();
    particles.forEach((particle) => {
      const x = ((particle.x * width) + Math.sin(time * particle.speed + particle.phase) * 42 + width) % width;
      const y = ((particle.y * height) + Math.cos(time * particle.speed * 1.6 + particle.phase) * 26 + height) % height;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const glow = Math.max(0, 1 - distance / 180);

      context.globalAlpha = .08 + glow * .26;
      context.fillStyle = "#f7f7f2";
      context.beginPath();
      context.arc(x + (dx / distance) * glow * 24, y + (dy / distance) * glow * 24, particle.size + glow * 1.8, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }
}

function applyRoute() {
  if (window.location.hash === "#admin") {
    showAdminView(false);
  } else if (window.location.hash === "#profile") {
    showProfileView(false);
  } else if (window.location.hash === "#server-ping") {
    showServerPingView(false);
  } else if (window.location.hash === "#speed" || window.location.hash === "#ranking") {
    showSpeedView(false);
  } else {
    showHomeView(false);
  }
}

function initUiAnimations() {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("button, .site-nav a, select, input, textarea");
    if (!target || target.disabled) return;
    animate(target, {
      duration: 160,
      easing: "easeOutQuad",
      scale: .985
    });
  });

  document.addEventListener("pointerup", (event) => {
    const target = event.target.closest("button, .site-nav a, select, input, textarea");
    if (!target) return;
    animate(target, {
      duration: 220,
      easing: "easeOutElastic(1, .65)",
      scale: 1
    });
  });
}

function animate(targets, options) {
  if (!window.anime || !targets) return;
  window.anime.remove(targets);
  window.anime({
    targets,
    ...options
  });
}

function animateView(view) {
  if (!window.anime || !view) return;
  const children = [...view.children].filter((node) => !node.hidden);
  const targets = children.length ? children : [view];
  window.anime.remove(targets);
  window.anime({
    targets,
    opacity: [0, 1],
    translateY: [16, 0],
    scale: [.992, 1],
    duration: 520,
    delay: window.anime.stagger(55),
    easing: "easeOutCubic"
  });
}

function animateMenuOpen(menu) {
  animate(menu, {
    opacity: [0, 1],
    translateY: [-8, 0],
    scale: [.96, 1],
    duration: 260,
    easing: "easeOutCubic"
  });
  animate([...menu.querySelectorAll("button")], {
    opacity: [0, 1],
    translateY: [-4, 0],
    duration: 240,
    delay: window.anime ? window.anime.stagger(35) : 0,
    easing: "easeOutCubic"
  });
}

function animateAccountMenuOpen() {
  animateMenuOpen(els.accountMenu);
}

function animateMetricPulse(target) {
  animate(target, {
    duration: 420,
    easing: "easeOutCubic",
    scale: [1.04, 1]
  });
}

function showSpeedView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = false;
  els.serverPingView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#speed");
  window.scrollTo({ top: 0 });
  animateView(els.speedView);
}

function showHomeView(updateHash = true) {
  els.home.hidden = false;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#home");
  window.scrollTo({ top: 0 });
  animateView(els.home);
}

function showServerPingView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = false;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#server-ping");
  window.scrollTo({ top: 0 });
  animateView(els.serverPingView);
  if (!state.gameServersLoaded) checkGameServers();
}

function showProfileView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.profileView.hidden = false;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  loadProfile();
  if (updateHash) history.pushState(null, "", "#profile");
  window.scrollTo({ top: 0 });
  animateView(els.profileView);
}

function showAdminView(updateHash = true) {
  if (!state.user || state.user.username !== "seb") {
    showHomeView(updateHash);
    return;
  }

  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = false;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#admin");
  window.scrollTo({ top: 0 });
  loadAdminEvents();
  animateView(els.adminView);
}

function toggleAccountMenu() {
  const open = els.accountMenu.hidden;
  els.accountMenu.hidden = !open;
  els.accountButton.setAttribute("aria-expanded", String(open));
  if (open) animateAccountMenuOpen();
}

function toggleToolsMenu() {
  const open = els.toolsMenu.hidden;
  els.toolsMenu.hidden = !open;
  els.toolsButton.setAttribute("aria-expanded", String(open));
  if (open) {
    closeAccountMenu();
    animateMenuOpen(els.toolsMenu);
  }
}

function closeToolsMenu() {
  if (!els.toolsMenu) return;
  els.toolsMenu.hidden = true;
  els.toolsButton.setAttribute("aria-expanded", "false");
}

function closeAccountMenu() {
  if (!els.accountMenu) return;
  els.accountMenu.hidden = true;
  els.accountButton.setAttribute("aria-expanded", "false");
}

async function loadProfile() {
  if (!state.user) return;
  els.profileTitle.textContent = `@${state.user.username || "user"}`;
  setProfileStatus("Manage your Linje.dev profile.");

  const fallback = getStoredProfile(state.user.username);
  renderProfileForm(fallback);

  try {
    const response = await fetch("/api/profile", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.profile) {
      renderProfileForm(data.profile);
      storeProfile(data.profile);
    }
  } catch {
  }
}

function renderProfileForm(profile = {}) {
  const username = profile.username || (state.user && state.user.username) || "user";
  els.profileAvatar.value = profile.avatarUrl || "";
  els.profileAbout.value = profile.about || "";
  const aboutPreview = document.querySelector("#profileAboutPreview");
  if (aboutPreview) {
    aboutPreview.textContent = profile.about || "No about me yet.";
  }
  els.profileAvatarPreview.textContent = `@${String(username).slice(0, 1).toUpperCase()}`;
  els.profileAvatarPreview.style.backgroundImage = profile.avatarUrl ? `url("${profile.avatarUrl.replaceAll('"', "%22")}")` : "";
  els.profileAvatarPreview.classList.toggle("has-image", Boolean(profile.avatarUrl));
  animate(els.profileAvatarPreview, {
    duration: 460,
    easing: "easeOutElastic(1, .72)",
    scale: [.92, 1],
    rotate: [-2, 0]
  });
}

async function saveProfile(event) {
  event.preventDefault();
  const profile = {
    username: state.user.username,
    avatarUrl: els.profileAvatar.value.trim(),
    about: els.profileAbout.value.trim()
  };
  storeProfile(profile);
  renderProfileForm(profile);
  setProfileStatus("Saving profile...");

  try {
    const response = await fetch("/api/profile", {
      body: JSON.stringify(profile),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save profile.");
    renderProfileForm(data.profile || profile);
    setProfileStatus("Profile saved.");
  } catch (error) {
    setProfileStatus(error.message || "Profile saved locally.");
  }
}

async function updatePassword(event) {
  event.preventDefault();
  setProfileStatus("Updating password...");

  try {
    const response = await fetch("/api/profile/password", {
      body: JSON.stringify({
        currentPassword: els.currentPassword.value,
        newPassword: els.newPassword.value
      }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not update password.");
    els.currentPassword.value = "";
    els.newPassword.value = "";
    setProfileStatus("Password updated.");
  } catch (error) {
    setProfileStatus(error.message || "Could not update password.");
  }
}

function requestEmailReset(event) {
  event.preventDefault();
  els.emailResetStatus.textContent = els.resetEmail.value.trim()
    ? "Email reset needs an email provider before links can be sent."
    : "Enter an email address first.";
}

async function visitProfile(event) {
  event.preventDefault();
  const username = normalizeUsername(els.visitUsername.value);
  if (!username) return;
  els.publicProfileResult.textContent = "Loading profile...";

  try {
    const response = await fetch(`/api/profile/${encodeURIComponent(username)}`, {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Profile not found.");
    renderPublicProfile(data.profile || { username });
  } catch {
    renderPublicProfile(getStoredProfile(username));
  }
}

function renderPublicProfile(profile = {}) {
  els.publicProfileResult.innerHTML = `
    <strong>@${escapeHtml(profile.username || "user")}</strong>
    <span>${escapeHtml(profile.about || "No about me yet.")}</span>
  `;
}

function getStoredProfile(username) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
    return profiles[username] || { username, avatarUrl: "", about: "" };
  } catch {
    return { username, avatarUrl: "", about: "" };
  }
}

function storeProfile(profile) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
    profiles[profile.username] = profile;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
  }
}

function setProfileStatus(message) {
  els.profileStatus.textContent = message;
}

async function loadAdminEvents() {
  if (!state.user || state.user.username !== "seb") return;

  els.adminStatus.textContent = "Loading auth events...";
  try {
    const response = await fetch("/api/admin/events", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load admin events.");
    renderAdminEvents(data.events || []);
    els.adminStatus.textContent = `${data.events.length} auth events shown.`;
  } catch (error) {
    els.adminStatus.textContent = error.message || "Could not load admin events.";
    els.adminEvents.innerHTML = "";
  }
}

function renderAdminEvents(events) {
  els.adminEvents.innerHTML = "";
  if (!events.length) {
    const empty = document.createElement("div");
    empty.className = "admin-empty";
    empty.textContent = "No auth events yet.";
    els.adminEvents.append(empty);
    return;
  }

  events.forEach((event) => {
    const client = event.metadata && event.metadata.client ? event.metadata.client : {};
    const ipDisplay = event.ipLookupUrl
      ? `<a href="${escapeAttribute(event.ipLookupUrl)}" target="_blank" rel="noreferrer">${escapeHtml(event.ipAddress || "--")}</a>`
      : escapeHtml(event.ipAddress || "--");
    const card = document.createElement("article");
    card.className = `admin-event ${event.success ? "success" : "failed"}`;
    card.innerHTML = `
      <div class="admin-event-top">
        <div>
          <strong>${escapeHtml(event.event || "event")} / @${escapeHtml(event.username || "unknown")}</strong>
          <small>${escapeHtml(formatDateTime(event.createdAt))}</small>
        </div>
        <span>${event.success ? "Success" : "Failed"}</span>
      </div>
      <dl>
        <div><dt>IP</dt><dd>${ipDisplay}</dd></div>
        <div><dt>Reason</dt><dd>${escapeHtml(event.failureReason || "--")}</dd></div>
        <div><dt>Country</dt><dd>${escapeHtml(event.country || "--")}</dd></div>
        <div><dt>Region</dt><dd>${escapeHtml(compactLocation(event.metadata))}</dd></div>
        <div><dt>Colo</dt><dd>${escapeHtml(event.colo || "--")}</dd></div>
        <div><dt>ASN</dt><dd>${escapeHtml(event.asn || "--")}</dd></div>
        <div><dt>Ray</dt><dd>${escapeHtml((event.metadata && event.metadata.cfRay) || "--")}</dd></div>
        <div><dt>CF Timezone</dt><dd>${escapeHtml((event.metadata && event.metadata.timezone) || "--")}</dd></div>
        <div><dt>Language</dt><dd>${escapeHtml(client.language || (event.metadata && event.metadata.acceptLanguage) || "--")}</dd></div>
        <div><dt>Languages</dt><dd>${escapeHtml(Array.isArray(client.languages) ? client.languages.join(", ") : "--")}</dd></div>
        <div><dt>Timezone</dt><dd>${escapeHtml(client.timezone || "--")}</dd></div>
        <div><dt>Platform</dt><dd>${escapeHtml(client.platform || "--")}</dd></div>
        <div><dt>Screen</dt><dd>${escapeHtml(client.screen || "--")}</dd></div>
        <div><dt>Viewport</dt><dd>${escapeHtml(client.viewport || "--")}</dd></div>
        <div class="wide"><dt>User agent</dt><dd>${escapeHtml(event.userAgent || "--")}</dd></div>
      </dl>
    `;
    els.adminEvents.append(card);
  });
}

function compactLocation(metadata = {}) {
  const parts = [
    metadata.city,
    metadata.regionCode || metadata.region,
    metadata.postalCode
  ].filter(Boolean);
  const coords = metadata.latitude && metadata.longitude ? `${metadata.latitude}, ${metadata.longitude}` : "";
  if (coords) parts.push(coords);
  return parts.length ? parts.join(" / ") : "--";
}

function formatDateTime(iso) {
  if (!iso) return "--";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

async function checkGameServers() {
  if (!els.gameServerList || !els.gameServerStatus) return;

  state.gameServersLoaded = true;
  els.refreshGameServers.disabled = true;
  els.gameServerStatus.textContent = `Checking ${GAME_SERVICE_TARGETS.length} game services from this browser...`;
  els.gameServersOnline.textContent = "--";
  els.gameServersFastest.textContent = "--";
  els.gameServersChecked.textContent = String(GAME_SERVICE_TARGETS.length);
  renderGameServers(GAME_SERVICE_TARGETS.map((target) => ({ target, status: "checking" })));

  const results = await Promise.all(GAME_SERVICE_TARGETS.map(checkGameServer));
  const online = results.filter((result) => result.status === "online");
  const fastest = online.length ? Math.min(...online.map((result) => result.ping)) : null;

  renderGameServers(results);
  els.gameServersOnline.textContent = String(online.length);
  els.gameServersFastest.textContent = fastest === null ? "--" : formatNumber(fastest, 0);
  els.gameServersChecked.textContent = String(results.length);
  els.gameServerStatus.textContent = online.length
    ? `${online.length} of ${results.length} services responded. Fastest: ${online.sort((a, b) => a.ping - b.ping)[0].target.name}.`
    : "No game services responded from this browser. Try again from another network.";
  els.refreshGameServers.disabled = false;
}

async function checkGameServer(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  const started = performance.now();

  try {
    await fetch(`${target.url}${target.url.includes("?") ? "&" : "?"}linje=${Date.now()}`, {
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal
    });
    return {
      target,
      status: "online",
      ping: performance.now() - started,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return {
      target,
      status: "offline",
      ping: Number.POSITIVE_INFINITY,
      checkedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function renderGameServers(results) {
  els.gameServerList.innerHTML = "";
  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = `game-server-card ${result.status}`;
    const ping = result.status === "checking"
      ? "..."
      : result.status === "online"
        ? `${formatNumber(result.ping, 0)} ms`
        : "Offline";
    const label = result.status === "checking"
      ? "Checking"
      : result.status === "online"
        ? "Online"
        : "Check failed";
    card.innerHTML = `
      <div>
        <span>${escapeHtml(result.target.network)}</span>
        <strong>${escapeHtml(result.target.name)}</strong>
        <small>${escapeHtml(result.target.region)}</small>
      </div>
      <div>
        <b>${escapeHtml(ping)}</b>
        <em>${escapeHtml(label)}</em>
      </div>
    `;
    els.gameServerList.append(card);
  });
  animate(els.gameServerList.querySelectorAll(".game-server-card"), {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 320,
    delay: window.anime ? window.anime.stagger(38) : 0,
    easing: "easeOutCubic"
  });
}

async function loadServers() {
  try {
    const response = await fetch("servers.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Server catalog unavailable");
    const servers = await response.json();
    return Array.isArray(servers) && servers.length ? servers : DEFAULT_SERVERS;
  } catch {
    return DEFAULT_SERVERS;
  }
}

function populateServerSelect() {
  const selected = els.server.value || "auto";
  els.server.innerHTML = "";
  state.servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server.id;
    option.textContent = server.protocol === "auto"
      ? server.name
      : `${server.name} - ${server.provider}`;
    els.server.append(option);
  });
  els.server.value = state.servers.some((server) => server.id === selected) ? selected : "auto";
}

async function checkAllServers() {
  if (!els.serverCheckList || !els.serverCheckStatus) return;

  const servers = state.serverCatalog.filter((server) => server.protocol !== "auto");
  if (!servers.length) {
    els.serverCheckStatus.textContent = "No test servers configured.";
    els.serverCheckList.innerHTML = "";
    state.servers = getFallbackServers();
    populateServerSelect();
    return;
  }

  els.refreshServers.disabled = true;
  els.serverCheckStatus.textContent = `Checking ${servers.length} free servers from this browser...`;
  els.serverCheckList.innerHTML = "";

  const results = await Promise.all(servers.map(async (server) => {
    try {
      const ping = await probeServerCompatibility(server);
      return { ping, server, status: "online" };
    } catch {
      return { ping: Number.POSITIVE_INFINITY, server, status: "offline" };
    }
  }));
  results.forEach((result) => {
    if (state.blockedServerIds.has(result.server.id)) {
      result.ping = Number.POSITIVE_INFINITY;
      result.status = "offline";
    }
  });

  results.sort((a, b) => a.ping - b.ping);
  const online = results.filter((result) => result.status === "online");
  renderServerChecks(online);
  state.servers = buildAvailableServers(online.map((result) => result.server));
  populateServerSelect();
  els.serverCheckStatus.textContent = online.length
    ? `${online.length} of ${results.length} free candidates are available. Fastest: ${online[0].server.name} at ${formatNumber(online[0].ping, 0)} ms. Failed candidates are hidden.`
    : "No extra servers passed browser checks. Cloudflare fallback is ready.";
  els.refreshServers.disabled = false;
}

function getFallbackServers() {
  return buildAvailableServers([]);
}

function buildAvailableServers(onlineServers) {
  const auto = state.serverCatalog.find((server) => server.protocol === "auto") || DEFAULT_SERVERS[0];
  const cloudflare = state.serverCatalog.find((server) => server.id === "cloudflare-global") || DEFAULT_SERVERS[1];
  const unique = new Map();
  [auto, cloudflare, ...onlineServers].forEach((server) => {
    if (server && !state.blockedServerIds.has(server.id)) unique.set(server.id, server);
  });
  return [...unique.values()];
}

function markServerUnavailable(server) {
  if (!server || server.protocol === "auto" || server.protocol === "cloudflare") return;
  state.blockedServerIds.add(server.id);
  state.servers = state.servers.filter((candidate) => candidate.protocol === "auto" || candidate.id !== server.id);
  populateServerSelect();
  const checkItem = els.serverCheckList.querySelector(`[data-server-id="${CSS.escape(server.id)}"]`);
  if (checkItem) {
    checkItem.classList.remove("online", "checking");
    checkItem.classList.add("offline");
    const result = checkItem.querySelector("b");
    if (result) result.textContent = "Failed";
  }
  if (els.serverCheckStatus) {
    els.serverCheckStatus.textContent = `${server.name} failed a full run and was removed from current choices.`;
  }
  els.status.textContent = `${server.name} failed this run and was removed from current choices.`;
}

function renderServerChecks(results) {
  els.serverCheckList.innerHTML = "";
  results.forEach((result) => {
    const item = document.createElement("article");
    item.className = `server-check ${result.status}`;
    item.dataset.serverId = result.server.id;
    const ping = result.status === "online" ? `${formatNumber(result.ping, 0)} ms` : result.status === "checking" ? "..." : "Failed";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(result.server.name)}</strong>
        <small>${escapeHtml(result.server.location || result.server.provider || "")}</small>
      </div>
      <span>${escapeHtml(result.server.provider || result.server.protocol)}</span>
      <b>${ping}</b>
    `;
    els.serverCheckList.append(item);
  });
  animate(els.serverCheckList.querySelectorAll(".server-check"), {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 420,
    delay: window.anime ? window.anime.stagger(35) : 0,
    easing: "easeOutCubic"
  });
}

async function resolveSelectedServer(signal) {
  const selected = state.servers.find((server) => server.id === els.server.value) || state.servers[0];
  if (selected.protocol !== "auto") return selected;

  const candidates = state.servers.filter((server) => server.protocol !== "auto");
  if (!candidates.length) throw new Error("No test servers configured");

  setPhase("Server", 3, "Auto-selecting the lowest-latency test point");
  const probes = await Promise.all(candidates.map(async (server) => {
    try {
      const ping = await probeServerLatency(server, signal);
      return { server, ping };
    } catch {
      return { server, ping: Number.POSITIVE_INFINITY };
    }
  }));
  const best = probes.sort((a, b) => a.ping - b.ping)[0];
  if (!Number.isFinite(best.ping)) throw new Error("No test servers responded");
  els.status.textContent = `Selected ${best.server.name} at ${formatNumber(best.ping, 0)} ms.`;
  return best.server;
}

async function probeServerLatency(server, outerSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);
  const onAbort = () => controller.abort();
  outerSignal.addEventListener("abort", onAbort, { once: true });

  try {
    const start = performance.now();
    await fetch(buildPingUrl(server, "probe"), {
      cache: "no-store",
      signal: controller.signal
    });
    return performance.now() - start;
  } finally {
    clearTimeout(timeout);
    outerSignal.removeEventListener("abort", onAbort);
  }
}

async function probeServerCompatibility(server) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const start = performance.now();
    await fetch(buildPingUrl(server, "compat"), {
      cache: "no-store",
      signal: controller.signal
    });
    const ping = performance.now() - start;

    const downloadResponse = await fetch(buildDownloadUrl(server, 5_000_000, "compat"), {
      cache: "no-store",
      signal: controller.signal
    });
    if (!downloadResponse.ok) throw new Error("Download check failed");
    await downloadResponse.arrayBuffer();

    const uploadResponse = await fetch(buildUploadUrl(server, 1_000_000, "compat"), {
      body: makePayload(1_000_000),
      cache: "no-store",
      method: "POST",
      signal: controller.signal
    });
    if (!uploadResponse.ok) throw new Error("Upload check failed");

    return ping;
  } finally {
    clearTimeout(timeout);
  }
}

async function measurePing(server, count, signal) {
  const samples = [];
  let failed = 0;

  for (let i = 0; i < count; i += 1) {
    const start = performance.now();
    try {
      await fetch(buildPingUrl(server, i), {
        cache: "no-store",
        signal
      });
      samples.push(performance.now() - start);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      failed += 1;
    }
    setProgress(6 + ((i + 1) / count) * 10);
  }

  if (!samples.length) {
    throw new Error("No ping samples completed");
  }

  return {
    ping: percentile(samples, .5),
    jitter: average(samples.map((sample, index) => index ? Math.abs(sample - samples[index - 1]) : 0).slice(1)),
    loss: (failed / count) * 100,
    samples
  };
}

async function measureTransfer({ server, bytesList, durationSeconds, direction, signal, progressStart, progressEnd }) {
  const samples = [];
  const deadline = performance.now() + durationSeconds * 1000;
  const started = performance.now();
  let i = 0;

  while (performance.now() < deadline || samples.length === 0) {
    const bytes = bytesList[i % bytesList.length];
    let measuredBytes = bytes;
    const start = performance.now();

    if (direction === "download") {
      const response = await fetch(buildDownloadUrl(server, bytes, i), {
        cache: "no-store",
        signal
      });
      const body = await response.arrayBuffer();
      measuredBytes = body.byteLength || bytes;
    } else {
      const payload = makePayload(bytes);
      await fetch(buildUploadUrl(server, bytes, i), {
        body: payload,
        cache: "no-store",
        method: "POST",
        signal
      });
    }

    const seconds = (performance.now() - start) / 1000;
    const mbps = (measuredBytes * 8) / seconds / 1_000_000;
    samples.push(mbps);
    i += 1;
    const elapsed = Math.min(durationSeconds * 1000, performance.now() - started);
    const progress = progressStart + (elapsed / (durationSeconds * 1000)) * (progressEnd - progressStart);
    setProgress(progress);
    showLive(direction, mbps);
  }

  const trimmed = samples.length > 2 ? samples.slice(1) : samples;
  return {
    mbps: percentile(trimmed, .75),
    peak: Math.max(...samples),
    consistency: Math.min(100, (percentile(trimmed, .25) / Math.max(percentile(trimmed, .75), 1)) * 100),
    samples
  };
}

async function measureLoadedLatency(server, signal) {
  const samples = [];
  const downloads = [1_000_000, 1_000_000, 1_000_000].map((bytes, index) => {
    return fetch(buildDownloadUrl(server, bytes, `loaded-${index}`), {
      cache: "no-store",
      signal
    }).catch((error) => {
      if (error.name === "AbortError") throw error;
    });
  });

  for (let i = 0; i < 3; i += 1) {
    const start = performance.now();
    await fetch(buildPingUrl(server, `loaded-${i}`), {
      cache: "no-store",
      signal
    });
    samples.push(performance.now() - start);
  }

  await Promise.all(downloads);
  return percentile(samples, .5);
}

function buildPingUrl(server, token) {
  if (server.protocol === "cloudflare") {
    return `${cleanBase(server.server)}/__down?bytes=0&ping=${Date.now()}-${token}`;
  }
  return `${joinUrl(server.server, server.pingURL)}?r=${Date.now()}-${token}`;
}

function buildDownloadUrl(server, bytes, token) {
  if (server.protocol === "cloudflare") {
    return `${cleanBase(server.server)}/__down?bytes=${bytes}&cacheBust=${Date.now()}-${token}`;
  }
  const chunkMb = Math.max(1, Math.ceil(bytes / 1_000_000));
  return `${joinUrl(server.server, server.dlURL)}?ckSize=${chunkMb}&r=${Date.now()}-${token}`;
}

function buildUploadUrl(server, bytes, token) {
  if (server.protocol === "cloudflare") {
    return `${cleanBase(server.server)}/__up?bytes=${bytes}&cacheBust=${Date.now()}-${token}`;
  }
  return `${joinUrl(server.server, server.ulURL)}?r=${Date.now()}-${token}`;
}

function joinUrl(base, path) {
  return `${cleanBase(base)}/${String(path || "").replace(/^\/+/, "")}`;
}

function cleanBase(url) {
  return String(url || "").replace(/\/+$/, "");
}

function makePayload(bytes) {
  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const data = new Uint8Array(bytes);
    const chunk = 65_536;
    for (let offset = 0; offset < data.length; offset += chunk) {
      window.crypto.getRandomValues(data.subarray(offset, Math.min(offset + chunk, data.length)));
    }
    return data;
  }
  return new Uint8Array(bytes);
}

function buildResult({ server, latency, download, upload, loadedLatency }) {
  const score = calculateScore(download.mbps, upload.mbps, latency.ping, latency.jitter, loadedLatency, latency.loss);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    endpoint: server.server,
    serverId: server.id,
    serverName: server.name,
    serverProvider: server.provider,
    serverProtocol: server.protocol,
    ping: latency.ping,
    jitter: latency.jitter,
    packetLoss: latency.loss,
    download: download.mbps,
    upload: upload.mbps,
    downloadPeak: download.peak,
    uploadPeak: upload.peak,
    consistency: Math.round((download.consistency + upload.consistency) / 2),
    loadedLatency,
    score,
    quality: labelQuality(score)
  };
}

function calculateScore(download, upload, ping, jitter, loaded, loss) {
  const downScore = Math.min(download / 500, 1) * 42;
  const upScore = Math.min(upload / 100, 1) * 26;
  const pingScore = Math.max(0, 1 - ping / 120) * 16;
  const loadedScore = Math.max(0, 1 - loaded / 260) * 8;
  const jitterScore = Math.max(0, 1 - jitter / 35) * 5;
  const lossScore = Math.max(0, 1 - loss / 8) * 3;
  return Math.round(downScore + upScore + pingScore + loadedScore + jitterScore + lossScore);
}

function labelQuality(score) {
  if (score >= 88) return "Excellent";
  if (score >= 72) return "Strong";
  if (score >= 55) return "Steady";
  if (score >= 38) return "Limited";
  return "Poor";
}

function showResult(result) {
  els.ping.textContent = formatNumber(result.ping, 0);
  els.download.textContent = formatNumber(result.download, 1);
  els.upload.textContent = formatNumber(result.upload, 1);
  els.jitter.textContent = formatNumber(result.jitter, 0);
  els.loadedLatency.textContent = `${formatNumber(result.loadedLatency, 0)} ms`;
  els.loss.textContent = `${formatNumber(result.packetLoss, 0)}%`;
  els.score.textContent = result.score;
  els.quality.textContent = result.quality;
  els.primary.textContent = formatNumber(result.download, 1);
  els.unit.textContent = "Mbps down";
}

function saveResult(result) {
  state.history = [result, ...state.history].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  renderHistory();
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).slice(0, 10) : [];
  } catch {
    return [];
  }
}

function renderHistory() {
  els.historyList.innerHTML = "";
  const sorted = [...state.history].sort((a, b) => b.score - a.score);

  if (!sorted.length) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "Run a test to start the ranking.";
    els.historyList.append(empty);
    return;
  }

  sorted.forEach((item, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.querySelector(".rank").textContent = index + 1;
    node.querySelector(".history-title").textContent = `${item.score} / ${item.quality}`;
    node.querySelector(".history-meta").textContent = `${formatTime(item.createdAt)} / ${item.serverName || "Unknown server"} / consistency ${item.consistency}%`;
    node.querySelector(".down").textContent = `D ${formatNumber(item.download, 1)}`;
    node.querySelector(".up").textContent = `U ${formatNumber(item.upload, 1)}`;
    node.querySelector(".ping").textContent = `P ${formatNumber(item.ping, 0)}`;
    els.historyList.append(node);
  });
}

function clearHistory() {
  state.history = [];
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

function exportCsv() {
  if (!state.history.length) return;
  const headers = [
    "createdAt",
    "score",
    "quality",
    "downloadMbps",
    "uploadMbps",
    "pingMs",
    "jitterMs",
    "loadedLatencyMs",
    "packetLossPercent",
    "consistencyPercent",
    "serverName",
    "serverProvider",
    "serverProtocol",
    "endpoint"
  ];
  const rows = state.history.map((item) => [
    item.createdAt,
    item.score,
    item.quality,
    item.download,
    item.upload,
    item.ping,
    item.jitter,
    item.loadedLatency,
    item.packetLoss,
    item.consistency,
    item.serverName,
    item.serverProvider,
    item.serverProtocol,
    item.endpoint
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "linje-speed-history.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function setRunning(running) {
  els.start.disabled = running;
  els.stop.disabled = !running;
  els.durations.forEach((input) => {
    input.disabled = running;
  });
  els.dial.dataset.state = running ? "running" : "idle";
}

function setPhase(phase, progress, text) {
  els.phase.textContent = phase;
  els.status.textContent = text;
  setProgress(progress);
  animateMetricPulse(els.phase);
}

function setProgress(progress) {
  const circumference = 653.45;
  const offset = circumference - (Math.max(0, Math.min(progress, 100)) / 100) * circumference;
  els.dialProgress.style.strokeDashoffset = offset;
}

function showLive(direction, mbps) {
  els.primary.textContent = formatNumber(mbps, 1);
  els.unit.textContent = direction === "download" ? "Mbps down" : "Mbps up";
  updateMetric(direction, mbps);
  animateMetricPulse(els.primary);
}

function updateMetric(metric, value) {
  els[metric].textContent = formatNumber(value, metric === "jitter" || metric === "ping" ? 0 : 1);
  animateMetricPulse(els[metric]);
}

function resetReadout() {
  ["ping", "download", "upload", "jitter"].forEach((metric) => {
    els[metric].textContent = "--";
  });
  els.score.textContent = "--";
  els.quality.textContent = "Testing";
  els.loadedLatency.textContent = "-- ms";
  els.loss.textContent = "--";
  els.primary.textContent = "--";
  els.unit.textContent = "Mbps";
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

function formatNumber(value, places) {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: places,
    minimumFractionDigits: places
  });
}

function formatTime(iso) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}
