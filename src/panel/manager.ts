import { BrowserWindow } from 'electron';

export interface ActivityEvent {
  id: number;
  type: 'navigate' | 'click' | 'scroll' | 'input' | 'tab-switch' | 'tab-open' | 'tab-close';
  timestamp: number;
  data: Record<string, unknown>;
}

export interface ChatMessage {
  id: number;
  from: 'robin' | 'kees';
  text: string;
  timestamp: number;
}

/**
 * PanelManager — Manages the Kees side panel.
 * 
 * Tracks activity events from Electron webview events (NOT injected into webview).
 * Stores chat messages and manages panel state.
 */
export class PanelManager {
  private win: BrowserWindow;
  private activityLog: ActivityEvent[] = [];
  private chatMessages: ChatMessage[] = [];
  private eventCounter = 0;
  private chatCounter = 0;
  private panelOpen = false;
  private maxEvents = 500;

  constructor(win: BrowserWindow) {
    this.win = win;
  }

  /** Log an activity event */
  logActivity(type: ActivityEvent['type'], data: Record<string, unknown> = {}): ActivityEvent {
    const event: ActivityEvent = {
      id: ++this.eventCounter,
      type,
      timestamp: Date.now(),
      data,
    };
    this.activityLog.push(event);
    if (this.activityLog.length > this.maxEvents) {
      this.activityLog = this.activityLog.slice(-this.maxEvents);
    }
    // Push to renderer for real-time display
    this.win.webContents.send('activity-event', event);
    return event;
  }

  /** Get activity log (optionally filtered by type, limited) */
  getActivityLog(limit: number = 50, type?: string): ActivityEvent[] {
    let events = this.activityLog;
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return events.slice(-limit);
  }

  /** Add a chat message */
  addChatMessage(from: 'robin' | 'kees', text: string): ChatMessage {
    const msg: ChatMessage = {
      id: ++this.chatCounter,
      from,
      text,
      timestamp: Date.now(),
    };
    this.chatMessages.push(msg);
    this.win.webContents.send('chat-message', msg);
    return msg;
  }

  /** Get chat history */
  getChatMessages(limit: number = 50): ChatMessage[] {
    return this.chatMessages.slice(-limit);
  }

  /** Toggle panel open/closed */
  togglePanel(open?: boolean): boolean {
    this.panelOpen = open !== undefined ? open : !this.panelOpen;
    this.win.webContents.send('panel-toggle', { open: this.panelOpen });
    return this.panelOpen;
  }

  /** Get panel state */
  isPanelOpen(): boolean {
    return this.panelOpen;
  }
}
