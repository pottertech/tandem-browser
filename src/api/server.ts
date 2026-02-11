import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { BrowserWindow, ipcMain } from 'electron';
import { copilotAlert } from '../main';

export class TandemAPI {
  private app: express.Application;
  private server: http.Server | null = null;
  private win: BrowserWindow;
  private port: number;

  constructor(win: BrowserWindow, port: number = 8765) {
    this.win = win;
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.setupRoutes();
  }

  private getWebview(): Promise<Electron.WebContents | null> {
    return this.win.webContents.executeJavaScript(`
      (() => {
        const wv = document.querySelector('webview');
        return wv ? wv.getWebContentsId() : null;
      })()
    `).then(id => {
      if (!id) return null;
      const { webContents } = require('electron');
      return webContents.fromId(id) || null;
    }).catch(() => null);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/status', async (_req: Request, res: Response) => {
      try {
        const status = await this.win.webContents.executeJavaScript(`
          (() => {
            const wv = document.querySelector('webview');
            if (!wv) return { ready: false };
            return {
              ready: true,
              url: wv.getURL(),
              title: wv.getTitle ? wv.getTitle() : '',
              loading: wv.isLoading ? wv.isLoading() : false
            };
          })()
        `);
        res.json(status);
      } catch (e: any) {
        res.json({ ready: false, error: e.message });
      }
    });

    // Navigate to URL
    this.app.post('/navigate', async (req: Request, res: Response) => {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'url required' });

      try {
        await this.win.webContents.executeJavaScript(`
          document.querySelector('webview').loadURL(${JSON.stringify(url)})
        `);
        res.json({ ok: true, url });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Get page content as text
    this.app.get('/page-content', async (_req: Request, res: Response) => {
      try {
        const content = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(\`
              (() => {
                // Extract readable content
                const title = document.title;
                const url = window.location.href;
                const meta = document.querySelector('meta[name="description"]');
                const description = meta ? meta.getAttribute('content') : '';
                
                // Get main text content, clean up
                const body = document.body.cloneNode(true);
                // Remove scripts, styles, nav, footer, ads
                body.querySelectorAll('script, style, nav, footer, aside, [role="banner"], [role="navigation"], .ad, .ads, .advertisement').forEach(el => el.remove());
                
                const text = body.innerText
                  .replace(/\\n{3,}/g, '\\n\\n')
                  .trim();
                
                return { title, url, description, text, length: text.length };
              })()
            \`).then(resolve);
          })
        `);
        res.json(content);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Get page HTML
    this.app.get('/page-html', async (_req: Request, res: Response) => {
      try {
        const html = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript('document.documentElement.outerHTML').then(resolve);
          })
        `);
        res.type('html').send(html);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Click an element
    this.app.post('/click', async (req: Request, res: Response) => {
      const { selector } = req.body;
      if (!selector) return res.status(400).json({ error: 'selector required' });

      try {
        const result = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(\`
              (() => {
                const el = document.querySelector(${JSON.stringify(selector)});
                if (!el) return { ok: false, error: 'Element not found' };
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.click();
                return { ok: true, tag: el.tagName, text: el.textContent?.substring(0, 100) };
              })()
            \`).then(resolve);
          })
        `);
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Type text into an element
    this.app.post('/type', async (req: Request, res: Response) => {
      const { selector, text, clear } = req.body;
      if (!selector || text === undefined) {
        return res.status(400).json({ error: 'selector and text required' });
      }

      try {
        const result = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(\`
              (() => {
                const el = document.querySelector(${JSON.stringify(selector)});
                if (!el) return { ok: false, error: 'Element not found' };
                el.focus();
                ${clear ? `el.value = '';` : ''}
                el.value = ${JSON.stringify(text)};
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return { ok: true };
              })()
            \`).then(resolve);
          })
        `);
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Execute arbitrary JavaScript
    this.app.post('/execute-js', async (req: Request, res: Response) => {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'code required' });

      try {
        const result = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(${JSON.stringify(code)}).then(resolve);
          })
        `);
        res.json({ ok: true, result });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Screenshot
    this.app.get('/screenshot', async (req: Request, res: Response) => {
      try {
        const image = await this.win.webContents.capturePage();
        const png = image.toPNG();
        
        if (req.query.save) {
          const fs = require('fs');
          const filePath = req.query.save as string;
          fs.writeFileSync(filePath, png);
          res.json({ ok: true, path: filePath, size: png.length });
        } else {
          res.type('png').send(png);
        }
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Cookies management
    this.app.get('/cookies', async (req: Request, res: Response) => {
      try {
        const url = req.query.url as string || '';
        const cookies = await this.win.webContents.session.cookies.get(
          url ? { url } : {}
        );
        res.json({ cookies });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Scroll
    this.app.post('/scroll', async (req: Request, res: Response) => {
      const { direction = 'down', amount = 500 } = req.body;
      try {
        await this.win.webContents.executeJavaScript(`
          document.querySelector('webview').executeJavaScript(
            'window.scrollBy(0, ${direction === 'up' ? -amount : amount})'
          )
        `);
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // Copilot alert — Kees asks Robin for help
    this.app.post('/copilot-alert', (req: Request, res: Response) => {
      const { title = 'Hulp nodig', body = '' } = req.body;
      copilotAlert(title, body);
      res.json({ ok: true, sent: true });
    });

    // Wait for page load
    this.app.post('/wait', async (req: Request, res: Response) => {
      const { selector, timeout = 10000 } = req.body;
      try {
        const result = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            const code = ${JSON.stringify(selector ? `
              new Promise((res, rej) => {
                const check = () => {
                  const el = document.querySelector('${selector}');
                  if (el) return res({ ok: true, found: true });
                  setTimeout(check, 200);
                };
                check();
                setTimeout(() => res({ ok: true, found: false, timeout: true }), ${timeout});
              })
            ` : `
              new Promise(res => {
                if (document.readyState === 'complete') return res({ ok: true, ready: true });
                window.addEventListener('load', () => res({ ok: true, ready: true }));
                setTimeout(() => res({ ok: true, ready: false, timeout: true }), ${timeout});
              })
            `)};
            wv.executeJavaScript(code).then(resolve);
          })
        `);
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // List all links on page
    this.app.get('/links', async (_req: Request, res: Response) => {
      try {
        const links = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(\`
              Array.from(document.querySelectorAll('a[href]')).map(a => ({
                text: a.textContent?.trim().substring(0, 100),
                href: a.href,
                visible: a.offsetParent !== null
              })).filter(l => l.href && !l.href.startsWith('javascript:'))
            \`).then(resolve);
          })
        `);
        res.json({ links });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // List all forms on page
    this.app.get('/forms', async (_req: Request, res: Response) => {
      try {
        const forms = await this.win.webContents.executeJavaScript(`
          new Promise((resolve) => {
            const wv = document.querySelector('webview');
            wv.executeJavaScript(\`
              Array.from(document.querySelectorAll('form')).map((form, i) => ({
                index: i,
                action: form.action,
                method: form.method,
                fields: Array.from(form.querySelectorAll('input, textarea, select')).map(f => ({
                  tag: f.tagName.toLowerCase(),
                  type: f.type || '',
                  name: f.name || '',
                  id: f.id || '',
                  placeholder: f.placeholder || '',
                  value: f.value || ''
                }))
              }))
            \`).then(resolve);
          })
        `);
        res.json({ forms });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '127.0.0.1', () => {
        resolve();
      });
    });
  }

  stop(): void {
    this.server?.close();
  }
}
