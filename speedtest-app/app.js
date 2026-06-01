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
const ARCADE_GAMES = {
  breaker: {
    label: "Glass Breaker",
    status: "Break glass tiles. Move the paddle with arrows."
  },
  dodge: {
    label: "Packet Dodge",
    status: "Dodge falling packets. Survive as long as you can."
  },
  invaders: {
    label: "Linje Invaders",
    status: "Move with arrows or buttons. Fire with space."
  },
  snake: {
    label: "Signal Snake",
    status: "Collect signal nodes. Avoid walls and your own trail."
  }
};
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
  },
  {
    id: "marvel-rivals",
    name: "Marvel Rivals",
    network: "NetEase",
    region: "Global",
    url: "https://www.marvelrivals.com"
  },
  {
    id: "the-finals",
    name: "The Finals",
    network: "Embark",
    region: "Global",
    url: "https://www.reachthefinals.com"
  },
  {
    id: "sea-of-thieves",
    name: "Sea of Thieves",
    network: "Microsoft",
    region: "Global",
    url: "https://www.seaofthieves.com"
  },
  {
    id: "gta-online",
    name: "GTA Online",
    network: "Rockstar",
    region: "Global",
    url: "https://support.rockstargames.com/servicestatus"
  },
  {
    id: "red-dead-online",
    name: "Red Dead Online",
    network: "Rockstar",
    region: "Global",
    url: "https://support.rockstargames.com/servicestatus"
  },
  {
    id: "monster-hunter",
    name: "Monster Hunter",
    network: "Capcom",
    region: "Global",
    url: "https://www.monsterhunter.com"
  },
  {
    id: "street-fighter",
    name: "Street Fighter 6",
    network: "Capcom",
    region: "Global",
    url: "https://www.streetfighter.com/6"
  },
  {
    id: "tekken",
    name: "Tekken 8",
    network: "Bandai Namco",
    region: "Global",
    url: "https://tekken.com"
  },
  {
    id: "elden-ring",
    name: "Elden Ring",
    network: "Bandai Namco",
    region: "Global",
    url: "https://en.bandainamcoent.eu/elden-ring"
  },
  {
    id: "path-of-exile",
    name: "Path of Exile",
    network: "Grinding Gear",
    region: "Global",
    url: "https://www.pathofexile.com"
  },
  {
    id: "eve-online",
    name: "EVE Online",
    network: "CCP Games",
    region: "Global",
    url: "https://www.eveonline.com"
  },
  {
    id: "albion",
    name: "Albion Online",
    network: "Sandbox Interactive",
    region: "Global",
    url: "https://albiononline.com"
  },
  {
    id: "war-thunder",
    name: "War Thunder",
    network: "Gaijin",
    region: "Global",
    url: "https://warthunder.com"
  },
  {
    id: "world-of-tanks",
    name: "World of Tanks",
    network: "Wargaming",
    region: "Global",
    url: "https://worldoftanks.com"
  },
  {
    id: "dead-by-daylight",
    name: "Dead by Daylight",
    network: "Behaviour",
    region: "Global",
    url: "https://deadbydaylight.com"
  },
  {
    id: "smite",
    name: "Smite",
    network: "Hi-Rez",
    region: "Global",
    url: "https://www.smitegame.com"
  },
  {
    id: "lost-ark",
    name: "Lost Ark",
    network: "Amazon Games",
    region: "Global",
    url: "https://www.playlostark.com"
  },
  {
    id: "new-world",
    name: "New World",
    network: "Amazon Games",
    region: "Global",
    url: "https://www.newworld.com"
  },
  {
    id: "among-us",
    name: "Among Us",
    network: "Innersloth",
    region: "Global",
    url: "https://www.innersloth.com/games/among-us/"
  },
  {
    id: "vrchat",
    name: "VRChat",
    network: "VRChat",
    region: "Global",
    url: "https://status.vrchat.com"
  },
  {
    id: "rec-room",
    name: "Rec Room",
    network: "Rec Room",
    region: "Global",
    url: "https://recroom.com"
  },
  {
    id: "brawlhalla",
    name: "Brawlhalla",
    network: "Ubisoft",
    region: "Global",
    url: "https://www.brawlhalla.com"
  },
  {
    id: "trackmania",
    name: "Trackmania",
    network: "Ubisoft",
    region: "Global",
    url: "https://www.trackmania.com"
  },
  {
    id: "mortal-kombat",
    name: "Mortal Kombat 1",
    network: "Warner Bros",
    region: "Global",
    url: "https://www.mortalkombat.com"
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
  gameServersLoaded: false,
  arcadeClicks: 0,
  arcadeClickTimer: 0,
  arcadeGame: "invaders",
  arcadeUnlocked: false,
  arcade: null,
  secureMessageAccess: null,
  secureMessageViewedToken: "",
  worldNewsAccess: null,
  worldNewsLoaded: false,
  worldNewsGlobe: null,
  worldNewsArticles: [],
  worldNewsFeed: null,
  worldLayers: {
    flights: true,
    news: true,
    ships: true
  }
};

const els = {
  body: document.body,
  auth: document.querySelector("#auth"),
  authCanvas: document.querySelector("#authCanvas"),
  siteCanvas: document.querySelector("#siteCanvas"),
  app: document.querySelector("#app"),
  appOnly: document.querySelectorAll(".app-only"),
  siteHeader: document.querySelector(".site-header"),
  secretBrand: document.querySelector("#secretBrand"),
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
  worldWatchView: document.querySelector("#world-watch"),
  worldWatchGate: document.querySelector("#worldWatchGate"),
  worldWatchRegisterForm: document.querySelector("#worldWatchRegisterForm"),
  worldWatchGateStatus: document.querySelector("#worldWatchGateStatus"),
  worldWatchConsole: document.querySelector("#worldWatchConsole"),
  worldGlobeCanvas: document.querySelector("#worldGlobeCanvas"),
  refreshWorldNews: document.querySelector("#refreshWorldNews"),
  worldLayerButtons: document.querySelectorAll("[data-world-layer]"),
  worldLayerStatus: document.querySelector("#worldLayerStatus"),
  worldIntelPanel: document.querySelector("#worldIntelPanel"),
  worldWatchStatus: document.querySelector("#worldWatchStatus"),
  worldNewsList: document.querySelector("#worldNewsList"),
  worldRegionStrip: document.querySelector("#worldRegionStrip"),
  secureMessageView: document.querySelector("#secure-message"),
  secureMessageForm: document.querySelector("#secureMessageForm"),
  secureSignupPanel: document.querySelector("#secureSignupPanel"),
  secureSignupTitle: document.querySelector("#secureSignupTitle"),
  secureSignupText: document.querySelector("#secureSignupText"),
  secureSignupButton: document.querySelector("#secureSignupButton"),
  secureMessageInput: document.querySelector("#secureMessageInput"),
  secureLinkPanel: document.querySelector("#secureLinkPanel"),
  secureLinkOutput: document.querySelector("#secureLinkOutput"),
  secureCopyLink: document.querySelector("#secureCopyLink"),
  secureClear: document.querySelector("#secureClear"),
  secureReadPanel: document.querySelector("#secureReadPanel"),
  secureReadOutput: document.querySelector("#secureReadOutput"),
  secureBurn: document.querySelector("#secureBurn"),
  secureMessageStatus: document.querySelector("#secureMessageStatus"),
  secureCipherCanvas: document.querySelector("#secureCipherCanvas"),
  secureViewState: document.querySelector("#secureViewState"),
  secureAdminGrantForm: document.querySelector("#secureAdminGrantForm"),
  secureAdminUsername: document.querySelector("#secureAdminUsername"),
  secureAdminStatus: document.querySelector("#secureAdminStatus"),
  secureAdminGrants: document.querySelector("#secureAdminGrants"),
  secureAdminEvents: document.querySelector("#secureAdminEvents"),
  worldAdminGrantForm: document.querySelector("#worldAdminGrantForm"),
  worldAdminUsername: document.querySelector("#worldAdminUsername"),
  worldAdminStatus: document.querySelector("#worldAdminStatus"),
  worldAdminGrants: document.querySelector("#worldAdminGrants"),
  refreshGameServers: document.querySelector("#refreshGameServers"),
  gameServerStatus: document.querySelector("#gameServerStatus"),
  gameServerList: document.querySelector("#gameServerList"),
  gameServersOnline: document.querySelector("#gameServersOnline"),
  gameServersFastest: document.querySelector("#gameServersFastest"),
  gameServersChecked: document.querySelector("#gameServersChecked"),
  arcadeView: document.querySelector("#arcade"),
  arcadeCanvas: document.querySelector("#arcadeCanvas"),
  arcadeCurrentGame: document.querySelector("#arcadeCurrentGame"),
  arcadeGameButtons: document.querySelectorAll("[data-arcade-game]"),
  arcadeLeaderboard: document.querySelector("#arcadeLeaderboard"),
  arcadeScore: document.querySelector("#arcadeScore"),
  arcadeLives: document.querySelector("#arcadeLives"),
  arcadeStatus: document.querySelector("#arcadeStatus"),
  arcadeUp: document.querySelector("#arcadeUp"),
  arcadeDown: document.querySelector("#arcadeDown"),
  arcadeLeft: document.querySelector("#arcadeLeft"),
  arcadeRight: document.querySelector("#arcadeRight"),
  arcadeFire: document.querySelector("#arcadeFire"),
  arcadeRestart: document.querySelector("#arcadeRestart"),
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
els.secretBrand.addEventListener("click", handleSecretBrandClick);
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
    } else if (link.dataset.toolLink === "world-watch") {
      showWorldWatchView();
    } else if (link.dataset.toolLink === "secure-message") {
      showSecureMessageView();
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
els.worldWatchRegisterForm.addEventListener("submit", requestWorldWatchAccess);
els.refreshWorldNews.addEventListener("click", () => loadWorldNews(true));
els.worldLayerButtons.forEach((button) => {
  button.addEventListener("click", () => toggleWorldLayer(button.dataset.worldLayer, button));
});
els.secureSignupButton.addEventListener("click", requestSecureMessageAccess);
els.secureMessageForm.addEventListener("submit", createSecureMessageLink);
els.secureCopyLink.addEventListener("click", copySecureMessageLink);
els.secureClear.addEventListener("click", clearSecureMessageComposer);
els.secureBurn.addEventListener("click", burnSecureMessage);
els.secureAdminGrantForm.addEventListener("submit", grantSecureMessageAccess);
els.worldAdminGrantForm.addEventListener("submit", approveWorldWatchAccess);
els.refreshServers.addEventListener("click", () => checkAllServers());
els.refreshGameServers.addEventListener("click", () => checkGameServers());
els.arcadeGameButtons.forEach((button) => {
  button.addEventListener("click", () => selectArcadeGame(button.dataset.arcadeGame));
});
els.arcadeRestart.addEventListener("click", resetArcadeGame);
els.arcadeUp.addEventListener("pointerdown", () => setArcadeVerticalDirection(-1));
els.arcadeDown.addEventListener("pointerdown", () => setArcadeVerticalDirection(1));
els.arcadeUp.addEventListener("pointerup", () => setArcadeVerticalDirection(0));
els.arcadeDown.addEventListener("pointerup", () => setArcadeVerticalDirection(0));
els.arcadeUp.addEventListener("pointerleave", () => setArcadeVerticalDirection(0));
els.arcadeDown.addEventListener("pointerleave", () => setArcadeVerticalDirection(0));
els.arcadeLeft.addEventListener("pointerdown", () => setArcadeDirection(-1));
els.arcadeRight.addEventListener("pointerdown", () => setArcadeDirection(1));
els.arcadeLeft.addEventListener("pointerup", () => setArcadeDirection(0));
els.arcadeRight.addEventListener("pointerup", () => setArcadeDirection(0));
els.arcadeLeft.addEventListener("pointerleave", () => setArcadeDirection(0));
els.arcadeRight.addEventListener("pointerleave", () => setArcadeDirection(0));
els.arcadeFire.addEventListener("click", fireArcadeShot);
window.addEventListener("keydown", handleArcadeKeyDown);
window.addEventListener("keyup", handleArcadeKeyUp);
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
initSecureCipherCanvas();
initUiAnimations();

async function register(event) {
  event.preventDefault();
  const captcha = getCaptchaPayload("register");
  if (!captcha) return;

  setAuthStatus("Creating account...");
  setAuthBusy(true);

  try {
    const user = await authRequest("/api/register", {
      username: normalizeUsername(els.registerUsername.value),
      password: els.registerPassword.value,
      captchaToken: captcha.token,
      captchaAnswer: captcha.answer,
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
  const captcha = getCaptchaPayload("login");
  if (!captcha) return;

  setAuthStatus("Logging in...");
  setAuthBusy(true);

  try {
    const user = await authRequest("/api/login", {
      username: normalizeUsername(els.loginUsername.value),
      password: els.loginPassword.value,
      captchaToken: captcha.token,
      captchaAnswer: captcha.answer,
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
  state.arcadeUnlocked = false;
  state.arcadeClicks = 0;
  state.worldNewsAccess = null;
  state.worldNewsLoaded = false;
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
  } else if (window.location.hash === "#world-watch") {
    await enterPublicWorldWatch();
  } else {
    showAuth();
  }
}

async function enterPublicWorldWatch() {
  state.user = null;
  els.body.dataset.auth = "guest";
  els.auth.hidden = true;
  els.appOnly.forEach((node) => {
    node.hidden = node !== els.app;
  });
  if (els.siteHeader) els.siteHeader.hidden = true;
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = false;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  renderWorldWatchPublicShell();
  window.scrollTo({ top: 0 });
  animateView(els.worldWatchView);
  await initWorldGlobe();
  updateWorldGlobeData(normalizeWorldFeed({
    status: "Log in and request World Watch access to load live signals."
  }));
}

async function enterApp(user, { route = "home" } = {}) {
  state.user = user;
  state.secureMessageAccess = null;
  els.body.dataset.auth = "authenticated";
  els.auth.hidden = true;
  els.appOnly.forEach((node) => {
    node.hidden = false;
  });
  const isAdmin = Boolean(user.admin || user.username === "seb");
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
  loadSecureMessageAccess();
  loadWorldWatchAccess();
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
  answer.disabled = true;
  answer.placeholder = "Loading...";

  try {
    const response = await fetch("/api/captcha", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Captcha unavailable.");
    question.textContent = data.question || "Complete the check.";
    token.value = data.token || "";
    answer.disabled = false;
    answer.placeholder = "Result";
  } catch {
    question.textContent = "Refresh to retry.";
    answer.disabled = false;
    answer.placeholder = "Refresh first";
  }
}

function getCaptchaPayload(mode) {
  const prefix = mode === "login" ? "login" : "register";
  const token = els[`${prefix}CaptchaToken`];
  const answer = els[`${prefix}CaptchaAnswer`];
  if (!token || !answer) return null;

  if (!token.value) {
    setAuthStatus("Refresh the Linje check, then enter the answer.", "error");
    loadCaptcha(mode);
    return null;
  }

  if (!answer.value.trim()) {
    setAuthStatus("Enter the Linje check answer.", "error");
    answer.focus();
    return null;
  }

  return {
    token: token.value,
    answer: answer.value
  };
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
      const commitDetails = bucket.commits.slice(0, 4).map((commit) => {
        const description = commit.description ? ` - ${commit.description}` : "";
        return `${commit.message || "Commit"}${description}`;
      }).join("\n");
      cell.title = commitDetails
        ? `${bucket.count} commits around ${formatHour(bucket.hour)}\n${commitDetails}`
        : `${bucket.count} commits around ${formatHour(bucket.hour)}`;
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

function initSecureCipherCanvas() {
  const canvas = els.secureCipherCanvas;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const streams = Array.from({ length: 18 }, (_, index) => ({
    depth: .3 + (index % 5) * .12,
    offset: Math.random() * 400,
    phase: Math.random() * Math.PI * 2,
    speed: .3 + Math.random() * .45,
    y: (index + .5) / 18
  }));
  const nodes = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    phase: Math.random() * Math.PI * 2,
    speed: .15 + Math.random() * .3
  }));

  function draw(now) {
    const time = now / 1000;
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = .16;
    context.strokeStyle = "#f7f7f2";
    context.lineWidth = 1;
    for (let x = -80; x < width + 80; x += 56) {
      context.beginPath();
      context.moveTo(x + Math.sin(time * .35) * 18, 0);
      context.lineTo(x - 120 + Math.sin(time * .35) * 18, height);
      context.stroke();
    }
    context.restore();

    streams.forEach((stream, streamIndex) => {
      context.save();
      context.globalAlpha = .16 + stream.depth * .22;
      context.strokeStyle = "#f7f7f2";
      context.lineWidth = streamIndex % 3 === 0 ? 1.8 : 1;
      context.beginPath();
      for (let x = -60; x <= width + 60; x += 18) {
        const y = height * stream.y
          + Math.sin(x * .018 + stream.phase + time * stream.speed) * (18 + stream.depth * 26)
          + Math.cos(x * .006 - time * stream.speed) * 12;
        if (x === -60) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.restore();
    });

    nodes.forEach((node, index) => {
      const x = ((node.x * width) + Math.sin(time * node.speed + node.phase) * 18 + width) % width;
      const y = ((node.y * height) + Math.cos(time * node.speed * 1.4 + node.phase) * 20 + height) % height;
      const pulse = (Math.sin(time * 2.6 + index) + 1) / 2;
      context.save();
      context.globalAlpha = .18 + pulse * .44;
      context.fillStyle = "#f7f7f2";
      context.beginPath();
      context.arc(x, y, 1.5 + pulse * 2.2, 0, Math.PI * 2);
      context.fill();
      if (index % 4 === 0) {
        context.globalAlpha = .1 + pulse * .18;
        context.strokeStyle = "#f7f7f2";
        context.beginPath();
        context.arc(x, y, 12 + pulse * 18, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    });

    context.save();
    context.globalAlpha = .78;
    context.strokeStyle = "#f7f7f2";
    context.lineWidth = 2;
    const scan = (time * 96) % (height + 80) - 40;
    context.beginPath();
    context.moveTo(0, scan);
    context.lineTo(width, scan + Math.sin(time * 2) * 18);
    context.stroke();
    context.restore();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

function applyRoute() {
  if (window.location.hash === "#admin") {
    showAdminView(false);
  } else if (window.location.hash === "#profile") {
    showProfileView(false);
  } else if (window.location.hash === "#server-ping") {
    showServerPingView(false);
  } else if (window.location.hash === "#world-watch") {
    showWorldWatchView(false);
  } else if (window.location.hash === "#secure-message" || window.location.hash.startsWith("#message=")) {
    showSecureMessageView(false);
  } else if (window.location.hash === "#arcade") {
    showArcadeView(false);
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
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
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
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
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
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#server-ping");
  window.scrollTo({ top: 0 });
  animateView(els.serverPingView);
  if (!state.gameServersLoaded) checkGameServers();
}

async function showWorldWatchView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = false;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#world-watch");
  window.scrollTo({ top: 0 });
  animateView(els.worldWatchView);
  await loadWorldWatchAccess();
}

function showSecureMessageView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = false;
  els.arcadeView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#secure-message");
  window.scrollTo({ top: 0 });
  animateView(els.secureMessageView);
  loadSecureMessageAccess();
  decryptSecureMessageFromHash();
}

function showArcadeView(updateHash = true) {
  if (!state.arcadeUnlocked) {
    showHomeView(updateHash);
    return;
  }

  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = false;
  els.profileView.hidden = true;
  els.adminView.hidden = true;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#arcade");
  window.scrollTo({ top: 0 });
  animateView(els.arcadeView);
  loadArcadeLeaderboard();
  startArcadeGame();
}

function showProfileView(updateHash = true) {
  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
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
  if (!state.user || (!state.user.admin && state.user.username !== "seb")) {
    showHomeView(updateHash);
    return;
  }

  els.home.hidden = true;
  els.speedView.hidden = true;
  els.serverPingView.hidden = true;
  els.worldWatchView.hidden = true;
  els.secureMessageView.hidden = true;
  els.arcadeView.hidden = true;
  els.profileView.hidden = true;
  els.adminView.hidden = false;
  closeAccountMenu();
  closeToolsMenu();
  if (updateHash) history.pushState(null, "", "#admin");
  window.scrollTo({ top: 0 });
  loadAdminEvents();
  animateView(els.adminView);
}

async function loadWorldWatchAccess() {
  if (!state.user) {
    renderWorldWatchPublicShell();
    return;
  }
  els.worldWatchGateStatus.textContent = "Checking World Watch access...";
  try {
    const response = await fetch("/api/world-news/access", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "World Watch access unavailable.");
    state.worldNewsAccess = data;
    renderWorldWatchAccess(data);
  } catch (error) {
    state.worldNewsAccess = { allowed: false, status: "unavailable" };
    renderWorldWatchAccess(state.worldNewsAccess);
    els.worldWatchGateStatus.textContent = error.message || "World Watch access unavailable.";
  }
}

async function requestWorldWatchAccess(event) {
  event.preventDefault();
  if (!state.user) {
    showAuth();
    setAuthMode("login");
    setAuthStatus("Log in to request World Watch access.");
    return;
  }
  els.worldWatchGateStatus.textContent = "Registering World Watch request...";
  els.worldWatchRegisterForm.querySelectorAll("button").forEach((element) => {
    element.disabled = true;
  });
  try {
    const response = await fetch("/api/world-news/access", {
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not register for World Watch.");
    state.worldNewsAccess = data;
    renderWorldWatchAccess(data);
  } catch (error) {
    els.worldWatchGateStatus.textContent = error.message || "Could not register for World Watch.";
  } finally {
    els.worldWatchRegisterForm.querySelectorAll("button").forEach((element) => {
      element.disabled = false;
    });
  }
}

function renderWorldWatchPublicShell() {
  state.worldNewsAccess = { allowed: false, status: "login_required" };
  state.worldNewsLoaded = false;
  els.worldWatchGate.hidden = true;
  els.worldWatchConsole.hidden = false;
  els.worldLayerStatus.textContent = "Public globe / live signals require World Watch access.";
  els.worldWatchStatus.textContent = "Log in and request World Watch access to load live signals.";
  els.worldNewsList.innerHTML = "";
  els.worldRegionStrip.innerHTML = "";
  const empty = document.createElement("p");
  empty.className = "admin-empty";
  empty.textContent = "Live articles, aircraft, and maritime data load after login and approval.";
  els.worldNewsList.append(empty);
  if (els.worldIntelPanel) {
    els.worldIntelPanel.innerHTML = `
      <p class="eyebrow">Access</p>
      <h3>World Watch is gated.</h3>
      <p>The globe is visible, but live signals require a Linje account with World Watch approval.</p>
    `;
  }
}

function renderWorldWatchAccess(access = {}) {
  const allowed = Boolean(access.allowed);
  els.worldWatchGate.hidden = allowed;
  els.worldWatchConsole.hidden = !allowed;
  const button = els.worldWatchRegisterForm.querySelector("button");
  button.disabled = access.status === "pending" || access.status === "unavailable" || access.status === "denied";

  if (!allowed) {
    state.worldNewsLoaded = false;
    if (access.status === "pending") {
      button.textContent = "Pending";
      els.worldWatchGateStatus.textContent = "World Watch registration is waiting for admin approval.";
    } else if (access.status === "denied") {
      button.textContent = "Denied";
      els.worldWatchGateStatus.textContent = "World Watch registration was denied by an admin.";
    } else if (access.status === "unavailable") {
      button.textContent = "Register";
      els.worldWatchGateStatus.textContent = "World Watch access could not be checked right now.";
    } else {
      button.textContent = "Register";
      els.worldWatchGateStatus.textContent = "Register for World Watch access. An admin must approve you before anything loads.";
    }
    return;
  }

  button.textContent = "Register";
  initWorldGlobe().then(() => loadWorldNews(!state.worldNewsLoaded));
}

async function loadWorldNews(force = false) {
  if (!state.worldNewsAccess || !state.worldNewsAccess.allowed || state.worldNewsLoaded && !force) return;
  els.worldWatchStatus.textContent = "Loading global feed...";
  try {
    const response = await fetch(`/api/world-news/feed${force ? `?t=${Date.now()}` : ""}`, {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 403) {
      state.worldNewsAccess = { allowed: false, status: "pending" };
      renderWorldWatchAccess(state.worldNewsAccess);
      throw new Error(data.error || "World Watch approval required.");
    }
    if (!response.ok) throw new Error(data.error || "World news feed is unavailable.");
    state.worldNewsLoaded = true;
    const feed = normalizeWorldFeed(data);
    state.worldNewsFeed = feed;
    state.worldNewsArticles = feed.articles || [];
    renderWorldNews(feed);
    updateWorldGlobeData(feed);
    els.worldWatchStatus.textContent = `${countWorldSignals(feed)} signals / ${feed.source || "free APIs"} / ${feed.status || formatDateTime(feed.updatedAt)}`;
  } catch (error) {
    els.worldWatchStatus.textContent = error.message || "World news feed is unavailable.";
    const feed = normalizeWorldFeed({ status: error.message || "Free APIs unavailable." });
    state.worldNewsFeed = feed;
    state.worldNewsArticles = feed.articles;
    renderWorldNews(feed);
    updateWorldGlobeData(feed);
  }
}

function normalizeWorldFeed(data = {}) {
  const updatedAt = data.updatedAt || new Date().toISOString();
  return {
    articles: Array.isArray(data.articles) ? data.articles : [],
    flights: data.flights || { source: "OpenSky Network", status: "not loaded", updatedAt, aircraft: [] },
    places: Array.isArray(data.places) ? data.places : [],
    regions: Array.isArray(data.regions) ? data.regions : [],
    ships: data.ships || { source: "AISStream", status: "free AISSTREAM_KEY required for live vessel WebSocket streaming", updatedAt, vessels: [], lanes: [] },
    sources: Array.isArray(data.sources) ? data.sources : [],
    source: data.source || "free APIs",
    status: data.status || "Free providers returned no current signals.",
    updatedAt
  };
}

function countWorldSignals(feed = {}) {
  return (feed.articles?.length || 0) + (feed.flights?.aircraft?.length || 0) + (feed.ships?.vessels?.length || 0);
}

function renderWorldNews(data) {
  const articles = data.articles || [];
  const regions = data.regions || [];
  const aircraft = data.flights?.aircraft || [];
  const vessels = data.ships?.vessels || [];
  els.worldNewsList.innerHTML = "";
  els.worldRegionStrip.innerHTML = "";
  els.worldLayerStatus.textContent = `${articles.length} news / ${aircraft.length} aircraft / ${vessels.length} vessels / ${data.ships?.status || "maritime ready"}`;

  regions.slice(0, 6).forEach((region) => {
    const item = document.createElement("div");
    item.className = "world-region";
    item.innerHTML = `
      <span>${escapeHtml(region.region)}</span>
      <strong>${Number(region.count) || 0}</strong>
      <small>${escapeHtml(region.latestAt ? formatDateTime(region.latestAt) : "--")}</small>
    `;
    els.worldRegionStrip.append(item);
  });

  if (!articles.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = data.status || "No free-provider articles are available right now.";
    els.worldNewsList.append(empty);
  }

  articles.forEach((article, index) => {
    const item = document.createElement("article");
    item.className = "world-news-item";
    item.innerHTML = `
      <div>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(article.placeName || article.sourceCountry || "Unknown")}</strong>
      </div>
      <a href="${escapeAttribute(article.url)}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a>
      <small>${escapeHtml(article.domain || "--")} / ${escapeHtml(article.region || "--")} / ${escapeHtml(article.seenAt ? formatDateTime(article.seenAt) : "--")}</small>
    `;
    item.addEventListener("pointerenter", () => focusWorldFeature("news", article.id));
    item.addEventListener("click", () => showWorldIntel("news", article));
    els.worldNewsList.append(item);
  });
}

async function initWorldGlobe() {
  if (state.worldNewsGlobe || !els.worldGlobeCanvas) return;
  await waitForCesium();
  const config = await loadWorldMapConfig();
  window.CESIUM_BASE_URL = config.cesiumBaseUrl || "/cesium/";
  if (config.cesiumIonToken) Cesium.Ion.defaultAccessToken = config.cesiumIonToken;
  const terrain = config.cesiumIonToken && Cesium.Terrain
    ? Cesium.Terrain.fromWorldTerrain()
    : undefined;
  const baseLayer = await createWorldBaseLayer(config);
  const viewerOptions = {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    shouldAnimate: true,
    timeline: false
  };
  if (terrain) viewerOptions.terrain = terrain;
  if (baseLayer?.layer) viewerOptions.baseLayer = baseLayer.layer;
  if (baseLayer?.provider) viewerOptions.imageryProvider = baseLayer.provider;
  const viewer = new Cesium.Viewer(els.worldGlobeCanvas, viewerOptions);
  viewer.scene.globe.enableLighting = true;
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.fog.enabled = true;
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = config.cesiumIonToken ? 400 : 80000;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 42000000;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(18, 26, 14500000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-82),
      roll: 0
    }
  });

  state.worldNewsGlobe = {
    config,
    data: normalizeWorldFeed(),
    entities: {
      flights: [],
      news: [],
      ships: []
    },
    focus: null,
    viewer
  };
}

function waitForCesium() {
  if (window.Cesium) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.Cesium) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 8000) {
        clearInterval(timer);
        reject(new Error("3D globe engine did not load."));
      }
    }, 50);
  });
}

async function loadWorldMapConfig() {
  const response = await fetch("/api/world-news/config", {
    cache: "no-store",
    credentials: "same-origin"
  });
  if (!response.ok) return { cesiumBaseUrl: "/cesium/", cesiumIonToken: "" };
  return response.json().catch(() => ({ cesiumBaseUrl: "/cesium/", cesiumIonToken: "" }));
}

async function createWorldBaseLayer(config = {}) {
  if (config.cesiumIonToken) return null;
  const baseUrl = config.cesiumBaseUrl || "/cesium/";
  const naturalEarthUrl = `${baseUrl.replace(/\/?$/, "/")}Assets/Textures/NaturalEarthII`;

  try {
    const arcGisUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
    if (Cesium.ArcGisMapServerImageryProvider?.fromUrl) {
      const provider = Cesium.ArcGisMapServerImageryProvider.fromUrl(arcGisUrl);
      if (Cesium.ImageryLayer?.fromProviderAsync) {
        return { layer: Cesium.ImageryLayer.fromProviderAsync(provider) };
      }
      return { provider: await provider };
    }
    if (Cesium.ArcGisMapServerImageryProvider) {
      return { provider: new Cesium.ArcGisMapServerImageryProvider({ url: arcGisUrl }) };
    }
  } catch (error) {
    console.warn("ArcGIS World Imagery fallback unavailable.", error);
  }

  try {
    if (Cesium.OpenStreetMapImageryProvider?.fromUrl) {
      const provider = Cesium.OpenStreetMapImageryProvider.fromUrl("https://tile.openstreetmap.org/");
      if (Cesium.ImageryLayer?.fromProviderAsync) {
        return { layer: Cesium.ImageryLayer.fromProviderAsync(provider) };
      }
      return { provider: await provider };
    }
    if (Cesium.OpenStreetMapImageryProvider) {
      return { provider: new Cesium.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" }) };
    }
  } catch (error) {
    console.warn("OpenStreetMap fallback unavailable.", error);
  }

  try {
    if (Cesium.TileMapServiceImageryProvider?.fromUrl) {
      const provider = Cesium.TileMapServiceImageryProvider.fromUrl(naturalEarthUrl);
      if (Cesium.ImageryLayer?.fromProviderAsync) {
        return { layer: Cesium.ImageryLayer.fromProviderAsync(provider) };
      }
      return { provider: await provider };
    }
    if (Cesium.TileMapServiceImageryProvider) {
      return { provider: new Cesium.TileMapServiceImageryProvider({ url: naturalEarthUrl }) };
    }
  } catch (error) {
    console.warn("Local Cesium base map unavailable.", error);
  }

  return null;
}

function updateWorldGlobeData(data) {
  const globe = state.worldNewsGlobe;
  if (!globe?.viewer) return;
  globe.data = data;
  Object.values(globe.entities).flat().forEach((entity) => globe.viewer.entities.remove(entity));
  globe.entities = { flights: [], news: [], ships: [] };

  const newsByPlace = new Map();
  (data.articles || []).forEach((article) => {
    const lat = Number(article.lat);
    const lon = Number(article.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const current = newsByPlace.get(key) || { ...article, count: 0, headlines: [] };
    current.count += 1;
    current.headlines.push(article.title);
    newsByPlace.set(key, current);
  });
  [...newsByPlace.values()].forEach((article) => {
    const signalColor = article.signalType === "earthquake" ? "#fb7185" : article.signalType === "natural event" ? "#f97316" : "#f7f7f2";
    const entity = globe.viewer.entities.add({
      name: article.placeName || article.sourceCountry || "News signal",
      position: Cesium.Cartesian3.fromDegrees(Number(article.lon), Number(article.lat), 1200),
      point: {
        color: Cesium.Color.fromCssColorString(signalColor).withAlpha(.92),
        outlineColor: Cesium.Color.BLACK.withAlpha(.75),
        outlineWidth: 1,
        pixelSize: Math.min(20, 8 + article.count * 1.4),
        scaleByDistance: new Cesium.NearFarScalar(200000, 1.4, 14000000, .45)
      },
      label: {
        text: article.count > 1 ? String(article.count) : "",
        font: "700 11px Inter, sans-serif",
        fillColor: Cesium.Color.BLACK,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        scaleByDistance: new Cesium.NearFarScalar(200000, 1, 9000000, 0)
      },
      properties: { payload: article, type: "news" }
    });
    globe.entities.news.push(entity);
  });

  (data.flights?.aircraft || []).forEach((aircraft) => {
    const lat = Number(aircraft.lat);
    const lon = Number(aircraft.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const altitude = Math.max(2000, Number(aircraft.altitudeMeters) || 9000);
    const entity = globe.viewer.entities.add({
      name: aircraft.callsign || aircraft.id || "Aircraft",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      billboard: {
        image: createWorldIconDataUri("flight", "#7dd3fc"),
        rotation: Cesium.Math.toRadians(Number(aircraft.track) || 0),
        alignedAxis: Cesium.Cartesian3.ZERO,
        heightReference: Cesium.HeightReference.NONE,
        scale: .72,
        scaleByDistance: new Cesium.NearFarScalar(200000, 1, 12000000, .35)
      },
      label: {
        text: aircraft.callsign || "",
        font: "800 10px Inter, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#d9f7ff"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -24),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        scaleByDistance: new Cesium.NearFarScalar(200000, 1, 6000000, 0)
      },
      properties: { payload: aircraft, type: "flight" }
    });
    globe.entities.flights.push(entity);
  });

  (data.ships?.lanes || []).forEach((lane) => {
    const lat = Number(lane.lat);
    const lon = Number(lane.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const entity = globe.viewer.entities.add({
      name: lane.name || "Maritime lane",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 500),
      ellipse: {
        height: 0,
        semiMajorAxis: 120000,
        semiMinorAxis: 120000,
        material: Cesium.Color.fromCssColorString("#facc15").withAlpha(.13),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#facc15").withAlpha(.7)
      },
      label: {
        text: lane.name || "",
        font: "800 11px Inter, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#facc15"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        scaleByDistance: new Cesium.NearFarScalar(200000, 1, 8000000, .2)
      },
      properties: { payload: lane, type: "ship" }
    });
    globe.entities.ships.push(entity);
  });

  (data.ships?.vessels || []).forEach((ship) => {
    const lat = Number(ship.lat);
    const lon = Number(ship.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const entity = globe.viewer.entities.add({
      name: ship.name || ship.mmsi || "Vessel",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 200),
      billboard: {
        image: createWorldIconDataUri("ship", "#facc15"),
        rotation: Cesium.Math.toRadians(Number(ship.course ?? ship.heading) || 0),
        alignedAxis: Cesium.Cartesian3.ZERO,
        heightReference: Cesium.HeightReference.NONE,
        scale: .68,
        scaleByDistance: new Cesium.NearFarScalar(150000, 1, 9000000, .3)
      },
      label: {
        text: ship.name || "",
        font: "800 10px Inter, sans-serif",
        fillColor: Cesium.Color.fromCssColorString("#fff5b8"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        scaleByDistance: new Cesium.NearFarScalar(150000, 1, 4000000, 0)
      },
      properties: { payload: ship, type: "ship" }
    });
    globe.entities.ships.push(entity);
  });

  Object.entries(state.worldLayers).forEach(([layer, active]) => setWorldMapLayer(layer, active));
  wireCesiumSelection(globe);
}

function focusWorldFeature(type, id) {
  if (!state.worldNewsGlobe) return;
  state.worldNewsGlobe.focus = { type, id };
}

function toggleWorldLayer(layer, button) {
  state.worldLayers[layer] = !state.worldLayers[layer];
  button.classList.toggle("active", state.worldLayers[layer]);
  setWorldMapLayer(layer, state.worldLayers[layer]);
}

function setWorldMapLayer(layer, active) {
  const globe = state.worldNewsGlobe;
  const entities = globe?.entities?.[layer] || [];
  entities.forEach((entity) => {
    entity.show = active;
  });
}

function wireCesiumSelection(globe) {
  if (globe.selectionHandler) return;
  globe.selectionHandler = new Cesium.ScreenSpaceEventHandler(globe.viewer.scene.canvas);
  globe.selectionHandler.setInputAction((movement) => {
    const picked = globe.viewer.scene.pick(movement.position);
    const entity = picked?.id;
    const type = entity?.properties?.type?.getValue?.();
    const payload = entity?.properties?.payload?.getValue?.();
    if (!type || !payload) return;
    showWorldIntel(type, payload);
    focusWorldFeature(type, payload.id || payload.mmsi || payload.name);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function createWorldIconDataUri(type, color) {
  const svg = type === "flight"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><path d="M21 3l6 24 10 5-2 4-10-3-4 6-4-6-10 3-2-4 10-5z" fill="${color}" stroke="#050505" stroke-width="2"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><path d="M21 4l14 15-6 17H13L7 19z" fill="${color}" stroke="#050505" stroke-width="2"/><path d="M13 24h16" stroke="#050505" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function showWorldIntel(type, item) {
  if (!els.worldIntelPanel || !item) return;
  if (type === "flight") {
    els.worldIntelPanel.innerHTML = `
      <p class="eyebrow">Aircraft</p>
      <h3>${escapeHtml(item.callsign || item.id || "Unknown aircraft")}</h3>
      <p>${escapeHtml(item.originCountry || "Unknown origin")} / ${item.onGround ? "on ground" : "airborne"}</p>
      <dl>
        <div><dt>Altitude</dt><dd>${formatNumber(item.altitudeMeters || 0, 0)} m</dd></div>
        <div><dt>Speed</dt><dd>${formatNumber((item.speedMps || 0) * 3.6, 0)} km/h</dd></div>
        <div><dt>Track</dt><dd>${formatNumber(item.track || 0, 0)} deg</dd></div>
        <div><dt>Last contact</dt><dd>${escapeHtml(item.lastContact ? formatDateTime(item.lastContact) : "--")}</dd></div>
      </dl>
    `;
    return;
  }
  if (type === "ship") {
    els.worldIntelPanel.innerHTML = `
      <p class="eyebrow">Maritime</p>
      <h3>${escapeHtml(item.name || item.id || "Vessel")}</h3>
      <p>${escapeHtml(item.destination ? `Destination: ${item.destination}` : item.traffic || "AISStream key not configured.")}</p>
      <dl>
        <div><dt>Flag</dt><dd>${escapeHtml(item.flag || "--")}</dd></div>
        <div><dt>Speed</dt><dd>${item.speedKnots ? `${formatNumber(item.speedKnots, 1)} kn` : "--"}</dd></div>
        <div><dt>Latitude</dt><dd>${escapeHtml(String(item.lat || "--"))}</dd></div>
        <div><dt>Longitude</dt><dd>${escapeHtml(String(item.lon || "--"))}</dd></div>
        <div><dt>Last seen</dt><dd>${escapeHtml(item.lastSeenAt ? formatDateTime(item.lastSeenAt) : "--")}</dd></div>
      </dl>
    `;
    return;
  }
  const place = item.place || {};
  els.worldIntelPanel.innerHTML = `
    <p class="eyebrow">News place</p>
    <h3>${escapeHtml(item.placeName || place.name || item.sourceCountry || "Signal")}</h3>
    <p>${escapeHtml(item.title || "")}</p>
    <dl>
      <div><dt>Country</dt><dd>${escapeHtml(place.country || item.sourceCountry || "--")}</dd></div>
      <div><dt>Region</dt><dd>${escapeHtml(place.region || item.region || "--")}</dd></div>
      <div><dt>Population</dt><dd>${place.population ? formatNumber(place.population, 0) : "regional centroid"}</dd></div>
      <div><dt>Source</dt><dd>${escapeHtml(item.domain || "--")}</dd></div>
    </dl>
    <a href="${escapeAttribute(item.url || "#")}" target="_blank" rel="noreferrer">Open source</a>
  `;
}

function drawWorldMap(map, time) {
  const { context: ctx, width, height } = map;
  if (!width || !height) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, width, height);
  drawMapGrid(map);
  drawCountries(map);
  drawSignalDensity(map);
  map.markers = [];
  drawNewsMarkers(map, time);
  drawFlightMarkers(map);
  drawShipMarkers(map);
  drawMapScale(map);
}

function drawMapGrid(map) {
  const ctx = map.context;
  ctx.save();
  ctx.strokeStyle = "rgba(247,247,242,.08)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 20) {
    const a = worldToScreen(map, -85, lon);
    const b = worldToScreen(map, 85, lon);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let lat = -80; lat <= 80; lat += 20) {
    const a = worldToScreen(map, lat, -180);
    const b = worldToScreen(map, lat, 180);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCountries(map) {
  const ctx = map.context;
  ctx.save();
  ctx.lineWidth = .8;
  ctx.strokeStyle = "rgba(247,247,242,.22)";
  ctx.fillStyle = "rgba(247,247,242,.055)";
  map.countries.forEach((feature) => {
    const rings = geometryRings(feature.geometry);
    rings.forEach((ring) => {
      ctx.beginPath();
      ring.forEach(([lon, lat], index) => {
        const point = worldToScreen(map, lat, lon);
        if (index) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  });
  ctx.restore();
}

function geometryRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function drawSignalDensity(map) {
  const ctx = map.context;
  const points = [
    ...(map.data.articles || []).slice(0, 80).map((item) => ({ ...item, color: "rgba(255,255,255,.08)" })),
    ...(map.data.flights?.aircraft || []).slice(0, 120).map((item) => ({ ...item, color: "rgba(125,211,252,.055)" })),
    ...(map.data.ships?.vessels || []).slice(0, 120).map((item) => ({ ...item, color: "rgba(250,204,21,.06)" }))
  ];
  ctx.save();
  points.forEach((item) => {
    const point = worldToScreen(map, Number(item.lat), Number(item.lon));
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const radius = Math.max(22, 34 * map.zoom);
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, item.color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawNewsMarkers(map, time) {
  if (!state.worldLayers.news) return;
  const grouped = new Map();
  (map.data.articles || []).forEach((article) => {
    const key = `${Number(article.lat).toFixed(2)},${Number(article.lon).toFixed(2)}`;
    if (!grouped.has(key)) grouped.set(key, { ...article, count: 0 });
    grouped.get(key).count += 1;
  });
  [...grouped.values()].forEach((article, index) => {
    const point = worldToScreen(map, Number(article.lat), Number(article.lon));
    const focused = isWorldFocus(map, "news", article.id);
    const pulse = focused ? 1.8 : 1 + Math.sin(time * .005 + index) * .18;
    drawNewsPin(map.context, point.x, point.y, article.count, pulse);
    map.markers.push({ ...point, hit: 13, id: article.id, payload: article, type: "news" });
  });
}

function drawFlightMarkers(map) {
  if (!state.worldLayers.flights) return;
  (map.data.flights?.aircraft || []).forEach((aircraft) => {
    const point = worldToScreen(map, Number(aircraft.lat), Number(aircraft.lon));
    drawPlaneIcon(map.context, point.x, point.y, Number(aircraft.track) || 0, isWorldFocus(map, "flight", aircraft.id));
    map.markers.push({ ...point, hit: 10, id: aircraft.id, payload: aircraft, type: "flight" });
  });
}

function drawShipMarkers(map) {
  if (!state.worldLayers.ships) return;
  const ships = map.data.ships?.vessels || [];
  const lanes = map.data.ships?.lanes || [];
  lanes.forEach((lane) => {
    const point = worldToScreen(map, Number(lane.lat), Number(lane.lon));
    drawLaneMarker(map.context, point.x, point.y, lane.name);
    map.markers.push({ ...point, hit: 11, id: lane.name, payload: lane, type: "ship" });
  });
  ships.forEach((ship) => {
    const point = worldToScreen(map, Number(ship.lat), Number(ship.lon));
    drawShipIcon(map.context, point.x, point.y, Number(ship.course ?? ship.heading) || 0, isWorldFocus(map, "ship", ship.id));
    map.markers.push({ ...point, hit: 9, id: ship.id || ship.mmsi, payload: ship, type: "ship" });
  });
}

function drawNewsPin(ctx, x, y, count, pulse) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.6)";
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 4.5 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (count > 1) {
    ctx.fillStyle = "#050505";
    ctx.font = "700 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.min(count, 99)), x, y);
  }
  ctx.restore();
}

function drawPlaneIcon(ctx, x, y, track, focused) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((track || 0) * Math.PI / 180);
  ctx.fillStyle = focused ? "#ffffff" : "#7dd3fc";
  ctx.strokeStyle = "rgba(5,5,5,.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(4, 6);
  ctx.lineTo(0, 3);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawShipIcon(ctx, x, y, course, focused) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((course || 0) * Math.PI / 180);
  ctx.fillStyle = focused ? "#fff5b8" : "#facc15";
  ctx.strokeStyle = "rgba(5,5,5,.72)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(6, 1);
  ctx.lineTo(3, 7);
  ctx.lineTo(-3, 7);
  ctx.lineTo(-6, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLaneMarker(ctx, x, y, label) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.strokeStyle = "rgba(250,204,21,.5)";
  ctx.fillStyle = "rgba(250,204,21,.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
  if (label) {
    ctx.fillStyle = "rgba(247,247,242,.68)";
    ctx.font = "800 9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(label).slice(0, 18).toUpperCase(), x + 12, y + 3);
  }
  ctx.restore();
}

function drawMapScale(map) {
  const ctx = map.context;
  ctx.save();
  ctx.fillStyle = "rgba(247,247,242,.72)";
  ctx.font = "800 10px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`ZOOM ${map.zoom.toFixed(1)}X`, 18, map.height - 20);
  ctx.fillText("EQUIRECTANGULAR / OPEN DATA", 18, map.height - 38);
  ctx.restore();
}

function worldToScreen(map, lat, lon) {
  const scale = (map.baseScale || 1) * (map.zoom || 1);
  return {
    x: (map.originX || 0) + (lon * scale) + (map.panX || 0),
    y: (map.originY || 0) - (lat * scale) + (map.panY || 0)
  };
}

function screenToWorld(map, x, y) {
  const scale = (map.baseScale || 1) * (map.zoom || 1);
  return {
    lat: ((map.originY || 0) + (map.panY || 0) - y) / scale,
    lon: (x - (map.originX || 0) - (map.panX || 0)) / scale
  };
}

function isWorldFocus(map, type, id) {
  return map.focus && map.focus.type === type && map.focus.id === id;
}

async function createSecureMessageLink(event) {
  event.preventDefault();
  if (!state.secureMessageAccess || !state.secureMessageAccess.allowed) {
    setSecureMessageStatus("Secure Message access required.");
    return;
  }

  const message = els.secureMessageInput.value;
  if (!message.trim()) {
    setSecureMessageStatus("Write a message first.");
    return;
  }

  if (!window.crypto || !window.crypto.subtle) {
    setSecureMessageStatus("Web Crypto is not available in this browser.");
    return;
  }

  try {
    setSecureMessageStatus("Encrypting in browser...");
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(message)
    );
    const rawKey = await window.crypto.subtle.exportKey("raw", key);
    const payload = base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify({
      v: 1,
      iv: base64UrlEncodeBytes(iv),
      ct: base64UrlEncodeBytes(new Uint8Array(ciphertext))
    })));
    const token = `${payload}.${base64UrlEncodeBytes(new Uint8Array(rawKey))}`;
    const link = `${window.location.origin}${window.location.pathname}${window.location.search}#message=${token}`;
    await logSecureMessageSend({
      ciphertextBytes: new Uint8Array(ciphertext).byteLength,
      messageBytes: new TextEncoder().encode(message).byteLength
    });

    els.secureLinkOutput.value = link;
    els.secureLinkPanel.hidden = false;
    els.secureReadPanel.hidden = true;
    els.secureViewState.textContent = "sealed";
    setSecureMessageStatus("Link sealed. The key stays in the URL fragment.");
    animateMetricPulse(els.secureLinkPanel);
  } catch {
    setSecureMessageStatus("Could not encrypt this message.");
  }
}

async function loadSecureMessageAccess() {
  if (!state.user) return;
  try {
    const response = await fetch("/api/secure-message/access", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Secure Message access unavailable.");
    state.secureMessageAccess = data;
    renderSecureMessageAccess(data);
  } catch (error) {
    state.secureMessageAccess = { allowed: false, status: "unavailable" };
    renderSecureMessageAccess(state.secureMessageAccess);
    setSecureMessageStatus(error.message || "Secure Message access unavailable.");
  }
}

function renderSecureMessageAccess(access = {}) {
  const allowed = Boolean(access.allowed);
  els.secureMessageInput.disabled = !allowed;
  els.secureMessageForm.querySelectorAll("button[type='submit']").forEach((button) => {
    button.disabled = !allowed;
  });

  if (allowed) {
    els.secureSignupPanel.hidden = true;
    setSecureMessageStatus("Ready. Nothing leaves this browser except send metadata.");
    return;
  }

  els.secureSignupPanel.hidden = false;
  els.secureSignupButton.disabled = access.status === "pending" || access.status === "unavailable";
  if (access.status === "pending") {
    els.secureSignupTitle.textContent = "Secure Message request pending.";
    els.secureSignupText.textContent = "An admin needs to approve this Linje account before encrypted links can be created.";
    setSecureMessageStatus("Waiting for Secure Message approval.");
  } else if (access.status === "unavailable") {
    els.secureSignupTitle.textContent = "Secure Message unavailable.";
    els.secureSignupText.textContent = "Access could not be checked right now.";
  } else {
    els.secureSignupTitle.textContent = "Secure Message signup required.";
    els.secureSignupText.textContent = "Register this Linje account for Secure Message before creating encrypted links.";
    setSecureMessageStatus("Request Secure Message access to continue.");
  }
}

async function requestSecureMessageAccess() {
  try {
    els.secureSignupButton.disabled = true;
    setSecureMessageStatus("Requesting Secure Message access...");
    const response = await fetch("/api/secure-message/access", {
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not request access.");
    state.secureMessageAccess = data;
    renderSecureMessageAccess(data);
  } catch (error) {
    els.secureSignupButton.disabled = false;
    setSecureMessageStatus(error.message || "Could not request access.");
  }
}

async function logSecureMessageSend({ messageBytes, ciphertextBytes }) {
  const response = await fetch("/api/secure-message/send", {
    body: JSON.stringify({ messageBytes, ciphertextBytes }),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Secure Message send was not authorized.");
  }
}

async function decryptSecureMessageFromHash() {
  if (!window.location.hash.startsWith("#message=")) return;
  if (!window.crypto || !window.crypto.subtle) {
    setSecureMessageStatus("Web Crypto is not available in this browser.");
    return;
  }

  try {
    const token = window.location.hash.slice("#message=".length);
    if (token === state.secureMessageViewedToken) return;
    const [payloadPart, keyPart] = token.split(".");
    if (!payloadPart || !keyPart) throw new Error("Bad token");
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(payloadPart)));
    if (payload.v !== 1 || !payload.iv || !payload.ct) throw new Error("Bad payload");

    const key = await window.crypto.subtle.importKey(
      "raw",
      base64UrlDecodeBytes(keyPart),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const plaintext = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlDecodeBytes(payload.iv) },
      key,
      base64UrlDecodeBytes(payload.ct)
    );

    state.secureMessageViewedToken = token;
    history.replaceState(null, "", "#secure-message");
    els.secureMessageInput.value = "";
    els.secureLinkOutput.value = "";
    els.secureReadOutput.textContent = new TextDecoder().decode(plaintext);
    els.secureReadPanel.hidden = false;
    els.secureLinkPanel.hidden = true;
    els.secureViewState.textContent = "viewed";
    setSecureMessageStatus("Fragment cleared. The link cannot reopen this message from this page.");
    animateMetricPulse(els.secureReadPanel);
  } catch {
    history.replaceState(null, "", "#secure-message");
    setSecureMessageStatus("Message link is invalid or already stripped.");
  }
}

async function copySecureMessageLink() {
  const link = els.secureLinkOutput.value;
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    setSecureMessageStatus("Copied.");
  } catch {
    els.secureLinkOutput.select();
    document.execCommand("copy");
    setSecureMessageStatus("Copied.");
  }
}

function clearSecureMessageComposer() {
  els.secureMessageInput.value = "";
  els.secureLinkOutput.value = "";
  els.secureLinkPanel.hidden = true;
  state.secureMessageViewedToken = "";
  els.secureViewState.textContent = "armed";
  setSecureMessageStatus("Ready. Nothing leaves this browser.");
}

function burnSecureMessage() {
  els.secureReadOutput.textContent = "";
  els.secureReadPanel.hidden = true;
  els.secureViewState.textContent = "burned";
  setSecureMessageStatus("Message burned from this view.");
}

function setSecureMessageStatus(message) {
  els.secureMessageStatus.textContent = message;
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeBytes(value) {
  const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
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

function handleSecretBrandClick(event) {
  if (!state.user) return;
  event.preventDefault();

  window.clearTimeout(state.arcadeClickTimer);
  state.arcadeClicks += 1;
  state.arcadeClickTimer = window.setTimeout(() => {
    state.arcadeClicks = 0;
  }, 1800);

  if (state.arcadeClicks >= 6) {
    state.arcadeClicks = 0;
    state.arcadeUnlocked = true;
    showArcadeView();
    return;
  }

  showHomeView();
}

function startArcadeGame() {
  if (!state.arcade) {
    resetArcadeGame();
    window.requestAnimationFrame(tickArcadeGame);
    return;
  }
  state.arcade.running = true;
  drawArcadeGame();
}

function selectArcadeGame(gameId) {
  if (!ARCADE_GAMES[gameId]) return;
  state.arcadeGame = gameId;
  state.arcade = null;
  updateArcadeGameChrome();
  resetArcadeGame();
}

function updateArcadeGameChrome() {
  const game = ARCADE_GAMES[state.arcadeGame] || ARCADE_GAMES.invaders;
  els.arcadeCurrentGame.textContent = game.label;
  els.arcadeGameButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.arcadeGame === state.arcadeGame);
  });
}

function resetArcadeGame() {
  const canvas = els.arcadeCanvas;
  if (!canvas) return;
  updateArcadeGameChrome();
  if (state.arcadeGame === "snake") {
    resetSnakeGame(canvas);
    return;
  }
  if (state.arcadeGame === "breaker") {
    resetBreakerGame(canvas);
    return;
  }
  if (state.arcadeGame === "dodge") {
    resetDodgeGame(canvas);
    return;
  }
  resetInvadersGame(canvas);
}

function resetInvadersGame(canvas) {
  const enemies = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      enemies.push({
        alive: true,
        x: 96 + col * 70,
        y: 70 + row * 42
      });
    }
  }

  state.arcade = {
    bullets: [],
    direction: 1,
    enemyBullets: [],
    enemies,
    enemyStep: 0,
    fireCooldown: 0,
    keys: { left: false, right: false },
    last: performance.now(),
    lives: 3,
    mode: "invaders",
    over: false,
    playerX: canvas.width / 2,
    running: true,
    score: 0,
    submitted: false,
    status: ARCADE_GAMES.invaders.status
  };
  updateArcadeHud();
  drawArcadeGame();
}

function resetSnakeGame(canvas) {
  state.arcade = {
    direction: "right",
    food: { x: 17, y: 10 },
    keys: { left: false, right: false, up: false, down: false },
    last: performance.now(),
    lives: 1,
    mode: "snake",
    nextDirection: "right",
    over: false,
    running: true,
    score: 0,
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ],
    step: 0,
    submitted: false,
    status: ARCADE_GAMES.snake.status
  };
  placeSnakeFood(canvas);
  updateArcadeHud();
  drawArcadeGame();
}

function resetBreakerGame(canvas) {
  const bricks = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      bricks.push({ alive: true, x: 70 + col * 76, y: 66 + row * 32 });
    }
  }
  state.arcade = {
    ball: { dx: 4.2, dy: -4.8, x: canvas.width / 2, y: 398 },
    bricks,
    fireCooldown: 0,
    keys: { left: false, right: false },
    last: performance.now(),
    lives: 3,
    mode: "breaker",
    over: false,
    paddleX: canvas.width / 2,
    running: true,
    score: 0,
    submitted: false,
    status: ARCADE_GAMES.breaker.status
  };
  updateArcadeHud();
  drawArcadeGame();
}

function resetDodgeGame(canvas) {
  state.arcade = {
    keys: { left: false, right: false },
    last: performance.now(),
    lives: 3,
    mode: "dodge",
    over: false,
    packets: [],
    playerX: canvas.width / 2,
    running: true,
    score: 0,
    spawn: 0,
    submitted: false,
    survived: 0,
    status: ARCADE_GAMES.dodge.status
  };
  updateArcadeHud();
  drawArcadeGame();
}

function tickArcadeGame(now = performance.now()) {
  const game = state.arcade;
  if (game && game.running && !els.arcadeView.hidden) {
    const delta = Math.min(32, now - game.last) / 16.67;
    game.last = now;
    updateArcadeGame(delta);
    drawArcadeGame();
  }
  window.requestAnimationFrame(tickArcadeGame);
}

function updateArcadeGame(delta) {
  const game = state.arcade;
  if (!game || game.over) return;
  if (game.mode === "snake") {
    updateSnakeGame(delta);
    return;
  }
  if (game.mode === "breaker") {
    updateBreakerGame(delta);
    return;
  }
  if (game.mode === "dodge") {
    updateDodgeGame(delta);
    return;
  }
  updateInvadersGame(delta);
}

function updateInvadersGame(delta) {
  const game = state.arcade;
  if (!game || game.over) return;
  const canvas = els.arcadeCanvas;
  const speed = 6.2 * delta;

  if (game.keys.left) game.playerX -= speed;
  if (game.keys.right) game.playerX += speed;
  game.playerX = Math.max(36, Math.min(canvas.width - 36, game.playerX));

  game.fireCooldown = Math.max(0, game.fireCooldown - delta);
  game.bullets.forEach((bullet) => {
    bullet.y -= 9 * delta;
  });
  game.enemyBullets.forEach((bullet) => {
    bullet.y += 5 * delta;
  });

  game.enemyStep += delta;
  if (game.enemyStep >= 18) {
    game.enemyStep = 0;
    const alive = game.enemies.filter((enemy) => enemy.alive);
    const edge = alive.some((enemy) => enemy.x < 42 || enemy.x > canvas.width - 42);
    if (edge) {
      game.direction *= -1;
      alive.forEach((enemy) => {
        enemy.y += 18;
      });
    } else {
      alive.forEach((enemy) => {
        enemy.x += 12 * game.direction;
      });
    }
    if (alive.length && Math.random() < .55) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      game.enemyBullets.push({ x: shooter.x, y: shooter.y + 16 });
    }
  }

  game.bullets.forEach((bullet) => {
    game.enemies.forEach((enemy) => {
      if (!enemy.alive || bullet.dead) return;
      if (Math.abs(bullet.x - enemy.x) < 22 && Math.abs(bullet.y - enemy.y) < 18) {
        enemy.alive = false;
        bullet.dead = true;
        game.score += 25;
      }
    });
  });

  game.enemyBullets.forEach((bullet) => {
    if (bullet.dead) return;
    if (Math.abs(bullet.x - game.playerX) < 28 && Math.abs(bullet.y - 456) < 18) {
      bullet.dead = true;
      game.lives -= 1;
      game.status = game.lives ? "Hull hit. Keep moving." : "Game over. Restart to try again.";
    }
  });

  game.bullets = game.bullets.filter((bullet) => !bullet.dead && bullet.y > -20);
  game.enemyBullets = game.enemyBullets.filter((bullet) => !bullet.dead && bullet.y < canvas.height + 20);

  if (!game.enemies.some((enemy) => enemy.alive)) {
    game.over = true;
    game.status = "Wave cleared. Nice.";
  } else if (game.lives <= 0 || game.enemies.some((enemy) => enemy.alive && enemy.y > 420)) {
    game.over = true;
    game.status = "Game over. Restart to try again.";
  }

  if (game.over && !game.submitted) {
    game.submitted = true;
    submitArcadeScore(game.score);
  }

  updateArcadeHud();
}

function updateSnakeGame(delta) {
  const game = state.arcade;
  const canvas = els.arcadeCanvas;
  game.step += delta;
  if (game.step < 8) return;
  game.step = 0;
  game.direction = game.nextDirection;
  const head = { ...game.snake[0] };
  if (game.direction === "left") head.x -= 1;
  if (game.direction === "right") head.x += 1;
  if (game.direction === "up") head.y -= 1;
  if (game.direction === "down") head.y += 1;

  const cols = 30;
  const rows = 18;
  const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
  const hitSelf = game.snake.some((segment) => segment.x === head.x && segment.y === head.y);
  if (hitWall || hitSelf) {
    game.over = true;
    game.status = "Signal lost. Restart to try again.";
    submitFinishedArcadeScore(game);
    updateArcadeHud();
    return;
  }

  game.snake.unshift(head);
  if (head.x === game.food.x && head.y === game.food.y) {
    game.score += 35;
    placeSnakeFood(canvas);
  } else {
    game.snake.pop();
  }
  updateArcadeHud();
}

function updateBreakerGame(delta) {
  const game = state.arcade;
  const canvas = els.arcadeCanvas;
  const speed = 7 * delta;
  if (game.keys.left) game.paddleX -= speed;
  if (game.keys.right) game.paddleX += speed;
  game.paddleX = Math.max(58, Math.min(canvas.width - 58, game.paddleX));

  const ball = game.ball;
  ball.x += ball.dx * delta;
  ball.y += ball.dy * delta;
  if (ball.x < 12 || ball.x > canvas.width - 12) ball.dx *= -1;
  if (ball.y < 16) ball.dy = Math.abs(ball.dy);
  if (Math.abs(ball.x - game.paddleX) < 62 && ball.y > 424 && ball.y < 452 && ball.dy > 0) {
    ball.dy *= -1;
    ball.dx += (ball.x - game.paddleX) / 28;
  }

  game.bricks.forEach((brick) => {
    if (!brick.alive) return;
    if (Math.abs(ball.x - brick.x) < 34 && Math.abs(ball.y - brick.y) < 14) {
      brick.alive = false;
      ball.dy *= -1;
      game.score += 20;
    }
  });

  if (ball.y > canvas.height + 10) {
    game.lives -= 1;
    if (game.lives <= 0) {
      game.over = true;
      game.status = "Glass shattered. Restart to try again.";
      submitFinishedArcadeScore(game);
    } else {
      game.ball = { dx: 4.2, dy: -4.8, x: canvas.width / 2, y: 398 };
      game.status = "Ball reset. Keep breaking.";
    }
  } else if (!game.bricks.some((brick) => brick.alive)) {
    game.over = true;
    game.status = "Board cleared. Clean.";
    submitFinishedArcadeScore(game);
  }
  updateArcadeHud();
}

function updateDodgeGame(delta) {
  const game = state.arcade;
  const canvas = els.arcadeCanvas;
  const speed = 7.2 * delta;
  if (game.keys.left) game.playerX -= speed;
  if (game.keys.right) game.playerX += speed;
  game.playerX = Math.max(34, Math.min(canvas.width - 34, game.playerX));
  game.survived += delta;
  game.score = Math.floor(game.survived * 2);
  game.spawn -= delta;
  if (game.spawn <= 0) {
    game.spawn = Math.max(7, 22 - game.survived / 18);
    game.packets.push({
      size: 16 + Math.random() * 18,
      speed: 3.5 + Math.random() * 3.2 + game.survived / 160,
      x: 32 + Math.random() * (canvas.width - 64),
      y: -30
    });
  }
  game.packets.forEach((packet) => {
    packet.y += packet.speed * delta;
    if (Math.abs(packet.x - game.playerX) < packet.size + 18 && Math.abs(packet.y - 452) < packet.size + 16) {
      packet.hit = true;
      game.lives -= 1;
      game.status = game.lives ? "Packet clipped you. Keep dodging." : "Connection dropped. Restart to try again.";
    }
  });
  game.packets = game.packets.filter((packet) => !packet.hit && packet.y < canvas.height + 40);
  if (game.lives <= 0) {
    game.over = true;
    submitFinishedArcadeScore(game);
  }
  updateArcadeHud();
}

function drawArcadeGame() {
  const game = state.arcade;
  const canvas = els.arcadeCanvas;
  if (!game || !canvas) return;
  if (game.mode === "snake") {
    drawSnakeGame(game, canvas);
    return;
  }
  if (game.mode === "breaker") {
    drawBreakerGame(game, canvas);
    return;
  }
  if (game.mode === "dodge") {
    drawDodgeGame(game, canvas);
    return;
  }
  drawInvadersGame(game, canvas);
}

function drawInvadersGame(game, canvas) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050505");
  gradient.addColorStop(1, "#101010");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(247,247,242,.08)";
  for (let x = 0; x < canvas.width; x += 60) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - 90, canvas.height);
    context.stroke();
  }

  context.fillStyle = "#f7f7f2";
  context.beginPath();
  context.moveTo(game.playerX, 438);
  context.lineTo(game.playerX - 34, 476);
  context.lineTo(game.playerX + 34, 476);
  context.closePath();
  context.fill();

  game.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    context.fillStyle = "#42e06f";
    context.fillRect(enemy.x - 20, enemy.y - 12, 40, 24);
    context.fillStyle = "#050505";
    context.fillRect(enemy.x - 10, enemy.y - 3, 6, 6);
    context.fillRect(enemy.x + 4, enemy.y - 3, 6, 6);
  });

  context.fillStyle = "#f7f7f2";
  game.bullets.forEach((bullet) => {
    context.fillRect(bullet.x - 2, bullet.y - 12, 4, 18);
  });
  context.fillStyle = "#f1b8b8";
  game.enemyBullets.forEach((bullet) => {
    context.fillRect(bullet.x - 3, bullet.y - 4, 6, 14);
  });

  if (game.over) {
    context.fillStyle = "rgba(5,5,5,.68)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f7f7f2";
    context.font = "700 42px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(game.status, canvas.width / 2, canvas.height / 2);
  }
}

function drawSnakeGame(game, canvas) {
  const context = canvas.getContext("2d");
  drawArcadeBackground(context, canvas);
  const cell = 26;
  const offsetX = 60;
  const offsetY = 28;
  context.fillStyle = "#42e06f";
  game.snake.forEach((segment, index) => {
    context.globalAlpha = index ? .72 : 1;
    roundRect(context, offsetX + segment.x * cell, offsetY + segment.y * cell, cell - 4, cell - 4, 7);
    context.fill();
  });
  context.globalAlpha = 1;
  context.fillStyle = "#f7f7f2";
  roundRect(context, offsetX + game.food.x * cell, offsetY + game.food.y * cell, cell - 4, cell - 4, 8);
  context.fill();
  drawArcadeOverlayIfOver(context, canvas, game);
}

function drawBreakerGame(game, canvas) {
  const context = canvas.getContext("2d");
  drawArcadeBackground(context, canvas);
  game.bricks.forEach((brick) => {
    if (!brick.alive) return;
    context.fillStyle = "#42e06f";
    roundRect(context, brick.x - 32, brick.y - 11, 64, 22, 7);
    context.fill();
  });
  context.fillStyle = "#f7f7f2";
  roundRect(context, game.paddleX - 58, 446, 116, 14, 7);
  context.fill();
  context.beginPath();
  context.arc(game.ball.x, game.ball.y, 10, 0, Math.PI * 2);
  context.fill();
  drawArcadeOverlayIfOver(context, canvas, game);
}

function drawDodgeGame(game, canvas) {
  const context = canvas.getContext("2d");
  drawArcadeBackground(context, canvas);
  context.fillStyle = "#f7f7f2";
  context.beginPath();
  context.moveTo(game.playerX, 430);
  context.lineTo(game.playerX - 32, 474);
  context.lineTo(game.playerX + 32, 474);
  context.closePath();
  context.fill();
  game.packets.forEach((packet) => {
    context.fillStyle = "#42e06f";
    roundRect(context, packet.x - packet.size / 2, packet.y - packet.size / 2, packet.size, packet.size, 6);
    context.fill();
  });
  drawArcadeOverlayIfOver(context, canvas, game);
}

function drawArcadeBackground(context, canvas) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050505");
  gradient.addColorStop(1, "#101010");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(247,247,242,.08)";
  for (let x = 0; x < canvas.width; x += 60) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - 90, canvas.height);
    context.stroke();
  }
}

function drawArcadeOverlayIfOver(context, canvas, game) {
  if (!game.over) return;
  context.fillStyle = "rgba(5,5,5,.68)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7f7f2";
  context.font = "700 42px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(game.status, canvas.width / 2, canvas.height / 2);
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function fireArcadeShot() {
  const game = state.arcade;
  if (!game || game.over || els.arcadeView.hidden || game.fireCooldown > 0) return;
  if (game.mode !== "invaders") {
    if (game.mode === "breaker") game.ball.dy = -Math.abs(game.ball.dy);
    if (game.mode === "snake") rotateSnakeDirection();
    return;
  }
  game.bullets.push({ x: game.playerX, y: 432 });
  game.fireCooldown = 12;
}

function setArcadeDirection(direction) {
  const game = state.arcade;
  if (!game) return;
  if (game.mode === "snake") {
    if (direction < 0 && game.direction !== "right") game.nextDirection = "left";
    if (direction > 0 && game.direction !== "left") game.nextDirection = "right";
    return;
  }
  game.keys.left = direction < 0;
  game.keys.right = direction > 0;
}

function setArcadeVerticalDirection(direction) {
  const game = state.arcade;
  if (!game) return;
  if (game.mode !== "snake") {
    game.keys.up = direction < 0;
    game.keys.down = direction > 0;
    return;
  }
  if (direction < 0 && game.direction !== "down") game.nextDirection = "up";
  if (direction > 0 && game.direction !== "up") game.nextDirection = "down";
}

function rotateSnakeDirection() {
  const game = state.arcade;
  if (!game || game.mode !== "snake") return;
  const order = ["up", "right", "down", "left"];
  const next = order[(order.indexOf(game.nextDirection) + 1) % order.length];
  const opposites = { down: "up", left: "right", right: "left", up: "down" };
  if (opposites[next] !== game.direction) game.nextDirection = next;
}

function handleArcadeKeyDown(event) {
  if (!state.arcade || els.arcadeView.hidden) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    setArcadeDirection(-1);
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    setArcadeDirection(1);
  } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    event.preventDefault();
    setArcadeVerticalDirection(-1);
  } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    event.preventDefault();
    setArcadeVerticalDirection(1);
  } else if (event.code === "Space") {
    event.preventDefault();
    fireArcadeShot();
  }
}

function handleArcadeKeyUp(event) {
  if (!state.arcade) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    if (state.arcade.mode !== "snake") state.arcade.keys.left = false;
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    if (state.arcade.mode !== "snake") state.arcade.keys.right = false;
  } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    if (state.arcade.mode !== "snake") state.arcade.keys.up = false;
  } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    if (state.arcade.mode !== "snake") state.arcade.keys.down = false;
  }
}

function updateArcadeHud() {
  const game = state.arcade;
  if (!game) return;
  els.arcadeScore.textContent = String(game.score);
  els.arcadeLives.textContent = String(Math.max(0, game.lives));
  els.arcadeStatus.textContent = game.status;
}

function submitFinishedArcadeScore(game) {
  if (!game || game.submitted) return;
  game.submitted = true;
  submitArcadeScore(game.score);
}

function placeSnakeFood(canvas) {
  const game = state.arcade;
  if (!game) return;
  const cols = 30;
  const rows = 18;
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (game.snake.some((segment) => segment.x === food.x && segment.y === food.y));
  game.food = food;
}

async function loadArcadeLeaderboard() {
  if (!els.arcadeLeaderboard) return;
  els.arcadeLeaderboard.innerHTML = "<li>Loading scores...</li>";
  try {
    const response = await fetch("/api/arcade/leaderboard", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load scores.");
    renderArcadeLeaderboard(data.scores || []);
  } catch {
    els.arcadeLeaderboard.innerHTML = "<li>Leaderboard unavailable.</li>";
  }
}

async function submitArcadeScore(score) {
  if (!score) return;
  try {
    const response = await fetch("/api/arcade/leaderboard", {
      body: JSON.stringify({ score }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save score.");
    renderArcadeLeaderboard(data.scores || []);
    if (state.arcade) state.arcade.status = "Score saved to the global leaderboard.";
    updateArcadeHud();
  } catch {
    if (state.arcade) state.arcade.status = "Score could not be saved.";
    updateArcadeHud();
  }
}

function renderArcadeLeaderboard(scores) {
  if (!els.arcadeLeaderboard) return;
  els.arcadeLeaderboard.innerHTML = "";
  if (!scores.length) {
    const empty = document.createElement("li");
    empty.textContent = "No scores yet.";
    els.arcadeLeaderboard.append(empty);
    return;
  }

  scores.slice(0, 10).forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${Number(entry.rank) || ""}</span>
      <strong>@${escapeHtml(entry.username || "user")}</strong>
      <b>${formatNumber(entry.score || 0, 0)}</b>
    `;
    els.arcadeLeaderboard.append(item);
  });
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
  if (!state.user || (!state.user.admin && state.user.username !== "seb")) return;

  els.adminStatus.textContent = "Loading auth events...";
  loadSecureMessageAdmin();
  loadWorldWatchAdmin();
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

async function loadWorldWatchAdmin() {
  if (!state.user || (!state.user.admin && state.user.username !== "seb")) return;
  els.worldAdminStatus.textContent = "Loading World Watch requests...";
  try {
    const response = await fetch("/api/admin/world-news", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load World Watch requests.");
    renderWorldWatchAdmin(data);
    els.worldAdminStatus.textContent = `${data.grants.length} World Watch records shown.`;
  } catch (error) {
    els.worldAdminStatus.textContent = error.message || "Could not load World Watch requests.";
    els.worldAdminGrants.innerHTML = "";
  }
}

async function approveWorldWatchAccess(event) {
  event.preventDefault();
  const username = normalizeUsername(els.worldAdminUsername.value);
  if (!username) return;
  await approveWorldWatchAccessByUsername(username, true);
}

async function approveWorldWatchAccessByUsername(username, clearInput = false) {
  els.worldAdminStatus.textContent = `Approving @${username}...`;
  try {
    const response = await fetch("/api/admin/world-news", {
      body: JSON.stringify({ username }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not approve access.");
    if (clearInput) els.worldAdminUsername.value = "";
    els.worldAdminStatus.textContent = `Approved @${data.username || username}.`;
    loadWorldWatchAdmin();
  } catch (error) {
    els.worldAdminStatus.textContent = error.message || "Could not approve access.";
  }
}

async function denyWorldWatchAccess(username) {
  if (!username) return;
  els.worldAdminStatus.textContent = `Denying @${username}...`;
  try {
    const response = await fetch("/api/admin/world-news", {
      body: JSON.stringify({ username }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not deny access.");
    els.worldAdminStatus.textContent = `Denied @${data.username || username}.`;
    loadWorldWatchAdmin();
  } catch (error) {
    els.worldAdminStatus.textContent = error.message || "Could not deny access.";
  }
}

function renderWorldWatchAdmin(data) {
  els.worldAdminGrants.innerHTML = "";
  if (!data.grants.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "No World Watch registrations yet.";
    els.worldAdminGrants.append(empty);
    return;
  }

  data.grants.forEach((grant) => {
    const status = grant.status || (grant.active ? "approved" : "pending");
    const statusLabel = status === "approved" ? "Approved" : status === "denied" ? "Denied" : "Pending";
    const action = status === "approved"
      ? `<button class="ghost-button" type="button" data-world-deny="${escapeAttribute(grant.username)}">Deny</button>`
      : status === "pending"
        ? `<div class="admin-inline-actions"><button class="ghost-button" type="button" data-world-approve="${escapeAttribute(grant.username)}">Approve</button><button class="ghost-button" type="button" data-world-deny="${escapeAttribute(grant.username)}">Deny</button></div>`
        : `<button class="ghost-button" type="button" data-world-approve="${escapeAttribute(grant.username)}">Approve</button>`;
    const item = document.createElement("article");
    item.className = `secure-admin-card ${status}`;
    item.innerHTML = `
      <div>
        <strong>@${escapeHtml(grant.username)}</strong>
        <small>${statusLabel}</small>
      </div>
      <div>
        <small>${grant.grantedAt ? `Approved ${escapeHtml(formatDateTime(grant.grantedAt))}` : `Requested ${escapeHtml(formatDateTime(grant.requestedAt))}`}</small>
        <small>${grant.reviewedBy ? `Reviewed by @${escapeHtml(grant.reviewedBy)}` : "Awaiting review"}</small>
      </div>
      ${action}
    `;
    els.worldAdminGrants.append(item);
  });

  els.worldAdminGrants.querySelectorAll("[data-world-approve]").forEach((button) => {
    button.addEventListener("click", () => approveWorldWatchAccessByUsername(button.dataset.worldApprove));
  });
  els.worldAdminGrants.querySelectorAll("[data-world-deny]").forEach((button) => {
    button.addEventListener("click", () => denyWorldWatchAccess(button.dataset.worldDeny));
  });
}

async function loadSecureMessageAdmin() {
  if (!state.user || (!state.user.admin && state.user.username !== "seb")) return;
  els.secureAdminStatus.textContent = "Loading Secure Message access...";
  try {
    const response = await fetch("/api/admin/secure-messages", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load Secure Message access.");
    renderSecureMessageAdmin(data);
    els.secureAdminStatus.textContent = `${data.grants.length} access records / ${data.events.length} sends shown.`;
  } catch (error) {
    els.secureAdminStatus.textContent = error.message || "Could not load Secure Message access.";
    els.secureAdminGrants.innerHTML = "";
    els.secureAdminEvents.innerHTML = "";
  }
}

async function grantSecureMessageAccess(event) {
  event.preventDefault();
  const username = normalizeUsername(els.secureAdminUsername.value);
  if (!username) return;
  await grantSecureMessageAccessByUsername(username, true);
}

async function grantSecureMessageAccessByUsername(username, clearInput = false) {
  els.secureAdminStatus.textContent = `Granting @${username}...`;
  try {
    const response = await fetch("/api/admin/secure-messages", {
      body: JSON.stringify({ username }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not grant access.");
    if (clearInput) els.secureAdminUsername.value = "";
    els.secureAdminStatus.textContent = `Granted @${data.username || username}.`;
    loadSecureMessageAdmin();
  } catch (error) {
    els.secureAdminStatus.textContent = error.message || "Could not grant access.";
  }
}

async function revokeSecureMessageAccess(username) {
  if (!username) return;
  els.secureAdminStatus.textContent = `Revoking @${username}...`;
  try {
    const response = await fetch("/api/admin/secure-messages", {
      body: JSON.stringify({ username }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not revoke access.");
    els.secureAdminStatus.textContent = `Revoked @${data.username || username}.`;
    loadSecureMessageAdmin();
  } catch (error) {
    els.secureAdminStatus.textContent = error.message || "Could not revoke access.";
  }
}

function renderSecureMessageAdmin(data) {
  els.secureAdminGrants.innerHTML = "";
  els.secureAdminEvents.innerHTML = "";

  if (!data.grants.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "No Secure Message access requests yet.";
    els.secureAdminGrants.append(empty);
  } else {
    data.grants.forEach((grant) => {
      const item = document.createElement("article");
      const status = grant.status || (grant.active ? "approved" : "pending");
      item.className = `secure-admin-card ${status}`;
      const statusLabel = status === "approved" ? "Active" : status === "revoked" ? "Revoked" : "Pending";
      const action = grant.active
        ? `<button class="ghost-button" type="button" data-secure-revoke="${escapeAttribute(grant.username)}">Revoke</button>`
        : status === "pending"
          ? `<button class="ghost-button" type="button" data-secure-grant="${escapeAttribute(grant.username)}">Grant</button>`
          : "<span>Revoked</span>";
      item.innerHTML = `
        <div>
          <strong>@${escapeHtml(grant.username)}</strong>
          <small>${statusLabel} / sends ${Number(grant.sendCount) || 0}</small>
        </div>
        <div>
          <small>${grant.grantedAt ? `Granted ${escapeHtml(formatDateTime(grant.grantedAt))}` : `Requested ${escapeHtml(formatDateTime(grant.requestedAt))}`}</small>
          <small>Last send ${escapeHtml(grant.lastSentAt ? formatDateTime(grant.lastSentAt) : "--")}</small>
        </div>
        ${action}
      `;
      els.secureAdminGrants.append(item);
    });
  }

  els.secureAdminGrants.querySelectorAll("[data-secure-revoke]").forEach((button) => {
    button.addEventListener("click", () => revokeSecureMessageAccess(button.dataset.secureRevoke));
  });
  els.secureAdminGrants.querySelectorAll("[data-secure-grant]").forEach((button) => {
    button.addEventListener("click", () => grantSecureMessageAccessByUsername(button.dataset.secureGrant));
  });

  if (!data.events.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "No Secure Message sends logged yet.";
    els.secureAdminEvents.append(empty);
    return;
  }

  data.events.forEach((event) => {
    const item = document.createElement("article");
    item.className = "secure-admin-event";
    item.innerHTML = `
      <strong>@${escapeHtml(event.username)} sent a Secure Message</strong>
      <small>${escapeHtml(formatDateTime(event.createdAt))}</small>
      <span>${Number(event.messageBytes) || 0} plaintext bytes / ${Number(event.ciphertextBytes) || 0} encrypted bytes</span>
      <span>${escapeHtml(event.ipAddress || "--")}</span>
    `;
    els.secureAdminEvents.append(item);
  });
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
