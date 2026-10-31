// After a deploy, tell IndexNow search engines (Bing, Yandex, Seznam, Naver...) which URLs exist,
// so changes are picked up in hours instead of weeks. Bing's index also feeds ChatGPT search and Copilot.
import fs from 'node:fs';

const site = JSON.parse(fs.readFileSync(new URL('../src/data/site.json', import.meta.url)));
const res = await fetch(`${site.url}/sitemap.xml`);
if (!res.ok) {
  console.log(`Skipping IndexNow: sitemap returned ${res.status}`);
  process.exit(0);
}
const urlList = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(site.url).host;
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: site.indexNowKey, keyLocation: `${site.url}/${site.indexNowKey}.txt`, urlList }),
});
console.log(`IndexNow: submitted ${urlList.length} URLs, response ${r.status}`);
