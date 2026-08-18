import { test, expect } from "@playwright/test";

/**
 * Layout integrity across the width range real visitors actually use.
 *
 * Horizontal overflow is the failure that matters most on phones: it makes the
 * page pan sideways and pushes primary actions off-screen. Checked against the
 * document element rather than a screenshot so the assertion is deterministic.
 */
const WIDTHS = [320, 375, 390, 414, 768, 820, 1024, 1280, 1440];
const SEARCH = "?q=&city=&listing=&minPrice=0&maxPrice=0&beds=0";

const PAGES = [
  ["home", "/"],
  ["search", `/properties${SEARCH}`],
  ["auth", "/auth?redirect="],
  ["help", "/help"],
] as const;

test.describe("responsive layout", () => {
  for (const width of WIDTHS) {
    for (const [name, path] of PAGES) {
      test(`${name} @ ${width}px has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(600);

        const m = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        // A couple of px of slack absorbs sub-pixel rounding.
        expect(m.scroll, `${m.scroll}px content in ${m.client}px viewport`).toBeLessThanOrEqual(
          m.client + 2,
        );
      });
    }
  }

  /**
   * Container-level overflow, which the document-level check above cannot see.
   *
   * This gap shipped a real bug: the rupee price in the property card's stat row
   * pushed its grid track wider than the third it was allotted, and the surplus
   * spilled out of the card on phones — while every test here stayed green.
   *
   * `documentElement.scrollWidth` only grows when overflow reaches the page. A
   * container absorbing or clipping its children's overflow leaves the document
   * width completely honest, so a page-level assertion reports a healthy layout
   * for visibly broken UI.
   *
   * WHICH ELEMENT IS MEASURED MATTERS, and the obvious choice is wrong. The first
   * version of this test compared each value's own scrollWidth to its
   * clientWidth. That cannot work: when a grid track expands to fit its content,
   * the cell and the text inside it grow with the track, so neither overflows
   * anything. Measured against the live page, the pre-fix layout at 360px gives:
   *
   *     value span scrollWidth - clientWidth ...  0   (insensitive)
   *     stat row  scrollWidth - clientWidth ... 23px  (detects it)
   *     document  scrollWidth - clientWidth ...  0   (the original blind spot)
   *
   * So the assertion belongs on the grid container: only it sees its tracks sum
   * past its own width. Verified to fail on the pre-fix layout before being
   * relied on here — an overflow test that cannot fail is worse than none, since
   * it reads as coverage.
   */
  /**
   * The CARD, not just the stat row inside it.
   *
   * The stat-row assertion below shipped a second overflow bug straight past it.
   * The card root was `flex-col sm:flex-row` with a fixed 280px image while every
   * consumer renders it in a multi-column grid, so from 640px up the card needed
   * 515px and had 350px. Because the root sets `overflow-hidden`, the excess was
   * clipped rather than spilled: titles, prices and buttons were cut mid-word on
   * the live desktop site. Measured at 1440px at the time:
   *
   *     stat row scrollWidth - clientWidth ...   0px  (the existing assertion)
   *     CARD     scrollWidth - clientWidth ... 165px  (the actual break)
   *     document scrollWidth - clientWidth ...   0px
   *
   * Two lessons, both encoded here. Overflow has to be asserted at the level that
   * owns the constraint, and `overflow-hidden` makes a broken layout LOOK
   * contained — it silences the page-level and parent-level signals while the
   * content is destroyed. And desktop widths need this as much as phones: this one
   * only appeared at and above 640px, which is why the mobile-only widths on the
   * stat-row test could never have found it.
   */
  for (const width of [375, 640, 768, 1024, 1280, 1440]) {
    test(`property card does not clip its own content @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });

      const rows = page.locator('[data-testid="stat-row"]');
      await rows.first().waitFor({ state: "visible", timeout: 15_000 });

      const clipped = await rows.evaluateAll((nodes) =>
        nodes
          .map((n) => {
            // Walk out to the card root: the nearest ancestor that hides overflow.
            let el = n.parentElement;
            while (el && getComputedStyle(el).overflowX !== "hidden") el = el.parentElement;
            if (!el) return null;
            return {
              overflowPx: el.scrollWidth - el.clientWidth,
              text: (n.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
            };
          })
          .filter((m): m is { overflowPx: number; text: string } => !!m && m.overflowPx > 1),
      );

      expect(clipped, `cards clipping their content: ${JSON.stringify(clipped)}`).toEqual([]);
    });
  }

  /**
   * Truncation, which BOTH assertions above are blind to.
   *
   * Three failure modes, three levels, and each level hides the other two:
   *
   *   - Track expansion. A value too wide with no `min-w-0` widens its grid track
   *     and the ROW overflows. Only the row shows it.
   *   - Clipped layout. A card wider than its grid column with `overflow-hidden`
   *     loses content silently. Only the CARD shows it.
   *   - Truncation. `truncate` sets overflow-hidden + nowrap + ellipsis on the
   *     value itself, so the row and the card both measure a tidy 0px while the
   *     price on screen reads "₹35,0...". Only the VALUE shows it.
   *
   * That last one shipped: the stat font was scaled up at `sm:` on the assumption
   * that a wider viewport means a wider card, when a grid actually adds columns and
   * leaves the card the same width. Both earlier assertions passed while the price
   * was being cut off on the live site.
   *
   * An element with `truncate` is the one place `scrollWidth > clientWidth` on the
   * element itself is exactly the right measure — which is also why the very first
   * version of this suite, dismissed as insensitive, was measuring a real thing
   * after all. It was just measuring the wrong failure mode for that bug.
   */
  for (const width of [375, 640, 768, 1024, 1280, 1440]) {
    test(`property card stat values are not truncated @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });

      const values = page.locator('[data-testid="stat-value"]');
      await values.first().waitFor({ state: "visible", timeout: 15_000 });

      const truncated = await values.evaluateAll((nodes) =>
        nodes
          .map((n) => ({
            text: (n.textContent ?? "").trim(),
            hiddenPx: n.scrollWidth - n.clientWidth,
          }))
          .filter((m) => m.hiddenPx > 1),
      );

      expect(truncated, `values cut off by truncate: ${JSON.stringify(truncated)}`).toEqual([]);
    });
  }

  /**
   * The card's LAYOUT INVARIANT, asserted directly rather than measured.
   *
   * A `layout` prop was added whose default put the card back to image-left /
   * details-right inside a multi-column grid. On the live site the three stat
   * labels painted on top of each other ("RENT/MDEPOSIT") and the button read
   * "Get Ow… Det…".
   *
   * The three assertions above did not catch it, and that is worth recording
   * honestly. Reproduced on the live page by forcing the row direction back, all
   * four measures still read zero:
   *
   *     stat row  0px   card  0px   stat value  0 truncated   cell  0px
   *
   * Overlap is not overflow. When text paints across a neighbour rather than past
   * its own box, scrollWidth never exceeds clientWidth, so no amount of measuring
   * finds it. Screenshot comparison would; a geometric assertion will not.
   *
   * So this asserts the property that must hold instead of the symptom: every
   * consumer renders this card inside a multi-column grid, therefore the card is
   * a column. Cheap, deterministic, and it fails the moment the variant returns.
   */
  for (const width of [640, 1024, 1440]) {
    test(`property card stacks vertically @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });

      const rows = page.locator('[data-testid="stat-row"]');
      await rows.first().waitFor({ state: "visible", timeout: 15_000 });

      const directions = await rows.evaluateAll((nodes) =>
        nodes.map((n) => {
          // The card root is the nearest ancestor that hides overflow.
          let el = n.parentElement;
          while (el && getComputedStyle(el).overflowX !== "hidden") el = el.parentElement;
          return el ? getComputedStyle(el).flexDirection : "none";
        }),
      );

      const sideways = directions.filter((d) => d.startsWith("row"));
      expect(
        sideways,
        `cards laid out horizontally inside a grid column: ${sideways.join(", ")}`,
      ).toEqual([]);
    });
  }

  for (const width of [320, 360, 375, 414]) {
    test(`property card stat row does not overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });

      const rows = page.locator('[data-testid="stat-row"]');
      await rows.first().waitFor({ state: "visible", timeout: 15_000 });

      const overflowing = await rows.evaluateAll((nodes) =>
        nodes
          .map((n) => ({
            overflowPx: n.scrollWidth - n.clientWidth,
            text: (n.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
          }))
          // 1px of slack for sub-pixel rounding; anything more is real overflow.
          .filter((m) => m.overflowPx > 1),
      );

      expect(overflowing, `stat rows wider than their box: ${JSON.stringify(overflowing)}`).toEqual(
        [],
      );
    });
  }

  /**
   * Cards on the PROPERTY DETAIL page, and a fourth failure mode: spill.
   *
   * Everything above visits /properties. The "Similar Rentals" grid on a detail
   * page sits in a narrower container, and a card that fits at 590px does not fit
   * at 73px — so a layout regression reached production while all 53 checks here
   * passed. Measured on the live page at 1440px when it broke:
   *
   *     /properties      stat row 590px wide, cells 193px, spill 0
   *     detail page      stat row  73px wide, cells  21px, spill 3
   *
   * SPILL is the signal, and it is distinct from everything already covered. The
   * row does not overflow, no ancestor clips, and `truncate` is not reached —
   * the text simply renders wider than the cell that owns it and lands on top of
   * its neighbour. That is how "RENT/MONTH" and "DEPOSIT" printed as
   * "RENT/MDEPOSIT". `scrollWidth` cannot see it; comparing each child's box
   * against its parent's can.
   */
  for (const width of [375, 768, 1024, 1440]) {
    test(`similar-property cards do not spill their stat cells @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="stat-row"]').first().waitFor({ timeout: 20_000 });

      // Enter a real detail page rather than hardcoding an id, so this keeps
      // working as inventory changes.
      await page.locator("a[href*='/properties/']").first().click();
      await page.waitForTimeout(2_500);

      const rows = page.locator('[data-testid="stat-row"]');
      await rows.first().waitFor({ state: "visible", timeout: 20_000 });

      const broken = await rows.evaluateAll((nodes) =>
        nodes
          .map((row) => {
            const cells = Array.from(row.children) as HTMLElement[];
            let spill = 0;
            for (const cell of cells) {
              const cb = cell.getBoundingClientRect();
              for (const child of Array.from(cell.children) as HTMLElement[]) {
                const tb = child.getBoundingClientRect();
                // 1px of slack for sub-pixel rounding.
                if (tb.right > cb.right + 1 || tb.left < cb.left - 1) spill++;
              }
            }
            return { rowWidth: Math.round(row.getBoundingClientRect().width), spill };
          })
          .filter((m) => m.spill > 0),
      );

      expect(broken, `stat text rendering outside its cell: ${JSON.stringify(broken)}`).toEqual([]);
    });
  }

  test("primary navigation stays reachable on the narrowest phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cta = page.getByRole("link", { name: /List Property FREE/i }).first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box, "CTA must have a hit area").not.toBeNull();
    // Comfortable touch target height.
    expect(box!.height).toBeGreaterThanOrEqual(32);
  });
});
