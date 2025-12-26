import { App, PluginSettingTab, Setting } from 'obsidian';
import { t } from './locales';
import TasksCalendarPlugin from '../main';
import { COLOR_PRESETS } from './utils';

export class TasksCalendarSettingTab extends PluginSettingTab {
	plugin: TasksCalendarPlugin;

	constructor(app: App, plugin: TasksCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const lang = this.plugin.settings.language;
		
		containerEl.createEl('h2', { text: t(lang, 'settingsTitle') });
		
		new Setting(containerEl)
			.setName(t(lang, 'tasksFolderPath'))
			.setDesc(t(lang, 'tasksFolderPathDesc'))
			.addText(text => text
				.setPlaceholder('Tasks')
				.setValue(this.plugin.settings.tasksFolderPath || '')
				.onChange(async (value) => {
					this.plugin.settings.tasksFolderPath = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(t(lang, 'tasksCreateFolderPath'))
			.setDesc(t(lang, 'tasksCreateFolderPathDesc'))
			.addText(text => text
				.setPlaceholder(t(lang, 'tasksCreateFolderPathPlaceholder') || 'Tasks')
				.setValue(this.plugin.settings.tasksCreateFolderPath || '')
				.onChange(async (value) => {
					this.plugin.settings.tasksCreateFolderPath = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(t(lang, 'filenameFormat'))
			.setDesc(t(lang, 'filenameFormatDesc'))
			.addText(text => text
				.setPlaceholder('YYYY')
				.setValue(this.plugin.settings.filenameFormat || 'YYYY-MM')
				.onChange(async (value) => {
					this.plugin.settings.filenameFormat = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(t(lang, 'autoOpenCalendar'))
			.setDesc(t(lang, 'autoOpenCalendarDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoOpenCalendar)
				.onChange(async (value) => {
					this.plugin.settings.autoOpenCalendar = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(t(lang, 'showCompletedTasks'))
			.setDesc(t(lang, 'showCompletedTasks'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCompletedTasks !== undefined ? this.plugin.settings.showCompletedTasks : true)
				.onChange(async (value) => {
					this.plugin.settings.showCompletedTasks = value;
					await this.plugin.saveSettings(true); // Refresh calendar when this changes
				}));

		new Setting(containerEl)
			.setName(t(lang, 'language'))
			.setDesc(t(lang, 'languageDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('en', 'English')
				.addOption('ru', 'Русский')
				.addOption('zh', '中文')
				.setValue(this.plugin.settings.language || 'en')
				.onChange(async (value: 'ru' | 'en' | 'zh') => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings(true); // Refresh calendar when language changes
					this.display(); // Refresh translations
				}));
				
		containerEl.createEl('h3', { text: t(lang, 'taskColors') });
		
		this.addColorSetting(containerEl, 'incompleteTaskColor', 'incompleteTaskColorDesc', 'incompleteTaskColor');
		this.addColorSetting(containerEl, 'completedTaskColor', 'completedTaskColorDesc', 'completedTaskColor');
		this.addColorSetting(containerEl, 'overdueTaskColor', 'overdueTaskColorDesc', 'overdueTaskColor');
	}

	private addColorSetting(
		containerEl: HTMLElement, 
		nameKey: string, 
		descKey: string, 
		settingKey: 'incompleteTaskColor' | 'completedTaskColor' | 'overdueTaskColor'
	) {
		const lang = this.plugin.settings.language;
		
		const setting = new Setting(containerEl)
			.setName(t(lang, nameKey))
			.setDesc(t(lang, descKey));
			
		// Color picker
		setting.addColorPicker(color => color
			.setValue(this.plugin.settings[settingKey] || '')
			.onChange(async (value) => {
				this.plugin.settings[settingKey] = value;
				await this.plugin.saveSettings(true); // Refresh calendar when colors change
			}));
			
		// Add reset button
		setting.addExtraButton(button => button
			.setIcon('reset')
			.setTooltip(t(lang, 'resetToDefault'))
			.onClick(async () => {
				this.plugin.settings[settingKey] = '';
				await this.plugin.saveSettings(true); // Refresh calendar when colors change
				this.display(); 
			}));
			
		// Add presets
		const presetsContainer = containerEl.createDiv('tasks-calendar-color-presets');
		presetsContainer.style.display = 'flex';
		presetsContainer.style.gap = '8px';
		presetsContainer.style.marginBottom = '18px';
		// Align with setting control (right side usually, but setting puts desc on left and control on right)
		// We'll put it below the description
		
		presetsContainer.createSpan({ text: t(lang, 'presets') + ': ', cls: 'tasks-calendar-presets-label' });
		
		COLOR_PRESETS.forEach(preset => {
			const presetBtn = presetsContainer.createEl('div', {
				cls: 'tasks-calendar-color-preset',
				attr: {
					'aria-label': preset.name,
					'title': preset.name
				}
			});
			presetBtn.style.backgroundColor = preset.value;
			presetBtn.style.width = '20px';
			presetBtn.style.height = '20px';
			presetBtn.style.borderRadius = '50%';
			presetBtn.style.cursor = 'pointer';
			presetBtn.style.border = '1px solid var(--background-modifier-border)';
			
			presetBtn.addEventListener('click', async () => {
				this.plugin.settings[settingKey] = preset.value;
				await this.plugin.saveSettings(true); // Refresh calendar when colors change
				this.display();
			});
		});
	}
}

