import { chromium } from 'playwright';
const BASE = process.env.BASE;
const b = await chromium.launch();
for (const vp of [{n:'1440x900',w:1440,h:900},{n:'390x844',w:390,h:844}]) {
  const ctx = await b.newContext({viewport:{width:vp.w,height:vp.h}});
  const p = await ctx.newPage();
  await p.goto(BASE,{waitUntil:'networkidle',timeout:60000});
  await p.waitForTimeout(1000);
  console.log(`\n=== ${vp.n} ===`);
  const btn = p.getByRole('button',{name:/Search/i}).first();
  console.log('  Search button disabled on load :', await btn.isDisabled());
  // fill the cascade
  const st = p.locator('select[aria-label="State"]');
  const opts = await st.locator('option').allTextContents();
  console.log('  states available               :', opts.length-1);
  if (opts.length>1) {
    await st.selectOption({index:1});
    await p.waitForTimeout(400);
    const city = p.locator('select[aria-label="City"]');
    const copts = await city.locator('option').allTextContents();
    console.log(`  after state="${opts[1]}" cities  :`, copts.length-1, copts.slice(1).join(', ')||'(none)');
    if (copts.length>1) {
      await city.selectOption({index:1});
      await p.waitForTimeout(400);
      console.log('  Search enabled after state+city:', !(await btn.isDisabled()), '(locality still empty)');
    }
  }
  await p.screenshot({path:`${process.env.SP}/cur-${vp.n}.png`});
  await ctx.close();
}
await b.close();
