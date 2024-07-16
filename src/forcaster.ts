import {
  App,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
  EventRef,
} from "obsidian";
import FileOrganizer from "./index";

interface ForcasterSettings {
  logFolderPath: string;
}

const DEFAULT_SETTINGS: ForcasterSettings = {
  logFolderPath: "forcaster_logs",
};

export default class Forcaster {
  app: App;
  settings: ForcasterSettings;
  private eventLogger: EventLogger;
  private plugin: FileOrganizer;

  constructor(plugin: FileOrganizer) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  async onload() {
    console.log("Forcaster loaded");
    
    await this.loadSettings();

    // this.plugin.addSettingTab(new ForcasterSettingTab(this.app, this));

    this.eventLogger = new EventLogger(this);
    this.eventLogger.initialize();
  }

  async onunload() {
    this.eventLogger.unload();
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.plugin.loadData()
    );
  }

  async saveSettings() {
    await this.plugin.saveData(this.settings);
  }
}

class ForcasterSettingTab extends PluginSettingTab {
  plugin: Forcaster;

  constructor(app: App, plugin: Forcaster) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Log folder path")
      .setDesc("Folder path for storing event logs")
      .addText((text) =>
        text
          .setPlaceholder("Enter folder path")
          .setValue(this.plugin.settings.logFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.logFolderPath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

class EventLogger {
  private plugin: Forcaster;
  private eventRefs: EventRef[] = [];
  private logFile: string;

  constructor(plugin: Forcaster) {
    this.plugin = plugin;
    this.logFile = `${plugin.settings.logFolderPath}/obsidian_events.json`;
  }

  initialize() {
    this.registerAllEvents();
  }

  private registerAllEvents() {
    this.registerVaultEvents();
    this.registerWorkspaceEvents();
    this.registerMetadataCacheEvents();
    this.registerLayoutEvents();
  }

  private registerVaultEvents() {
    const vaultEvents = [
      "create",
      "delete",
      "rename",
      "modify",
      "closed",
      "raw",
    ];

    vaultEvents.forEach((event) => {
      this.eventRefs.push(
        this.plugin.app.vault.on(
          event,
          (file: TAbstractFile, ...args: any[]) => {
            this.logEvent("vault", event, { file: file?.path, args });
          }
        )
      );
    });
  }

  private registerWorkspaceEvents() {
    const workspaceEvents = [
      "quick-preview",
      "resize",
      "click",
      "active-leaf-change",
      "file-open",
      "layout-change",
      "css-change",
      "editor-change",
      "editor-menu",
      "file-menu",
      "codemirror",
      "quit",
      "before-quit",
    ];

    workspaceEvents.forEach((event) => {
      this.eventRefs.push(
        this.plugin.app.workspace.on(event, (...args: any[]) => {
          this.logEvent("workspace", event, { args });
        })
      );
    });
  }

  private registerMetadataCacheEvents() {
    const metadataCacheEvents = ["changed", "resolved"];

    metadataCacheEvents.forEach((event) => {
      this.eventRefs.push(
        this.plugin.app.metadataCache.on(event, (file: TFile) => {
          this.logEvent("metadataCache", event, { file: file?.path });
        })
      );
    });
  }

  private registerLayoutEvents() {
    this.eventRefs.push(
      this.plugin.app.workspace.on("layout-ready", () => {
        this.logEvent("layout", "layout-ready", {});
      })
    );
  }

  private async logEvent(category: string, eventName: string, data: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      eventName,
      data,
    };

    console.log(logEntry)
    // await this.appendToLogFile(JSON.stringify(logEntry) + "\n");
  }

  private limitJsonDepth(obj: any, depth: number): any {
    if (depth === 0) return undefined;
    if (typeof obj !== 'object' || obj === null) return obj;

    const result: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      result[key] = this.limitJsonDepth(obj[key], depth - 1);
    }
    return result;
  }

  private async appendToLogFile(content: string) {
    await this.plugin.app.vault.adapter.append(this.logFile, content);
  }

  unload() {
    this.eventRefs.forEach((ref) => this.plugin.app.vault.offref(ref));
  }
}