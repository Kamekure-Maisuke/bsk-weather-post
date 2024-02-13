import AtprotoAPI from "npm:@atproto/api";
import "https://deno.land/std@0.215.0/dotenv/load.ts";
import { Weather } from "./weather.d.ts";

const { BskyAgent } = AtprotoAPI;
const agent = new BskyAgent({
  service: "https://bsky.social",
});

Deno.cron("auto weather post", "0 9 * * *", async () => {
  try {
    await agent.login({
      identifier: Deno.env.get("BLUESKY_IDENTIFIER") ?? "",
      password: Deno.env.get("BLUESKY_PASSWORD") ?? "",
    });
  } catch (e) {
    console.log(`接続エラー: ${e}`);
    Deno.exit(1);
  }

  const res = await fetch(
    "https://weather.tsukumijima.net/api/forecast/city/471010",
  );
  const json = await res.json() as Weather;
  const todayForecast = json.forecasts.find((forecast) =>
    forecast.dateLabel === "今日"
  );
  const msg = `[沖縄の気象情報]
天気: ${todayForecast?.detail.weather}
最高気温: ${todayForecast?.temperature.max.celsius}℃
降水確率(0~6時): ${todayForecast?.chanceOfRain.T00_06}
降水確率(6~12時): ${todayForecast?.chanceOfRain.T06_12}
降水確率(12~18時): ${todayForecast?.chanceOfRain.T12_18}
降水確率(18~24時): ${todayForecast?.chanceOfRain.T18_24}
`;

  const now = new Date().toISOString();
  await agent.post({
    text: msg,
    createdAt: now,
  });
  console.log(`投稿: ${now}`);
});
