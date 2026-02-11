import { BrowserWindow, app, webContents } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * DrawOverlayManager — Manages the transparent annotation canvas overlay.
 * 
 * CRITICAL: The canvas overlay exists in the Electron SHELL layer,
 * NOT inside the webview. Websites cannot detect it.
 * 
 * Screenshots are composited: webview capture + canvas annotations → PNG.
 */
export class DrawOverlayManager {
  private win: BrowserWindow;
  private drawMode = false;
  private screenshotDir: string;
  private lastScreenshotPath: string | null = null;

  constructor(win: BrowserWindow) {
    this.win = win;
    this.screenshotDir = path.join(app.getPath('userData'), 'screenshots');
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /** Toggle draw mode on/off */
  toggleDrawMode(enabled?: boolean): boolean {
    this.drawMode = enabled !== undefined ? enabled : !this.drawMode;
    this.win.webContents.send('draw-mode', { enabled: this.drawMode });
    return this.drawMode;
  }

  /** Is draw mode active? */
  isDrawMode(): boolean {
    return this.drawMode;
  }

  /**
   * Capture annotated screenshot.
   * 1. Capture webview via webContents.capturePage()
   * 2. Get canvas annotation data from renderer
   * 3. Composite them together (done in renderer with offscreen canvas)
   * 4. Save to screenshots dir
   */
  async captureAnnotated(activeWebContentsId: number | null): Promise<{ ok: boolean; path?: string; error?: string }> {
    try {
      if (!activeWebContentsId) {
        return { ok: false, error: 'No active tab' };
      }

      const wc = webContents.fromId(activeWebContentsId);
      if (!wc) {
        return { ok: false, error: 'WebContents not found' };
      }

      // Step 1: Capture webview
      const nativeImage = await wc.capturePage();
      const webviewBase64 = nativeImage.toPNG().toString('base64');

      // Step 2: Ask renderer to composite (overlay canvas + webview screenshot)
      const compositeBase64: string = await this.win.webContents.executeJavaScript(`
        window.__tandemDraw.compositeScreenshot(${JSON.stringify(webviewBase64)})
      `);

      // Step 3: Save to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `tandem-${timestamp}.png`;
      const filePath = path.join(this.screenshotDir, filename);
      const buffer = Buffer.from(compositeBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      this.lastScreenshotPath = filePath;

      // Step 4: Clear annotations after snap
      this.win.webContents.send('draw-clear', {});

      // Step 5: Notify renderer of new screenshot
      this.win.webContents.send('screenshot-taken', { path: filePath, filename });

      return { ok: true, path: filePath };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  /** Get last annotated screenshot as PNG buffer */
  getLastScreenshot(): Buffer | null {
    if (!this.lastScreenshotPath || !fs.existsSync(this.lastScreenshotPath)) {
      return null;
    }
    return fs.readFileSync(this.lastScreenshotPath);
  }

  /** Get screenshot directory */
  getScreenshotDir(): string {
    return this.screenshotDir;
  }

  /** List recent screenshots */
  listScreenshots(limit: number = 10): string[] {
    if (!fs.existsSync(this.screenshotDir)) return [];
    const files = fs.readdirSync(this.screenshotDir)
      .filter(f => f.endsWith('.png'))
      .sort()
      .reverse()
      .slice(0, limit);
    return files.map(f => path.join(this.screenshotDir, f));
  }
}
