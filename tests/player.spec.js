const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:5173';

test.describe('Page layout', () => {
  test('loads with sidebar and heading', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.sidebar img')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Video demos');
  });

  test('shows three player host containers', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.lv-player-host')).toHaveCount(3);
  });
});

test.describe('Inline player — large', () => {
  test('shows thumbnail overlay before play', async ({ page }) => {
    await page.goto(BASE);
    const overlay = page.locator('#playerLarge .lv-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).not.toHaveClass(/lv-hidden/);
  });

  test('shows title on inline thumbnail', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerLarge .lv-title')).toHaveText('How Your Income Flows');
  });

  test('modal trigger shows title on thumbnail', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerModal .lv-title')).toHaveText('How Your Income Flows');
  });

  test('hover content is present in inline player', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerLarge .VideoHoverButton')).toHaveCount(1);
  });

  test('play button circle turns green on hover', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerLarge .lv-overlay').hover();

    // Wait for the computed background to become #9FE963 = rgb(159, 233, 99)
    await page.waitForFunction(() => {
      const el = document.querySelector('#playerLarge .lv-circle');
      return getComputedStyle(el).backgroundColor === 'rgb(159, 233, 99)';
    });
  });

  test('clicking thumbnail hides overlay and shows video + controls', async ({ page }) => {
    await page.goto(BASE);
    // Video needs to be able to play — stub the src so canplay fires quickly
    await page.route('**/video.mp4', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) }));
    await page.goto(BASE);

    await page.locator('#playerLarge .lv-overlay').click();
    await expect(page.locator('#playerLarge .lv-overlay')).toHaveClass(/lv-hidden/);
    await expect(page.locator('#playerLarge .lv-video')).not.toHaveClass(/lv-hidden/);
    await expect(page.locator('#playerLarge .lv-controls')).not.toHaveClass(/lv-hidden/);
  });

  test('controls are hidden before playback starts', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerLarge .lv-controls')).toHaveClass(/lv-hidden/);
  });
});

test.describe('Inline player — right column', () => {
  test('shows thumbnail before play', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerRight .lv-overlay')).toBeVisible();
  });

  test('clicking starts playback', async ({ page }) => {
    await page.route('**/video.mp4', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) }));
    await page.goto(BASE);
    await page.locator('#playerRight .lv-overlay').click();
    await expect(page.locator('#playerRight .lv-overlay')).toHaveClass(/lv-hidden/);
    await expect(page.locator('#playerRight .lv-video')).not.toHaveClass(/lv-hidden/);
  });
});

test.describe('Modal player', () => {
  test('shows modal trigger thumbnail', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#playerModal .lv-modal-trigger')).toBeVisible();
    await expect(page.locator('#playerModal .lv-modal-thumb')).toBeVisible();
  });

  test('no modal backdrop on load', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.lv-modal-backdrop')).toHaveCount(0);
  });

  test('clicking trigger opens modal', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-backdrop')).toBeVisible();
    await expect(page.locator('.lv-modal-box')).toBeVisible();
  });

  test('modal has no thumbnail — video plays immediately', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-box .lv-overlay')).toHaveCount(0);
    await expect(page.locator('.lv-modal-box .lv-video')).toBeVisible();
  });

  test('modal shows controls immediately', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-box [data-role=controls]')).not.toHaveClass(/lv-hidden/);
  });

  test('modal has no close button', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-close')).toHaveCount(0);
  });

  test('clicking backdrop dismisses modal', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-backdrop')).toBeVisible();
    const backdrop = page.locator('.lv-modal-backdrop');
    const box = await backdrop.boundingBox();
    await page.mouse.click(box.x + 5, box.y + 5);
    await expect(backdrop).toHaveCount(0);
  });

  test('Escape key dismisses modal', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-backdrop')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.lv-modal-backdrop')).toHaveCount(0);
  });

  test('hover content appears in modal, not on trigger thumbnail', async ({ page }) => {
    await page.goto(BASE);
    // Not visible on trigger
    await expect(page.locator('#playerModal .VideoHoverButton')).toHaveCount(0);
    // Visible inside modal after opening
    await page.locator('#playerModal .lv-modal-trigger').click();
    await expect(page.locator('.lv-modal-box .VideoHoverButton')).toHaveCount(1);
  });
});

test.describe('Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/video.mp4', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) }));
    await page.goto(BASE);
    await page.locator('#playerLarge .lv-overlay').click();
  });

  test('speed button shows ×1 initially', async ({ page }) => {
    await expect(page.locator('#playerLarge [data-role=speed]')).toHaveText('×1');
  });

  test('speed button cycles on click', async ({ page }) => {
    const btn = page.locator('#playerLarge [data-role=speed]');
    await btn.click();
    await expect(btn).toHaveText('×1.2');
    await btn.click();
    await expect(btn).toHaveText('×1.5');
    await btn.click();
    await expect(btn).toHaveText('×1');
  });

  test('mute button is visible', async ({ page }) => {
    await expect(page.locator('#playerLarge [data-role=mute]')).toBeVisible();
  });

  test('fullscreen button is visible', async ({ page }) => {
    await expect(page.locator('#playerLarge [data-role=fullscreen]')).toBeVisible();
  });

  test('elapsed and duration time displays are present', async ({ page }) => {
    await expect(page.locator('#playerLarge [data-role=elapsed]')).toBeVisible();
    await expect(page.locator('#playerLarge [data-role=duration]')).toBeVisible();
  });

  test('progress bar is present', async ({ page }) => {
    await expect(page.locator('#playerLarge [data-role=progress]')).toBeVisible();
  });
});

test.describe('Modal card content', () => {
  test('shows Video Modal heading', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.modal-card h2')).toHaveText('Video Modal');
  });

  test('shows description text', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.modal-card p')).toContainText('small thumbnail');
  });
});
