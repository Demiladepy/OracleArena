import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const outPath = join(publicDir, 'og-image.png');

function buildHeroHtml(): string {
  const logo = readFileSync(join(publicDir, 'logo.png')).toString('base64');
  const grid = readFileSync(join(publicDir, 'somnia/pixel-grid.png')).toString('base64');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px; height: 630px; overflow: hidden;
      background: #000; color: #fff;
      font-family: Inter, system-ui, sans-serif;
      position: relative;
    }
    .grid {
      position: absolute; inset: 0; opacity: 0.35;
      background: url('data:image/png;base64,${grid}') top left / 320px auto no-repeat;
    }
    .glow {
      position: absolute; right: -80px; top: 40px; width: 420px; height: 420px;
      border-radius: 50%; background: radial-gradient(circle, rgba(94,234,212,0.12) 0%, transparent 70%);
    }
    .wrap { position: relative; z-index: 1; padding: 56px 72px; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .logo { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .logo img { width: 56px; height: 56px; }
    .logo span { font-size: 22px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .label { font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #94a3b8; margin-bottom: 18px; }
    h1 { font-size: 58px; line-height: 1.05; font-weight: 700; max-width: 900px; letter-spacing: -0.02em; }
    p.sub { margin-top: 22px; font-size: 22px; line-height: 1.45; color: #94a3b8; max-width: 820px; }
    .pills { margin-top: 28px; display: flex; gap: 10px; }
    .pill {
      border: 1px solid rgba(255,255,255,0.14); padding: 8px 14px;
      font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #cbd5e1;
    }
    .footer {
      position: absolute; left: 72px; bottom: 44px;
      font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #64748b;
    }
    .footer strong { color: #5eead4; font-weight: 500; }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="wrap">
    <div class="logo">
      <img src="data:image/png;base64,${logo}" alt="" />
      <span>Oracle Arena</span>
    </div>
    <p class="label">Somnia testnet · Agentathon 2026</p>
    <h1>The resolution layer for the agentic economy</h1>
    <p class="sub">AI agents compete to resolve verifiable facts. Consensus on-chain. Settlement cross-chain.</p>
    <div class="pills">
      <span class="pill">Live demo · Bounty #4</span>
      <span class="pill">Chain 50312</span>
    </div>
  </div>
  <p class="footer"><strong>oraclearena.vercel.app</strong> · github.com/Demiladepy/OracleArena</p>
</body>
</html>`;
}

async function screenshotLiveHero(url: string): Promise<Buffer | null> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForSelector('h1', { timeout: 30_000 });
    await page.waitForTimeout(1500);
    return await page.screenshot({ type: 'png' });
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}

async function screenshotStaticHero(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(buildHeroHtml(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();
}

async function main() {
  const source = process.env.OG_SOURCE_URL ?? 'https://oraclearena.vercel.app';
  const live = await screenshotLiveHero(source);

  if (live) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(outPath, live);
    // eslint-disable-next-line no-console
    console.log(`Wrote ${outPath} from live hero (${source})`);
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(`Live screenshot failed — using static hero template`);
  await screenshotStaticHero();
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
