import { Editor, Notice, Plugin, TFile, WorkspaceLeaf, moment, ItemView, Modal, App } from 'obsidian';
import { createApp } from 'vue';
import { t, getFullDayNames, getMonthNames, getMonthNamesGenitive } from './src/locales';
import { TasksCalendarSettings, DEFAULT_SETTINGS } from './src/types';
import { TasksCalendarSettingTab } from './src/settings';
import CalendarView from './src/components/CalendarView.vue';
import TasksModal from './src/components/TasksModal.vue';

export default class TasksCalendarPlugin extends Plugin {
	settings: TasksCalendarSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new TasksCalendarSettingTab(this.app, this));

		// Register calendar view
		this.registerView(
			'task-calendar-view',
			(leaf) => new TasksCalendarView(leaf, this)
		);

		// Add command to open calendar
		this.addCommand({
			id: 'open-task-calendar',
			name: t(this.settings.language, 'openTaskCalendar'),
			callback: () => {
				this.openCalendarView();
			}
		});

		// Auto-open calendar on app startup if enabled
		if (this.settings.autoOpenCalendar) {
			this.app.workspace.onLayoutReady(() => {
				this.openCalendarView();
			});
		}

		// Add editor command
		this.addCommand({
			id: 'create-task-in-editor',
			name: t(this.settings.language, 'createTaskInEditor'),
			editorCallback: async (editor: Editor) => {
				await this.insertTask(editor);
			}
		});
	}

	onunload() {
	}

	async createTask(date?: Date) {
		await this.insertTask(undefined, date);
	}

	private async insertTask(_editor?: Editor, date?: Date) {
		// Access plugins using type assertion
		const plugins = (this.app as any).plugins;
		const tasksPlugin = plugins?.plugins?.['obsidian-tasks-plugin'];
		
		if (!tasksPlugin?.apiV1) {
			new Notice(t(this.settings.language, 'tasksPluginNotFound'));
			return;
		}

		const tasksApi = tasksPlugin.apiV1;
		
		// Prepare date string if provided
		let dateStr = '';
		if (date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			dateStr = `${year}-${month}-${day}`;
		}
		
		// Try different ways to pass date to the modal
		let taskLine: string | null = null;
		
		// Method 1: Try passing initial task line with date in due:: format
		if (dateStr) {
			try {
				const initialTask = `- [ ] due::${dateStr} `;
				if (tasksApi.createTaskLineModal.length > 0) {
					taskLine = await (tasksApi.createTaskLineModal as any)(initialTask);
				}
			} catch (e) {
				// Fall through to default method
			}
		}
		
		// Method 2: Try passing date as parameter object
		if (!taskLine && dateStr) {
			try {
				if (typeof (tasksApi.createTaskLineModal as any) === 'function') {
					const result = await (tasksApi.createTaskLineModal as any)({ 
						initialValue: `- [ ] due::${dateStr} `,
						dueDate: dateStr,
						date: dateStr
					});
					if (result) taskLine = result;
				}
			} catch (e) {
				// Fall through to default method
			}
		}
		
		// Method 3: Default - call without parameters
		if (!taskLine) {
			taskLine = await tasksApi.createTaskLineModal();
		}
		
		if (!taskLine) {
			// User cancelled the modal
			return;
		}

		// Add date to task if provided and not already present
		let finalTaskLine = taskLine;
		if (date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;
			
			// Check if task already has a date (due, start, scheduled, or calendar emoji)
			const hasDate = taskLine.match(/due::|due:|start::|start:|scheduled::|scheduled:|📅/i);
			if (!hasDate) {
				finalTaskLine = taskLine.trim() + ' due::' + dateStr;
			}
		}

		// Determine target file date
		let targetDate = date;
		const extractedDate = this.extractDateFromText(finalTaskLine);
		if (extractedDate) {
			targetDate = extractedDate;
		}
		
		if (!targetDate) {
			targetDate = new Date();
		}

		// Use file with name YYYY-MM.md based on target date
		const targetFile = await this.getOrCreateMonthlyNote(targetDate);

		if (!targetFile) {
			new Notice(t(this.settings.language, 'failedToCreateOrAccessNote'));
			return;
		}

		// Get current content
		const content = await this.app.vault.read(targetFile);
		
		// Add task at the end of the file
		const trimmedContent = content.trimEnd();
		const taskText = finalTaskLine.endsWith('\n') ? finalTaskLine.trimEnd() : finalTaskLine;
		const separator = trimmedContent.length > 0 ? '\n' : '';
		const newContent = trimmedContent + separator + taskText + '\n';

		// Write updated content
		await this.app.vault.modify(targetFile, newContent);

		new Notice(t(this.settings.language, 'taskAddedSuccessfully'));
	}

	private extractDateFromText(text: string): Date | null {
		// Try various date formats from Tasks plugin
		// Format: 📅 YYYY-MM-DD or due::YYYY-MM-DD or start::YYYY-MM-DD or scheduled::YYYY-MM-DD
		const patterns = [
			/(?:📅|due::|due:|start::|start:|scheduled::|scheduled:)\s*(\d{4}-\d{2}-\d{2})/i,
			/(\d{4}-\d{2}-\d{2})/, // Any YYYY-MM-DD format
			/(\d{1,2}\/\d{1,2}\/\d{4})/, // DD/MM/YYYY
			/(\d{1,2}\.\d{1,2}\.\d{4})/, // DD.MM.YYYY
		];
		
		for (const pattern of patterns) {
			const match = text.match(pattern);
			if (match) {
				const dateStr = match[1];
				const date = new Date(dateStr);
				if (!isNaN(date.getTime())) {
					date.setHours(0, 0, 0, 0);
					return date;
				}
			}
		}
		
		return null;
	}

	private getDateHeader(date: Date): string {
		return moment(date).format(this.settings.filenameFormat || 'YYYY-MM');
	}

	private async getOrCreateMonthlyNote(date: Date): Promise<TFile | null> {
		const dateHeader = this.getDateHeader(date);
		const fileName = `${dateHeader}.md`;
		
		// Use tasksCreateFolderPath if specified, otherwise fall back to tasksFolderPath
		const folderPathSetting = this.settings.tasksCreateFolderPath || this.settings.tasksFolderPath || '';
		
		// Build file path with folder if specified
		let filePath = fileName;
		if (folderPathSetting.trim()) {
			const folderPath = folderPathSetting.trim().replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
			filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
		}
		
		// Check if file already exists
		const existingFile = this.app.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			return existingFile;
		}

		// Create folder if it doesn't exist and path is specified
		if (folderPathSetting.trim()) {
			const folderPath = folderPathSetting.trim().replace(/^\/+|\/+$/g, '');
			if (folderPath) {
				const folder = this.app.vault.getAbstractFileByPath(folderPath);
				if (!folder) {
					try {
						await this.app.vault.createFolder(folderPath);
					} catch (error) {
						console.error('Error creating folder:', error);
						new Notice(t(this.settings.language, 'failedToCreateFolder'));
					}
				}
			}
		}

		// Create new file (empty, header will be added when first task is inserted)
		try {
			const newFile = await this.app.vault.create(filePath, '');
			return newFile;
		} catch (error) {
			console.error('Error creating monthly note:', error);
			new Notice(t(this.settings.language, 'failedToCreateNote'));
			return null;
		}
	}

	async loadSettings() {
		const loadedData = await this.loadData() as any;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		
		// Migrate old createTaskFolderPath and calendarFolderPath to tasksFolderPath if needed
		if (!this.settings.tasksFolderPath) {
			if (loadedData?.createTaskFolderPath) {
				this.settings.tasksFolderPath = loadedData.createTaskFolderPath;
			} else if (loadedData?.calendarFolderPath) {
				this.settings.tasksFolderPath = loadedData.calendarFolderPath;
			}
			// Clean up old fields
			delete (this.settings as any).createTaskFolderPath;
			delete (this.settings as any).calendarFolderPath;
			await this.saveSettings();
		} else if (loadedData?.createTaskFolderPath || loadedData?.calendarFolderPath) {
			// Clean up old fields even if tasksFolderPath is already set
			delete (this.settings as any).createTaskFolderPath;
			delete (this.settings as any).calendarFolderPath;
			await this.saveSettings();
		}
	}

	async saveSettings(shouldRefreshCalendar: boolean = false) {
		await this.saveData(this.settings);
		
		// Refresh calendar views only if explicitly requested
		// This prevents unnecessary updates when changing settings that don't affect display
		if (shouldRefreshCalendar) {
			this.refreshCalendarViews();
		}
		
		// Note: View registration should only happen in onload()
		// If calendar is enabled/disabled, user needs to reload the plugin
	}

	private refreshCalendarViews() {
		const leaves = this.app.workspace.getLeavesOfType('task-calendar-view');
		leaves.forEach(leaf => {
			const view = leaf.view;
			if (view instanceof TasksCalendarView) {
				// Re-render calendar to update settings
				view.render();
			}
		});
	}

	async openCalendarView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType('task-calendar-view');

		if (leaves.length > 0) {
			// If calendar is already open, just reveal it
			leaf = leaves[0];
		} else {
			// Create a new leaf (tab) for the calendar
			leaf = workspace.getLeaf(true); // true = split, creates new tab
			await leaf.setViewState({ type: 'task-calendar-view', active: true });
		}

		if (leaf) {
			workspace.setActiveLeaf(leaf);
		}
	}
}

// Calendar View class
class TasksCalendarView extends ItemView {
	plugin: TasksCalendarPlugin;
	private vueApp: any = null;

	constructor(leaf: WorkspaceLeaf, plugin: TasksCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return 'task-calendar-view';
	}

	getDisplayText(): string {
		return 'Tasks Calendar';
	}


	async onOpen() {
		await this.render();
	}

	async onClose() {
		if (this.vueApp) {
			this.vueApp.unmount();
			this.vueApp = null;
		}
	}

	async render() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		
		// Create Vue app
		const vueContainer = document.createElement('div');
		container.appendChild(vueContainer);
		
		this.vueApp = createApp(CalendarView, {
			app: this.app,
			plugin: this.plugin,
			onOpenModal: (date: Date) => {
				const lang = this.plugin.settings.language || 'en';
				const viewInterface: ViewInterface = {
					getLanguage: () => lang,
					getFullDayNames: () => getFullDayNames(lang),
					getMonthNames: () => getMonthNames(lang),
					getMonthNamesGenitive: () => getMonthNamesGenitive(lang),
					t: (key: string) => t(lang, key),
					plugin: this.plugin
				};
				new TasksForDateModal(this.app, viewInterface, date).open();
			}
		});
		
		this.vueApp.mount(vueContainer);
	}
}

// Tasks Modal class
interface ViewInterface {
	getLanguage: () => 'ru' | 'en' | 'zh';
	getFullDayNames: () => string[];
	getMonthNames: () => string[];
	getMonthNamesGenitive?: () => string[];
	t: (key: string) => string;
	plugin: TasksCalendarPlugin;
	loadTasks?: () => Promise<void>;
}

class TasksForDateModal extends Modal {
	view: ViewInterface;
	date: Date;
	private vueApp: any = null;

	constructor(app: App, view: ViewInterface, date: Date) {
		super(app);
		this.view = view;
		this.date = date;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// Create Vue app
		const container = document.createElement('div');
		contentEl.appendChild(container);
		
		// Recursive function to recreate Vue app when date changes
		const createVueApp = () => {
				if (this.vueApp) {
					this.vueApp.unmount();
				}
				this.vueApp = createApp(TasksModal, {
					app: this.app,
					view: this.view,
					date: this.date,
					onClose: () => {
						this.close();
					},
					onDateChange: (newDate: Date) => {
						this.date = newDate;
					// Recursively recreate the app with new date
					createVueApp();
							}
						});
						this.vueApp.mount(container);
		};
		
		createVueApp();
	}

	onClose() {
		if (this.vueApp) {
			this.vueApp.unmount();
			this.vueApp = null;
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}
