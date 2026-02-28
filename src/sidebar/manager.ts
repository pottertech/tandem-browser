import * as fs from 'fs';
import * as path from 'path';
import { tandemDir, ensureDir } from '../utils/paths';
import type { SidebarConfig, SidebarItem, SidebarState } from './types';

const DEFAULT_CONFIG: SidebarConfig = {
  state: 'narrow',
  activeItemId: null,
  items: [
    { id: 'workspaces',  label: 'Workspaces',     icon: '', type: 'panel',   enabled: true, order: 0 },
    { id: 'messengers',  label: 'Messengers',      icon: '', type: 'webview', enabled: true, order: 1 },
    { id: 'news',        label: 'Personal News',   icon: '', type: 'panel',   enabled: true, order: 2 },
    { id: 'pinboards',   label: 'Pinboards',       icon: '', type: 'panel',   enabled: true, order: 3 },
    { id: 'bookmarks',   label: 'Bookmarks',       icon: '', type: 'panel',   enabled: true, order: 4 },
    { id: 'history',     label: 'History',         icon: '', type: 'panel',   enabled: true, order: 5 },
    { id: 'downloads',   label: 'Downloads',       icon: '', type: 'panel',   enabled: true, order: 6 },
  ]
};

export class SidebarManager {
  private storageFile: string;
  private config: SidebarConfig;

  constructor() {
    this.storageFile = path.join(tandemDir(), 'sidebar-config.json');
    this.config = this.load();
  }

  getConfig(): SidebarConfig { return this.config; }

  updateConfig(partial: Partial<SidebarConfig>): SidebarConfig {
    this.config = { ...this.config, ...partial };
    this.save();
    return this.config;
  }

  toggleItem(id: string): SidebarItem | undefined {
    const item = this.config.items.find(i => i.id === id);
    if (!item) return undefined;
    item.enabled = !item.enabled;
    this.save();
    return item;
  }

  reorderItems(orderedIds: string[]): void {
    orderedIds.forEach((id, idx) => {
      const item = this.config.items.find(i => i.id === id);
      if (item) item.order = idx;
    });
    this.config.items.sort((a, b) => a.order - b.order);
    this.save();
  }

  setState(state: SidebarState): void {
    this.config.state = state;
    this.save();
  }

  setActiveItem(id: string | null): void {
    this.config.activeItemId = id;
    this.save();
  }

  private load(): SidebarConfig {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        // Merge with defaults to handle new items added in future versions
        return { ...DEFAULT_CONFIG, ...raw };
      }
    } catch { /* use defaults */ }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    try {
      ensureDir(tandemDir());
      fs.writeFileSync(this.storageFile, JSON.stringify(this.config, null, 2));
    } catch { /* ignore */ }
  }

  destroy(): void { /* nothing to clean up */ }
}
