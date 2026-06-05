import { describe, expect, it } from "vitest";
import { getConfiguredCs2CapPriceSources, getConfiguredMarketProviders, getConfiguredPricempirePriceSources } from "@/lib/cs2/marketSources";

describe("CS2 market source configuration", () => {
  it("includes extended aggregator marketplaces in default price source sweeps", () => {
    expect(getConfiguredCs2CapPriceSources()).toEqual(expect.arrayContaining([
      "buffmarket",
      "marketcsgo",
      "waxpeer",
      "whitemarket",
    ]));
    expect(getConfiguredPricempirePriceSources()).toEqual(expect.arrayContaining([
      "buffmarket",
      "marketcsgo",
      "waxpeer",
      "whitemarket",
    ]));
  });

  it("surfaces extended markets when an aggregator is configured", () => {
    const previous = process.env.CS2CAP_API_KEY;
    process.env.CS2CAP_API_KEY = "cs2cap-key";

    expect(getConfiguredMarketProviders()).toEqual(expect.arrayContaining([
      "buffmarket",
      "marketcsgo",
      "waxpeer",
      "whitemarket",
    ]));

    if (previous === undefined) {
      delete process.env.CS2CAP_API_KEY;
    } else {
      process.env.CS2CAP_API_KEY = previous;
    }
  });

  it("surfaces Market.CSGO when the direct API key is configured", () => {
    const previous = process.env.MARKET_CSGO_API_KEY;
    process.env.MARKET_CSGO_API_KEY = "marketcsgo-key";

    expect(getConfiguredMarketProviders()).toEqual(expect.arrayContaining([
      "marketcsgo",
    ]));

    if (previous === undefined) {
      delete process.env.MARKET_CSGO_API_KEY;
    } else {
      process.env.MARKET_CSGO_API_KEY = previous;
    }
  });

  it("surfaces CSMarketAPI when the aggregator API key is configured", () => {
    const previous = process.env.CSMARKETAPI_API_KEY;
    process.env.CSMARKETAPI_API_KEY = "csmarketapi-key";

    expect(getConfiguredMarketProviders()).toEqual(expect.arrayContaining([
      "csmarketapi",
    ]));

    if (previous === undefined) {
      delete process.env.CSMARKETAPI_API_KEY;
    } else {
      process.env.CSMARKETAPI_API_KEY = previous;
    }
  });

  it("surfaces WAXPEER when the direct API key is configured", () => {
    const previous = process.env.WAXPEER_API_KEY;
    process.env.WAXPEER_API_KEY = "waxpeer-key";

    expect(getConfiguredMarketProviders()).toEqual(expect.arrayContaining([
      "waxpeer",
    ]));

    if (previous === undefined) {
      delete process.env.WAXPEER_API_KEY;
    } else {
      process.env.WAXPEER_API_KEY = previous;
    }
  });
});
