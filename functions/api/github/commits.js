import { json } from "../../_auth.js";

const CACHE_SECONDS = 60;
const DEFAULT_REPOSITORY = "linjedev/linjedev";
const DEFAULT_COMMIT_QUERY = `repo:${DEFAULT_REPOSITORY}`;
const MAX_SEARCH_PAGES = 10;
const FALLBACK_ACTIVITY = {
  "query": "repo:linjedev/linjedev",
  "totalCommits": 88,
  "hourBuckets": [
    {
      "commits": [
        {
          "date": "2026-05-31T23:45:17.000Z",
          "message": "tweak(linje): repair live captcha config",
          "sha": "abf1b302b67c0f108e92755c00fce5906c6558a4"
        },
        {
          "date": "2026-05-31T23:41:59.000Z",
          "message": "tweak(linje): fix captcha retry flow",
          "sha": "c1020dec6dae8a4d2129e00ed64598167f4ebae4"
        },
        {
          "date": "2026-05-31T23:37:08.000Z",
          "message": "tweak(linje): lock down secure messages",
          "sha": "8213b820c34cdcea96a036292a25654a2c96ccf5"
        },
        {
          "date": "2026-05-31T23:27:07.000Z",
          "message": "tweak(linje): bust secure message assets",
          "sha": "4e7eb343e39aaf5dd4d0fef2819f749050bbedb7"
        },
        {
          "date": "2026-05-31T23:24:19.000Z",
          "message": "tweak(linje): add secure messaging and harden auth",
          "sha": "617b8e8632f9ba800566c982e3712faefa0c8c4f"
        }
      ],
      "count": 5,
      "hour": 0
    },
    {
      "commits": [
        {
          "date": "2026-06-01T00:20:41.000Z",
          "message": "tweak(linje): fix world watch approvals and commits",
          "sha": "6434e08702e11d2265162facdb820f39d1557243"
        },
        {
          "date": "2026-06-01T00:11:54.000Z",
          "message": "tweak(linje): disable world watch unlock route",
          "sha": "01667dec0dac077193d7bd6b939ea9d3250907e4"
        },
        {
          "date": "2026-06-01T00:08:21.000Z",
          "message": "tweak(linje): require approval for world watch",
          "sha": "4f7a25a258849e15edfd7d3df9dfeb8e3f6775bb"
        },
        {
          "date": "2026-06-01T00:01:46.000Z",
          "message": "tweak(linje): add world watch tool",
          "sha": "5f879c9e6eba85e6e302314c7b56395be669646e"
        }
      ],
      "count": 4,
      "hour": 1
    },
    {
      "commits": [
        {
          "date": "2026-05-31T01:52:22.000Z",
          "message": "tweak(linje): replace travel-planner with speedtest-app",
          "sha": "bc72a10cdaa95121d8b1d6948dc6ab6ac9471071"
        }
      ],
      "count": 1,
      "hour": 2
    },
    {
      "commits": [
        {
          "date": "2026-05-31T02:58:50.000Z",
          "message": "tweak(linje): add Linje auth system (backend + frontend)",
          "sha": "cee51fe9682fe1743328853c723fccbf2a2ad3a8"
        },
        {
          "date": "2026-05-31T02:41:00.000Z",
          "message": "tweak(linje): add speedtest-app dist-pages static site",
          "sha": "44bc135b0371a01d5ee25a03e323281d7e9c895a"
        },
        {
          "date": "2026-05-31T02:12:26.000Z",
          "message": "tweak(linje): prepare Linje.dev Pages site",
          "sha": "810a63225b21d7b7de48dc1cf13f65b977453a6c"
        }
      ],
      "count": 3,
      "hour": 3
    },
    {
      "commits": [
        {
          "date": "2026-05-31T03:56:41.000Z",
          "message": "tweak(linje): verify auth glass deployment",
          "sha": "e94fa5297c66eb07cc2511806b31d9c759554396"
        },
        {
          "date": "2026-05-31T03:55:15.000Z",
          "message": "tweak(linje): lighten auth glass opacity",
          "sha": "2f04200a97ca044134df1966914f2944fecbf76e"
        },
        {
          "date": "2026-05-31T03:53:27.000Z",
          "message": "tweak(linje): fix mobile auth touch behavior",
          "sha": "c2e619ac26fd5f9be495ac6a3babce76b7b9d3e1"
        },
        {
          "date": "2026-05-31T03:50:25.000Z",
          "message": "tweak(linje): add liquid glass auth styling",
          "sha": "12fe8232a06af3564185d9e9b5f47078d3879a09"
        },
        {
          "date": "2026-05-31T03:47:01.000Z",
          "message": "tweak(linje): tune reactive auth background",
          "sha": "4e6ac903824c27d80d7fb0f3a576e323776afa55"
        },
        {
          "date": "2026-05-31T03:43:26.000Z",
          "message": "tweak(linje): trim Linje auth tagline",
          "sha": "adec4dd76c476e3b93a45f4b928683bc86427cc1"
        },
        {
          "date": "2026-05-31T03:42:39.000Z",
          "message": "tweak(linje): refine Linje auth tagline",
          "sha": "0114fe70399891a9df1e72ea5336c42b7c1b0f2a"
        },
        {
          "date": "2026-05-31T03:38:41.000Z",
          "message": "tweak(linje): add reactive auth background",
          "sha": "780a142fb35c63943d34b259860e78fc7f525123"
        },
        {
          "date": "2026-05-31T03:32:20.000Z",
          "message": "tweak(linje): improve admin IP audit details",
          "sha": "aa525cd2b735e8ff06142856bc04958634d071e2"
        },
        {
          "date": "2026-05-31T03:29:10.000Z",
          "message": "tweak(linje): hide admin nav for non-admin users",
          "sha": "95f38c11723d15b11e3d625cd0d7c79ca83099d4"
        },
        {
          "date": "2026-05-31T03:24:34.000Z",
          "message": "tweak(linje): add private Linje moderation view",
          "sha": "cb7868c26d5b88e717f662579830605b2100580d"
        },
        {
          "date": "2026-05-31T03:18:43.000Z",
          "message": "tweak(linje): moderate Linje usernames",
          "sha": "e21bb649f9ac8cff68d80f4f613cd27261087277"
        },
        {
          "date": "2026-05-31T03:13:17.000Z",
          "message": "tweak(linje): fix Cloudflare auth registration",
          "sha": "53b1139b0d2f955f95c4893b068ab19ac7d9c066"
        },
        {
          "date": "2026-05-31T03:09:04.000Z",
          "message": "tweak(linje): fix Linje auth asset caching",
          "sha": "7200e784cacc49f87afa6cb83140818552d71936"
        }
      ],
      "count": 14,
      "hour": 4
    },
    {
      "commits": [
        {
          "date": "2026-05-31T04:52:09.000Z",
          "message": "tweak(linje): remove bracketed local path",
          "sha": "c4466cf30792ca2a2b4b0f081804274e2fa03828"
        },
        {
          "date": "2026-05-31T04:49:42.000Z",
          "message": "tweak(linje): update local folder docs",
          "sha": "03a4f6ade7cba35f5eb467e337b2ecc45431ad6d"
        },
        {
          "date": "2026-05-31T04:34:52.000Z",
          "message": "tweak(linje): remove auth footer italic",
          "sha": "269800970eb86d809c11977db12329b8cdc4ec17"
        },
        {
          "date": "2026-05-31T04:33:35.000Z",
          "message": "tweak(linje): stack auth disclosure footer",
          "sha": "b629dc2324e5aba85601d47bb003ab30fdf61ee4"
        },
        {
          "date": "2026-05-31T04:26:40.000Z",
          "message": "tweak(linje): pin auth disclosure footer",
          "sha": "509da6ffaa4bec853671af43ee8c863fbf626b38"
        },
        {
          "date": "2026-05-31T04:22:59.000Z",
          "message": "tweak(linje): add auth visitor disclosure",
          "sha": "533d37a81523b0f548050e211fee1a3bc6e02419"
        },
        {
          "date": "2026-05-31T04:15:02.000Z",
          "message": "tweak(linje): add cursor magnet logo",
          "sha": "224f2b72d02734c01b8007b571a76ca313a7a6e5"
        },
        {
          "date": "2026-05-31T04:11:22.000Z",
          "message": "tweak(linje): add logo flick velocity",
          "sha": "b5a8eaa074ce4bda30817f1fca64a4ff616ebff0"
        },
        {
          "date": "2026-05-31T04:08:58.000Z",
          "message": "tweak(linje): refine logo bounce and favicon",
          "sha": "dfd0eedbf067e2c51fdc0af9ebf3963d029ffa66"
        },
        {
          "date": "2026-05-31T04:04:15.000Z",
          "message": "tweak(linje): stack auth copy above form",
          "sha": "6a6d48a01de6c0c653ec635d22b2a0d37b74c7b2"
        },
        {
          "date": "2026-05-31T04:01:31.000Z",
          "message": "tweak(linje): add bouncing auth logo",
          "sha": "98c5ffccc087a9b69f5b63d69ca50e3be30fcc22"
        }
      ],
      "count": 11,
      "hour": 5
    },
    {
      "commits": [
        {
          "date": "2026-05-31T05:54:49.000Z",
          "message": "tweak(linje): remove failing speed servers",
          "sha": "39d7640be44e79f320518c66a226b8a81bf2d493"
        },
        {
          "date": "2026-05-31T05:43:31.000Z",
          "message": "tweak(linje): add server ping checks",
          "sha": "31ab495294491d02791f7ad17fa5a25815fc25aa"
        },
        {
          "date": "2026-05-31T05:39:39.000Z",
          "message": "tweak(linje): unstick glass header",
          "sha": "60aef67b36eeeb0904fd1d2984ed848e66b81662"
        },
        {
          "date": "2026-05-31T05:38:22.000Z",
          "message": "tweak(linje): prevent header clipping",
          "sha": "c131067fc69ce1ec068e1aebf54246a2de972358"
        },
        {
          "date": "2026-05-31T05:36:52.000Z",
          "message": "tweak(linje): glass app pages",
          "sha": "f78e237b8236d5331da04a7784db51794b69583f"
        },
        {
          "date": "2026-05-31T05:31:45.000Z",
          "message": "tweak(linje): update commit tracker title",
          "sha": "b81dbe9b8d649c9619704628302b647c2ab4d002"
        },
        {
          "date": "2026-05-31T05:30:52.000Z",
          "message": "tweak(linje): whiten empty heatmap cells",
          "sha": "600c9ca019043d24cd76af40e95df98e33522bfb"
        },
        {
          "date": "2026-05-31T05:29:50.000Z",
          "message": "tweak(linje): show hourly commit heatmap",
          "sha": "a7a938dd27fbfce77fca982ec1c1c230ac70afa8"
        },
        {
          "date": "2026-05-31T05:25:34.000Z",
          "message": "tweak(linje): proxy github commit count",
          "sha": "d26cd6852084377e675ad0f6df61aa3383efa049"
        },
        {
          "date": "2026-05-31T05:21:37.000Z",
          "message": "tweak(linje): add github commit tracker",
          "sha": "55e46413741193dba51dd153025a40fe55b95c15"
        },
        {
          "date": "2026-05-31T05:18:23.000Z",
          "message": "tweak(linje): hide inactive pages",
          "sha": "914d5d96c66defd360b05d30510acce77b6aaf5d"
        },
        {
          "date": "2026-05-31T05:16:45.000Z",
          "message": "tweak(linje): space home hero copy",
          "sha": "d3828e7c5cca807798342cdb3c162fe7129fe28b"
        },
        {
          "date": "2026-05-31T05:16:03.000Z",
          "message": "tweak(linje): update home hero copy",
          "sha": "9d8978e812933093f6514849eff909480965e86b"
        },
        {
          "date": "2026-05-31T05:15:30.000Z",
          "message": "tweak(linje): remove home speed button",
          "sha": "236512b491fdd530898ecb79fcbd961d1280dff6"
        },
        {
          "date": "2026-05-31T05:14:02.000Z",
          "message": "tweak(linje): add logged-in home page",
          "sha": "f2bf632d88b24e3e23ac181dc933cc3ccaace4f6"
        },
        {
          "date": "2026-05-31T05:04:43.000Z",
          "message": "tweak(linje): compact mobile auth panel",
          "sha": "7b40f034486078b8c9e43ecb06faa15a9800258e"
        }
      ],
      "count": 16,
      "hour": 6
    },
    {
      "commits": [
        {
          "date": "2026-05-31T06:31:51.000Z",
          "message": "tweak(linje): extend interactive background",
          "sha": "d5bfbcd4f6eb90f52952d0b169a3eab4a17cc129"
        },
        {
          "date": "2026-05-31T06:28:15.000Z",
          "message": "tweak(linje): keep mobile header inline",
          "sha": "c46838164fb5a93c23530d081479a8509b577a63"
        },
        {
          "date": "2026-05-31T06:22:33.000Z",
          "message": "tweak(linje): expand free speed candidates",
          "sha": "5d4f86df9d183bf8afbb080972b5df4b7c00c811"
        },
        {
          "date": "2026-05-31T06:15:42.000Z",
          "message": "tweak(linje): flatten speed server labels",
          "sha": "c74b4932f3986a01e43c25035bc48cf3f192a826"
        },
        {
          "date": "2026-05-31T06:12:54.000Z",
          "message": "tweak(linje): fix commit counter fallback",
          "sha": "b8a850aeebad10365954176bf6672275bd987053"
        },
        {
          "date": "2026-05-31T06:08:36.000Z",
          "message": "tweak(linje): add free speed server pool",
          "sha": "b47ecca38bbf54833bd75cff816d214ed0cee8d0"
        }
      ],
      "count": 6,
      "hour": 7
    },
    {
      "commits": [],
      "count": 0,
      "hour": 8
    },
    {
      "commits": [],
      "count": 0,
      "hour": 9
    },
    {
      "commits": [],
      "count": 0,
      "hour": 10
    },
    {
      "commits": [],
      "count": 0,
      "hour": 11
    },
    {
      "commits": [],
      "count": 0,
      "hour": 12
    },
    {
      "commits": [],
      "count": 0,
      "hour": 13
    },
    {
      "commits": [],
      "count": 0,
      "hour": 14
    },
    {
      "commits": [],
      "count": 0,
      "hour": 15
    },
    {
      "commits": [],
      "count": 0,
      "hour": 16
    },
    {
      "commits": [],
      "count": 0,
      "hour": 17
    },
    {
      "commits": [
        {
          "date": "2026-05-31T17:57:52.000Z",
          "message": "tweak(linje): redesign profile workspace",
          "sha": "56800303010b0e37ebdda85fa19aea3374e48b76"
        },
        {
          "date": "2026-05-31T17:42:19.000Z",
          "message": "tweak(linje): vendor anime runtime",
          "sha": "33182eeb0bd79626c68605447a2c5da8f7cc94bf"
        },
        {
          "date": "2026-05-31T17:39:43.000Z",
          "message": "tweak(linje): add anime ui motion",
          "sha": "6b49766ec911abab146f75114e26d411256b1dbe"
        },
        {
          "date": "2026-05-31T17:22:16.000Z",
          "message": "tweak(linje): add account profile menu",
          "sha": "607a26d9cb239b2ed010ef51cb99f8933d688dee"
        }
      ],
      "count": 4,
      "hour": 18
    },
    {
      "commits": [
        {
          "date": "2026-05-31T18:39:36.000Z",
          "message": "tweak(linje): add custom auth captcha",
          "sha": "509b1d161456f15fb4f5b62ca63b06d5eda78a43"
        },
        {
          "date": "2026-05-31T18:26:02.000Z",
          "message": "tweak(linje): anchor header dropdowns",
          "sha": "cd36cf656945a16868a5d7ac52d231f50ad15231"
        },
        {
          "date": "2026-05-31T18:14:22.000Z",
          "message": "tweak(linje): load tools stylesheet",
          "sha": "3664ae20bb8dada66ca72a12dad198dc08fc63e8"
        },
        {
          "date": "2026-05-31T18:09:48.000Z",
          "message": "tweak(linje): add tools dropdown",
          "sha": "e89f82e9943e2da921bb7f96dfe923631d9883af"
        },
        {
          "date": "2026-05-31T18:00:47.000Z",
          "message": "tweak(linje): steady account dropdown",
          "sha": "783b584d29a1fbc14381e9c1a03a695478b86e7a"
        }
      ],
      "count": 5,
      "hour": 19
    },
    {
      "commits": [
        {
          "date": "2026-05-30T19:57:20.000Z",
          "message": "tweak(linje): add trip manifest, POI data and vehicle/POI UI",
          "sha": "3474918e65296849d879e2d98437e597dee317ce"
        },
        {
          "date": "2026-05-30T19:47:52.000Z",
          "message": "tweak(linje): cleanup UI elements, revamp header design and add dark mode",
          "sha": "3cc99e89bcc37ace499a8147a728db884e7b3cd3"
        },
        {
          "date": "2026-05-30T19:36:22.000Z",
          "message": "tweak(linje): first codex import and cleanup",
          "sha": "02a56270001ef3d28be8e3d765d8f79a89c39e9c"
        },
        {
          "date": "2026-05-30T19:19:02.000Z",
          "message": "tweak(linje): initial file upload",
          "sha": "5e3a7a787940524d8c6da77e7bf3e717851edf81"
        }
      ],
      "count": 4,
      "hour": 20
    },
    {
      "commits": [
        {
          "date": "2026-05-31T20:28:45.000Z",
          "message": "tweak(linje): expand game server checks",
          "sha": "e07e0ff6fa5d5bc0ac4449030a972a2753519935"
        },
        {
          "date": "2026-05-31T20:24:22.000Z",
          "message": "tweak(linje): refine server ping copy",
          "sha": "ad51ba27db7b06c1574225b5b2e6f64a2c148e9d"
        },
        {
          "date": "2026-05-31T20:14:24.000Z",
          "message": "tweak(linje): loosen captcha answers",
          "sha": "fb4e0c2b0941a767c25de4a9a465c3d387c52a81"
        },
        {
          "date": "2026-05-30T20:47:56.000Z",
          "message": "tweak(linje): add route suggestions & saved-trip visibility",
          "sha": "4398bdf1a4949cb0eede9d593076cfe103c39421"
        },
        {
          "date": "2026-05-30T20:34:09.000Z",
          "message": "tweak(linje): split draft waypoints and ideas; improve geocoding",
          "sha": "26ee647cc305a09f1f53544df72b55d553b33a9d"
        },
        {
          "date": "2026-05-30T20:26:13.000Z",
          "message": "tweak(linje): add mapping and preview for draft routes",
          "sha": "5aea8cb6a46bd41fbf64c3bcc960d8a9d33b591a"
        },
        {
          "date": "2026-05-30T20:17:05.000Z",
          "message": "tweak(linje): add draft trip UI and refactor planner labels",
          "sha": "3f6e07cd0ee4aa10fee75740ff1da4d1a813204d"
        },
        {
          "date": "2026-05-30T20:02:20.000Z",
          "message": "tweak(linje): add planner tabs and draft-route UI",
          "sha": "4a6512c553d77e2572eeb84220b769d57cacb6be"
        }
      ],
      "count": 8,
      "hour": 21
    },
    {
      "commits": [
        {
          "date": "2026-05-31T21:34:47.000Z",
          "message": "tweak(linje): add more hidden games",
          "sha": "c5be5da0ae43f64759762cdbf2e40d667cbda8d5"
        },
        {
          "date": "2026-05-31T21:16:50.000Z",
          "message": "tweak(linje): expand games surface",
          "sha": "28cdb1bad879e108f710735dc490a32fe94fc54a"
        },
        {
          "date": "2026-05-31T21:11:55.000Z",
          "message": "tweak(linje): add arcade leaderboard",
          "sha": "eff96c3b3587d734f23aa12bde5a4a69e161a530"
        },
        {
          "date": "2026-05-31T21:04:51.000Z",
          "message": "tweak(linje): add hidden invaders game",
          "sha": "135e384e4fe09f705767102d754cd49db020cd1e"
        },
        {
          "date": "2026-05-30T21:56:12.000Z",
          "message": "tweak(linje): dynamic Leaflet loading & demo auth route",
          "sha": "67b452ea7824b26a708dbfdc8fe5514284659386"
        },
        {
          "date": "2026-05-30T21:28:12.000Z",
          "message": "tweak(linje): add Next.js Travel Planner app",
          "sha": "922c759dd43f3955ac1c3fd247c1836e24c0320f"
        },
        {
          "date": "2026-05-30T21:00:03.000Z",
          "message": "tweak(linje): add fuel/EV POIs and improve trip state handling",
          "sha": "beb4c1ad6c694efc5b5ed101e848f5afea527ce8"
        }
      ],
      "count": 7,
      "hour": 22
    },
    {
      "commits": [],
      "count": 0,
      "hour": 23
    }
  ]
};

export async function onRequestGet({ env, request }) {
  const token = env.GITHUB_TOKEN;
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let activity;
  if (env.GITHUB_COMMIT_QUERY) {
    activity = await loadSearchActivity({ query: env.GITHUB_COMMIT_QUERY, token });
  } else {
    activity = await loadRepositoryActivity({ repository: env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY, token });
  }

  if (!activity) {
    return fallbackResponse("GitHub commit activity is temporarily unavailable. Showing deployment snapshot.");
  }

  const result = json({
    ...activity,
    cachedFor: CACHE_SECONDS
  }, {
    headers: {
      "cache-control": `public, max-age=${CACHE_SECONDS}`
    }
  });

  await cache.put(cacheKey, result.clone());
  return result;
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

function fallbackResponse(status) {
  return json({
    ...FALLBACK_ACTIVITY,
    cachedFor: CACHE_SECONDS,
    fallback: true,
    status
  }, {
    headers: {
      "cache-control": `public, max-age=${CACHE_SECONDS}`
    }
  });
}

async function loadSearchActivity({ query, token }) {
  const firstPage = await searchCommits({ page: 1, query, token });
  if (!firstPage.ok) return null;

  const firstData = await firstPage.json();
  const totalCommits = Number(firstData.total_count) || 0;
  const pages = Math.min(MAX_SEARCH_PAGES, Math.ceil(totalCommits / 100));
  const items = [...(firstData.items || [])];

  for (let page = 2; page <= pages; page += 1) {
    const response = await searchCommits({ page, query, token });
    if (!response.ok) break;
    const data = await response.json();
    items.push(...(data.items || []));
  }

  return {
    query,
    totalCommits,
    hourBuckets: buildHourBuckets(items)
  };
}

async function loadRepositoryActivity({ repository, token }) {
  const repo = String(repository || DEFAULT_REPOSITORY).trim();
  const totalResponse = await repoCommits({ page: 1, perPage: 1, repository: repo, token });
  if (!totalResponse.ok) return null;

  const totalCommits = getLastPageFromLink(totalResponse.headers.get("link")) || (await totalResponse.clone().json()).length;
  const pages = Math.min(MAX_SEARCH_PAGES, Math.ceil(totalCommits / 100));
  const items = [];

  for (let page = 1; page <= pages; page += 1) {
    const response = await repoCommits({ page, perPage: 100, repository: repo, token });
    if (!response.ok) break;
    const data = await response.json();
    items.push(...(data || []));
    if (!data.length) break;
  }

  return {
    query: `repo:${repo}`,
    totalCommits,
    hourBuckets: buildHourBuckets(items)
  };
}

function searchCommits({ page, query, token }) {
  return fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100&page=${page}`, {
    headers: githubHeaders(token, {
      accept: "application/vnd.github+json",
      "user-agent": "linje-dev"
    })
  });
}

function repoCommits({ page, perPage, repository, token }) {
  return fetch(`https://api.github.com/repos/${repository}/commits?per_page=${perPage}&page=${page}`, {
    headers: githubHeaders(token, {
      accept: "application/vnd.github+json",
      "user-agent": "linje-dev"
    })
  });
}

function githubHeaders(token, headers) {
  return token ? { ...headers, authorization: `Bearer ${token}` } : headers;
}

function getLastPageFromLink(link) {
  const match = String(link || "").match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? Number(match[1]) : 0;
}

function buildHourBuckets(items) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    commits: [],
    count: 0,
    hour
  }));

  items.forEach((item) => {
    const date = new Date(item.commit?.author?.date || item.commit?.committer?.date || "");
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    buckets[hour].count += 1;
    buckets[hour].commits.push({
      date: date.toISOString(),
      message: item.commit?.message?.split("\n")[0] || "Commit",
      sha: item.sha || ""
    });
  });

  return buckets;
}
