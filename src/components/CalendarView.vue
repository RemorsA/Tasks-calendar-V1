<template>
	<div class="tasks-calendar-container" ref="container">
		<!-- Header with navigation -->
		<div class="tasks-calendar-header">
			<div
				v-if="isLoading"
				class="tasks-calendar-skeleton-box tasks-calendar-skeleton-header--left"
			></div>

			<div
				v-else
				class="tasks-calendar-nav-group"
			>
				<button class="tasks-calendar-button tasks-calendar-nav-btn" @click="prevMonth">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024">
						<path fill="currentColor" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64"/>
						<path fill="currentColor" d="m237.248 512l265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312z"/>
					</svg>
				</button>

				<button 
					class="tasks-calendar-button tasks-calendar-month-year tasks-calendar-month-year-btn"
					:class="{ 'tasks-calendar-month-year-current': isCurrentMonth }"
					@click="goToToday"
				>
					{{ monthYearText }}
				</button>

				<button class="tasks-calendar-button tasks-calendar-nav-btn" @click="nextMonth">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024">
						<path fill="currentColor" d="M754.752 480H160a32 32 0 1 0 0 64h594.752L521.344 777.344a32 32 0 0 0 45.312 45.312l288-288a32 32 0 0 0 0-45.312l-288-288a32 32 0 1 0-45.312 45.312z"/>
					</svg>
				</button>
			</div>

			<div
				v-if="isLoading"
				class="tasks-calendar-skeleton-box tasks-calendar-skeleton-header--right"
			></div>

			<button
				v-else
				class="tasks-calendar-button tasks-calendar-create-task-btn"
				:title="translate('createTask')"
				@click="createTask"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024">
					<path fill="currentColor" d="m199.04 672.64l193.984 112l224-387.968l-193.92-112l-224 388.032zm-23.872 60.16l32.896 148.288l144.896-45.696zM455.04 229.248l193.92 112l56.704-98.112l-193.984-112zM104.32 708.8l384-665.024l304.768 175.936L409.152 884.8h.064l-248.448 78.336zm384 254.272v-64h448v64z"/>
				</svg>
			</button>
		</div>
		
		<!-- Calendar grid container -->
		<div 
			class="tasks-calendar-grid-container" 
			ref="gridContainer"
			@wheel="handleWheel"
		>
			<!-- Skeleton loader -->
			<div
				v-if="isLoading"
				class="tasks-calendar-skeleton-box tasks-calendar-skeleton-calendar"
			></div>
			<!-- Empty state -->
			<div v-else-if="tasks.length === 0" class="tasks-calendar-empty-message">
				<h3>{{ translate('noTasks') }}</h3>
				<p>{{ translate('onlyCalendarTasks') }}</p>
				<p>{{ translate('checkConsole') }}</p>
			</div>
			<!-- Calendar with tasks -->
			<template v-else>
				<!-- Day headers -->
				<div class="tasks-calendar-day-headers">
					<div 
						v-for="day in dayNames" 
						:key="day"
						class="tasks-calendar-day-header"
					>
						{{ day }}
					</div>
				</div>
				
				<!-- Calendar grid -->
				<div class="tasks-calendar-grid">
					<div
						v-for="(cell, index) in calendarCells"
						:key="index"
						class="tasks-calendar-cell"
						:class="{
							'tasks-calendar-cell-other-month': !cell.isCurrentMonth,
							'tasks-calendar-cell-today': cell.isToday
						}"
						@click="openTasksModal(cell.date)"
						@touchstart="handleCellTouchStart($event, cell.date)"
						@touchend="handleCellTouchEnd($event, cell.date)"
					>
						<div class="tasks-calendar-day-number">
							<span>{{ cell.dayNumber }}</span>
						</div>
						<div class="tasks-calendar-tasks">
							<div
								v-for="(task, taskIndex) in cell.tasks"
								:key="taskIndex"
								class="tasks-calendar-task"
								:class="{
									'tasks-calendar-task-completed': task.isCompleted,
									'tasks-calendar-task-overdue': task.isOverdue
								}"
								:style="getTaskStyle(task)"
								:title="task.text"
							>
								{{ getTaskDisplayText(task) }}
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { App, TFile, MarkdownView, moment } from 'obsidian';
import { t, getDayNames, getFullDayNames, getMonthNames, getMonthNamesGenitive } from '../locales';
import { Task, SwipeHandlers } from '../types';
import { getContrastYIQ } from '../utils';
import type TasksCalendarPlugin from '../../main';
// TasksForDateModal will be imported from main.ts

interface Props {
	app: App;
	plugin: TasksCalendarPlugin;
	onOpenModal?: (date: Date) => void;
}

const props = defineProps<Props>();

const container = ref<HTMLElement | null>(null);
const gridContainer = ref<HTMLElement | null>(null);

const tasks = ref<Task[]>([]);
const currentDate = ref<Date>(new Date());
const showCompletedTasks = ref<boolean>(true);
const isLoading = ref<boolean>(true);
const isFirstLoad = ref<boolean>(true);

const swipeHandlers: SwipeHandlers = {
	touchStart: null,
	touchMove: null,
	touchEnd: null,
	touchCancel: null,
	mouseDown: null,
	mouseMove: null,
	mouseUp: null,
	mouseLeave: null,
	gridContainer: null
};

let wheelHandler: ((e: WheelEvent) => void) | null = null;

const dayNames = computed(() => {
	const lang = props.plugin.settings.language || 'en';
	return getDayNames(lang);
});

const monthYearText = computed(() => {
	const lang = props.plugin.settings.language || 'en';
	const monthNames = getMonthNames(lang);
	const month = monthNames[currentDate.value.getMonth()];
	const year = currentDate.value.getFullYear();
	return `${month} ${year}`;
});

const isCurrentMonth = computed(() => {
	const today = new Date();
	return currentDate.value.getMonth() === today.getMonth() && 
		currentDate.value.getFullYear() === today.getFullYear();
});

const getLocalMonthNames = () => {
	const lang = props.plugin.settings.language || 'en';
	return getMonthNames(lang);
};

const translate = (key: string): string => {
	const lang = props.plugin.settings.language || 'en';
	return t(lang, key);
};

// Load tasks functions
const extractDateFromText = (text: string): Date | null => {
	const patterns = [
		/(?:📅|due::|due:|start::|start:|scheduled::|scheduled:)\s*(\d{4}-\d{2}-\d{2})/i,
		/(\d{4}-\d{2}-\d{2})/,
		/(\d{1,2}\/\d{1,2}\/\d{4})/,
		/(\d{1,2}\.\d{1,2}\.\d{4})/,
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
};

const loadTasksFromAPI = async (tasksApi: any) => {
	try {
		let allTasks: any[] = [];
		
		if (typeof tasksApi.getTasks === 'function') {
			allTasks = tasksApi.getTasks();
		} else if (typeof tasksApi.getAllTasks === 'function') {
			allTasks = tasksApi.getAllTasks();
		} else if (tasksApi.cache && Array.isArray(tasksApi.cache)) {
			allTasks = tasksApi.cache;
		} else {
			console.warn('[Task Calendar] Tasks API structure not recognized, falling back to manual parsing');
			return await loadTasksManually();
		}
		
		console.log(`[Task Calendar] Tasks API: found ${allTasks.length} tasks`);
		
		const folderPath = (props.plugin.settings.tasksFolderPath || '').trim();
		const normalizedFolderPath = folderPath ? folderPath.replace(/^\/+|\/+$/g, '') : '';
		
		const loadedTasks: Task[] = [];
		
		for (const task of allTasks) {
			const taskPath = task.path || task.file?.path || task.filePath || '';
			if (!taskPath) {
				continue;
			}
			
			const file = props.app.vault.getAbstractFileByPath(taskPath);
			if (!(file instanceof TFile)) {
				continue;
			}
			
			if (normalizedFolderPath) {
				const normalizedFilePath = file.path.replace(/^\/+|\/+$/g, '');
				if (!normalizedFilePath.startsWith(normalizedFolderPath)) {
					continue;
				}
			}
			
			let taskDate: Date | null = null;
			
			const dueDate = task.dueDate || task.due || task.dueDateString;
			const startDate = task.startDate || task.start || task.startDateString;
			const scheduledDate = task.scheduledDate || task.scheduled || task.scheduledDateString;
			
			if (dueDate) {
				taskDate = new Date(dueDate);
			} else if (startDate) {
				taskDate = new Date(startDate);
			} else if (scheduledDate) {
				taskDate = new Date(scheduledDate);
			}
			
			if (!taskDate || isNaN(taskDate.getTime())) {
				const taskText = task.description || task.originalMarkdown || task.text || task.content || '';
				taskDate = extractDateFromText(taskText);
			}
			
			if (!taskDate || isNaN(taskDate.getTime())) {
				const fileName = file.basename;
				const format = props.plugin.settings.filenameFormat || 'YYYY-MM';
				const parsedDate = moment(fileName, format, true);
				
				if (parsedDate.isValid()) {
					taskDate = parsedDate.toDate();
				} else if (/^\d{4}-\d{2}$/.test(fileName)) {
					const [year, month] = fileName.split('-').map(Number);
					taskDate = new Date(year, month - 1, 1);
				} else {
					taskDate = new Date();
					taskDate.setHours(0, 0, 0, 0);
				}
			}
			
			if (!taskDate || isNaN(taskDate.getTime())) {
				taskDate = new Date();
				taskDate.setHours(0, 0, 0, 0);
			}
			
			taskDate.setHours(0, 0, 0, 0);
			
			let taskText = task.description || task.originalMarkdown || task.text || task.content || '';
			
			const taskLineNumber = task.lineNumber || task.line || 0;
			try {
				const fileContent = await props.app.vault.read(file);
				const lines = fileContent.split('\n');
				
				if (taskLineNumber < lines.length) {
					const taskLine = lines[taskLineNumber];
					const taskMatch = taskLine.match(/^([\s\t]*)[-*]\s+\[([ xX✓✅])\]/);
					if (taskMatch) {
						const taskIndent = taskMatch[1];
						const taskIndentLength = taskIndent.length;
						
						const nestedLines: string[] = [];
						for (let j = taskLineNumber + 1; j < lines.length; j++) {
							const nextLine = lines[j];
							if (nextLine.trim() === '') {
								nestedLines.push(nextLine);
								continue;
							}
							
							const nextLineIndent = nextLine.match(/^[\s\t]*/)?.[0] || '';
							if (nextLineIndent.length > taskIndentLength) {
								nestedLines.push(nextLine);
							} else {
								break;
							}
						}
						
						if (nestedLines.length > 0) {
							const taskTextMatch = taskLine.match(/^[\s\t]*[-*]\s+\[([ xX✓✅])\]\s+(.+)$/);
							if (taskTextMatch) {
								taskText = taskTextMatch[2] + '\n' + nestedLines.join('\n');
							}
						}
					}
				}
			} catch (e) {
				console.warn('[Task Calendar] Failed to read file for nested lines:', e);
			}
			
			if (!taskText.includes('📅')) {
				continue;
			}
			
			const taskStatus = task.status || task.completion || '';
			const isCompleted = taskStatus !== ' ' && taskStatus !== '' && taskStatus !== 'todo';
			
			loadedTasks.push({
				text: taskText,
				date: taskDate,
				file: file,
				line: taskLineNumber,
				isCompleted: isCompleted
			});
		}
		
		console.log(`[Task Calendar] Loaded ${loadedTasks.length} tasks from API`);
		return loadedTasks;
	} catch (error) {
		console.error('[Task Calendar] Error loading tasks from API:', error);
		return await loadTasksManually();
	}
};

const loadTasksManually = async (): Promise<Task[]> => {
	const files = props.app.vault.getMarkdownFiles();
	
	const folderPath = (props.plugin.settings.tasksFolderPath || '').trim();
	const normalizedFolderPath = folderPath ? folderPath.replace(/^\/+|\/+$/g, '') : '';
	
	console.log(`[Task Calendar] Manual parsing: checking ${files.length} files, folder path: "${normalizedFolderPath || 'all files'}"`);
	
	let filesChecked = 0;
	let tasksFound = 0;
	const loadedTasks: Task[] = [];
	
	for (const file of files) {
		if (normalizedFolderPath) {
			const normalizedFilePath = file.path.replace(/^\/+|\/+$/g, '');
			if (!normalizedFilePath.startsWith(normalizedFolderPath)) {
				continue;
			}
		}

		filesChecked++;
		
		try {
			const content = await props.app.vault.read(file);
			const lines = content.split('\n');
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const taskMatch = line.match(/^([\s\t]*)[-*]\s+\[([ xX✓✅])\]\s+(.+)$/);
				if (taskMatch) {
					const taskIndent = taskMatch[1];
					const isCompleted = taskMatch[2] !== ' ' && taskMatch[2] !== '';
					const taskText = taskMatch[3];
					
					if (!taskText.includes('📅')) {
						continue;
					}
					
					const nestedLines: string[] = [];
					const taskIndentLength = taskIndent.length;
					
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j];
						if (nextLine.trim() === '') {
							nestedLines.push(nextLine);
							continue;
						}
						
						const nextLineIndent = nextLine.match(/^[\s\t]*/)?.[0] || '';
						if (nextLineIndent.length > taskIndentLength) {
							nestedLines.push(nextLine);
						} else {
							break;
						}
					}
					
					const fullTaskText = taskText + (nestedLines.length > 0 ? '\n' + nestedLines.join('\n') : '');
					
					let taskDate: Date | null = null;
					
					taskDate = extractDateFromText(fullTaskText);
					
					if (!taskDate) {
						const fileName = file.basename;
						const format = props.plugin.settings.filenameFormat || 'YYYY-MM';
						const parsedDate = moment(fileName, format, true);
						
						if (parsedDate.isValid()) {
							taskDate = parsedDate.toDate();
						} else if (/^\d{4}-\d{2}$/.test(fileName)) {
							const [year, month] = fileName.split('-').map(Number);
							taskDate = new Date(year, month - 1, 1);
						} else {
							taskDate = new Date();
							taskDate.setHours(0, 0, 0, 0);
						}
					}
					
					if (!taskDate || isNaN(taskDate.getTime())) {
						taskDate = new Date();
						taskDate.setHours(0, 0, 0, 0);
					}
					
					taskDate.setHours(0, 0, 0, 0);
					
					loadedTasks.push({
						text: fullTaskText,
						date: taskDate,
						file: file,
						line: i,
						isCompleted: isCompleted
					});
					
					tasksFound++;
				}
			}
		} catch (error) {
			console.error(`[Task Calendar] Error reading file ${file.path}:`, error);
		}
	}
	
	console.log(`[Task Calendar] Manual parsing: checked ${filesChecked} files, found ${tasksFound} tasks, total loaded: ${loadedTasks.length}`);
	return loadedTasks;
};

const loadTasks = async () => {
	// Show loading only on first load
	if (isFirstLoad.value) {
		isLoading.value = true;
	}
	
	const plugins = (props.app as any).plugins;
	const tasksPlugin = plugins?.plugins?.['obsidian-tasks-plugin'];
	
	let loadedTasks: Task[] = [];
	
	if (tasksPlugin?.apiV1) {
		console.log('[Task Calendar] Using Tasks plugin API to find all tasks');
		const apiTasks = await loadTasksFromAPI(tasksPlugin.apiV1);
		loadedTasks = apiTasks || [];
	} else {
		console.log('[Task Calendar] Tasks plugin API not available, using manual parsing');
		loadedTasks = await loadTasksManually();
	}
	
	// Filter tasks to show only those with calendar emoji 📅
	loadedTasks = loadedTasks.filter(task => {
		return task.text.includes('📅');
	});
	
	// Deduplicate tasks by file path and line number
	const taskMap = new Map<string, Task>();
	for (const task of loadedTasks) {
		const key = `${task.file.path}:${task.line}`;
		if (!taskMap.has(key)) {
			taskMap.set(key, task);
		}
	}
	
	tasks.value = Array.from(taskMap.values());
	console.log(`[Task Calendar] Final tasks count: ${tasks.value.length}`);
	
	// Hide loading after first load
	if (isFirstLoad.value) {
		isLoading.value = false;
		isFirstLoad.value = false;
	}
};

const calendarCells = computed(() => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();
	const firstDay = new Date(year, month, 1);
	const startDate = new Date(firstDay);
	const firstDayOfWeek = firstDay.getDay();
	const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
	startDate.setDate(startDate.getDate() - daysToSubtract);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const cells = [];
	for (let i = 0; i < 42; i++) {
		const cellDate = new Date(startDate);
		cellDate.setDate(startDate.getDate() + i);
		
		let dayTasks = getTasksForDate(cellDate);
		
		if (cellDate.getTime() === today.getTime()) {
			const overdueTasks = getOverdueTasks();
			dayTasks = [...overdueTasks, ...dayTasks];
		}
		
		if (!showCompletedTasks.value) {
			dayTasks = dayTasks.filter(task => !task.isCompleted);
		}
		
		const sortedDayTasks = [...dayTasks].sort((a, b) => {
			if (a.isCompleted === b.isCompleted) return 0;
			return a.isCompleted ? 1 : -1;
		});
		
		const tasksWithOverdue = sortedDayTasks.map(task => {
			const taskDate = new Date(task.date!);
			taskDate.setHours(0, 0, 0, 0);
			return {
				...task,
				isOverdue: !task.isCompleted && taskDate.getTime() < today.getTime()
			};
		});
		
		cells.push({
			date: cellDate,
			dayNumber: cellDate.getDate(),
			isCurrentMonth: cellDate.getMonth() === month,
			isToday: cellDate.getTime() === today.getTime(),
			tasks: tasksWithOverdue.slice(0, 4)
		});
	}
	
	return cells;
});

const getTasksForDate = (date: Date): Task[] => {
	const dateStr = date.toDateString();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const checkDate = new Date(date);
	checkDate.setHours(0, 0, 0, 0);
	const isPastDate = checkDate.getTime() < today.getTime();
	
	return tasks.value.filter(task => {
		if (!task.date) return false;
		if (task.date.toDateString() !== dateStr) return false;
		
		if (isPastDate && !task.isCompleted) {
			return false;
		}
		
		return true;
	});
};

const getOverdueTasks = (): Task[] => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	return tasks.value.filter(task => {
		if (!task.date) return false;
		if (task.date >= today) return false;
		return !task.isCompleted;
	});
};

const getTaskStyle = (task: any) => {
	const style: any = {};
	
	if (task.isCompleted) {
		if (props.plugin.settings.completedTaskColor) {
			style.backgroundColor = props.plugin.settings.completedTaskColor;
			style.color = getContrastYIQ(props.plugin.settings.completedTaskColor);
		}
	} else {
		if (props.plugin.settings.incompleteTaskColor) {
			style.backgroundColor = props.plugin.settings.incompleteTaskColor;
			style.color = getContrastYIQ(props.plugin.settings.incompleteTaskColor);
		}
	}
	
	if (task.isOverdue && props.plugin.settings.overdueTaskColor) {
		style['background-color'] = props.plugin.settings.overdueTaskColor;
		style['color'] = getContrastYIQ(props.plugin.settings.overdueTaskColor);
		style['border-color'] = 'rgba(0,0,0,0.2)';
		// Use CSS custom properties for important
		style['--bg-color'] = props.plugin.settings.overdueTaskColor;
		style['--text-color'] = getContrastYIQ(props.plugin.settings.overdueTaskColor);
	}
	
	return style;
};

const getTaskDisplayText = (task: Task): string => {
	const firstLine = task.text.split('\n')[0];
	
	let displayText = firstLine
		.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, '')
		.replace(/due::\s*\d{4}-\d{2}-\d{2}/gi, '')
		.replace(/\d{4}-\d{2}-\d{2}/g, '')
		.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
		.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/__([^_]+)__/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/~~([^~]+)~~/g, '$1')
		.replace(/^#+\s+/gm, '')
		.replace(/^[\s]*[-*+]\s+/gm, '')
		.replace(/\s*-\s*🔁.*$/g, '')
		.replace(/\s*🔁\s*every.*$/gi, '')
		.replace(/\s*-\s*[✅✓✓]\s*$/g, '')
		.replace(/\s*[✅✓✓]\s*$/g, '')
		.replace(/\s*-\s*[🔁✅✓✓].*$/, '')
		.replace(/\s+/g, ' ')
		.trim();
	
	if (!displayText) {
		displayText = translate('task');
	}
	
	return displayText.length > 30 
		? displayText.substring(0, 30) + '...' 
		: displayText;
};

const prevMonth = () => {
	const newDate = new Date(currentDate.value);
	newDate.setMonth(newDate.getMonth() - 1);
	currentDate.value = newDate;
};

const nextMonth = () => {
	const newDate = new Date(currentDate.value);
	newDate.setMonth(newDate.getMonth() + 1);
	currentDate.value = newDate;
};

const goToToday = () => {
	currentDate.value = new Date();
};

const createTask = async () => {
	await props.plugin.createTask();
	await loadTasks();
};


const openTasksModal = (date: Date) => {
	if (props.onOpenModal) {
		props.onOpenModal(date);
	}
};

const handleCellTouchStart = (e: TouchEvent, date: Date) => {
	// Store touch info for touchend
	(e.target as HTMLElement).setAttribute('data-touch-start', Date.now().toString());
	(e.target as HTMLElement).setAttribute('data-touch-x', e.touches[0]?.clientX.toString() || '0');
	(e.target as HTMLElement).setAttribute('data-touch-y', e.touches[0]?.clientY.toString() || '0');
};

const handleCellTouchEnd = (e: TouchEvent, date: Date) => {
	const target = e.target as HTMLElement;
	const touchStartTime = parseInt(target.getAttribute('data-touch-start') || '0');
	const touchStartX = parseFloat(target.getAttribute('data-touch-x') || '0');
	const touchStartY = parseFloat(target.getAttribute('data-touch-y') || '0');
	
	if (e.changedTouches.length > 0) {
		const touchEndTime = Date.now();
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const deltaX = Math.abs(touchEndX - touchStartX);
		const deltaY = Math.abs(touchEndY - touchStartY);
		const deltaTime = touchEndTime - touchStartTime;
		
		if (deltaTime < 300 && deltaX < 10 && deltaY < 10) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			openTasksModal(date);
		}
	}
	
	target.removeAttribute('data-touch-start');
	target.removeAttribute('data-touch-x');
	target.removeAttribute('data-touch-y');
};

let lastScrollTime = 0;
let accumulatedDelta = 0;
let resetTimeout: number | null = null;
const SCROLL_THRESHOLD = 100;
const MIN_SCROLL_INTERVAL = 300;

const handleWheel = (e: WheelEvent) => {
	const target = e.target as HTMLElement;
	if (target && !target.closest('.tasks-calendar-grid-container') && !target.closest('.tasks-calendar-grid')) {
		return;
	}
	
	e.preventDefault();
	e.stopPropagation();
	
	if (resetTimeout) {
		clearTimeout(resetTimeout);
		resetTimeout = null;
	}
	
	const now = Date.now();
	const timeSinceLastScroll = now - lastScrollTime;
	
	accumulatedDelta += e.deltaY;
	
	if (timeSinceLastScroll >= MIN_SCROLL_INTERVAL && Math.abs(accumulatedDelta) >= SCROLL_THRESHOLD) {
		const direction = accumulatedDelta > 0 ? 1 : -1;
		accumulatedDelta = 0;
		lastScrollTime = now;
		
		if (direction > 0) {
			nextMonth();
		} else {
			prevMonth();
		}
	}
	
	resetTimeout = window.setTimeout(() => {
		accumulatedDelta = 0;
	}, 300);
};

// Swipe handlers for month navigation
let swipeStartX = 0;
let swipeStartY = 0;
let swipeStartTime = 0;
let isSwiping = false;
let touchIdentifier: number | null = null;

const handleSwipeStart = (e: TouchEvent) => {
	if (e.touches.length === 1) {
		const touch = e.touches[0];
		const startX = touch.clientX;
		const screenWidth = window.innerWidth;
		const edgeThreshold = 50; // Threshold from screen edge for sidebar gestures
		
		// If touch starts from edge, don't handle it (let Obsidian handle sidebar)
		// But if it's in the middle of screen, we'll handle it and block sidebar
		if (startX >= edgeThreshold && startX <= screenWidth - edgeThreshold) {
			touchIdentifier = touch.identifier;
			swipeStartX = startX;
			swipeStartY = touch.clientY;
			swipeStartTime = Date.now();
			isSwiping = false;
			// Prevent sidebar from opening if touch is in the middle of screen
			// Use stopPropagation to prevent Obsidian from handling it
			e.stopPropagation();
		}
	}
};

const handleSwipeMove = (e: TouchEvent) => {
	if (touchIdentifier === null || !gridContainer.value) return;
	
	const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier);
	if (!touch) return;
	
	const deltaX = touch.clientX - swipeStartX;
	const absDeltaX = Math.abs(deltaX);
	const absDeltaY = Math.abs(touch.clientY - swipeStartY);
	
	// Only start swiping if horizontal movement is greater than vertical and significant
	// This prevents conflicts with cell clicks (which require < 10px movement)
	if (absDeltaX > 20 && absDeltaX > absDeltaY * 1.5) {
		isSwiping = true;
		gridContainer.value.style.transition = 'none';
		gridContainer.value.style.transform = `translateX(${deltaX}px)`;
		// Block sidebar gestures when swiping
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	} else if (isSwiping) {
		// Continue blocking if already swiping
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	}
};

const handleSwipeEnd = (e: TouchEvent) => {
	if (touchIdentifier === null || swipeStartX === 0) {
		swipeStartX = 0;
		swipeStartY = 0;
		isSwiping = false;
		touchIdentifier = null;
		return;
	}
	
	const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdentifier);
	if (!touch) {
		swipeStartX = 0;
		swipeStartY = 0;
		isSwiping = false;
		touchIdentifier = null;
		return;
	}
	
	if (!isSwiping || swipeStartX === 0) {
		swipeStartX = 0;
		swipeStartY = 0;
		isSwiping = false;
		touchIdentifier = null;
		return;
	}
	
	const swipeEndX = touch.clientX;
	const swipeEndY = touch.clientY;
	const deltaX = swipeEndX - swipeStartX;
	const absDeltaX = Math.abs(deltaX);
	const absDeltaY = Math.abs(swipeEndY - swipeStartY);
	const deltaTime = Date.now() - swipeStartTime;
	const velocity = absDeltaX / deltaTime;
	
	// Swipe threshold: at least 50px horizontal movement, velocity > 0.1, vertical movement < 100px
	// Only trigger if horizontal movement is significantly greater than vertical
	if ((absDeltaX > 50 || velocity > 0.1) && deltaTime < 600 && absDeltaY < 100 && absDeltaX > absDeltaY * 1.5) {
		// Block sidebar gestures
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		
		const direction = deltaX < 0 ? 1 : -1;
		const containerWidth = gridContainer.value?.clientWidth || window.innerWidth;
		
		if (gridContainer.value) {
			// Animate current view out
			gridContainer.value.style.transition = 'transform 0.1s ease-out';
			gridContainer.value.style.transform = `translateX(${direction === 1 ? -containerWidth : containerWidth}px)`;
			
			setTimeout(() => {
				// Change month
				if (direction > 0) {
					nextMonth();
				} else {
					prevMonth();
				}
				
				// Reset position and animate in
				if (gridContainer.value) {
					gridContainer.value.style.transition = 'none';
					gridContainer.value.style.transform = `translateX(${direction === 1 ? containerWidth : -containerWidth}px)`;
					
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							if (gridContainer.value) {
								gridContainer.value.style.transition = 'transform 0.1s ease-out';
								gridContainer.value.style.transform = 'translateX(0)';
							}
						});
					});
				}
			}, 100);
		} else {
			// Fallback without animation
			if (direction > 0) {
				nextMonth();
			} else {
				prevMonth();
			}
		}
	} else {
		// Reset position if swipe was not sufficient
		if (gridContainer.value) {
			gridContainer.value.style.transition = 'transform 0.1s ease-out';
			gridContainer.value.style.transform = 'translateX(0)';
		}
		// Still block sidebar if we were swiping
		if (isSwiping) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	
	swipeStartX = 0;
	swipeStartY = 0;
	isSwiping = false;
	touchIdentifier = null;
};

const handleTouchCancel = (e: TouchEvent) => {
	if (gridContainer.value && isSwiping) {
		gridContainer.value.style.transition = 'transform 0.1s ease-out';
		gridContainer.value.style.transform = 'translateX(0)';
		// Block sidebar on cancel if we were swiping
		e.preventDefault();
		e.stopPropagation();
	}
	swipeStartX = 0;
	swipeStartY = 0;
	isSwiping = false;
	touchIdentifier = null;
};

// Load tasks and setup on mount
onMounted(async () => {
	showCompletedTasks.value = props.plugin.settings.showCompletedTasks !== undefined 
		? props.plugin.settings.showCompletedTasks 
		: true;
	
	await loadTasks();
	
	// Setup swipe handlers for month navigation
	if (gridContainer.value) {
		// Use capture phase to intercept events before Obsidian's handlers
		gridContainer.value.addEventListener('touchstart', handleSwipeStart, { passive: false, capture: true });
		gridContainer.value.addEventListener('touchmove', handleSwipeMove, { passive: false, capture: true });
		gridContainer.value.addEventListener('touchend', handleSwipeEnd, { passive: false, capture: true });
		gridContainer.value.addEventListener('touchcancel', handleTouchCancel, { passive: false, capture: true });
	}
	
	// Also add listeners to container to catch all touches
	if (container.value) {
		container.value.addEventListener('touchstart', handleSwipeStart, { passive: false, capture: true });
		container.value.addEventListener('touchmove', handleSwipeMove, { passive: false, capture: true });
		container.value.addEventListener('touchend', handleSwipeEnd, { passive: false, capture: true });
		container.value.addEventListener('touchcancel', handleTouchCancel, { passive: false, capture: true });
	}
	
	// Listen for file changes
	props.app.vault.on('modify', async (file) => {
		if (file instanceof TFile && file.extension === 'md') {
			await loadTasks();
		}
	});
});

onUnmounted(() => {
	if (resetTimeout) {
		clearTimeout(resetTimeout);
	}
	
	// Clean up swipe handlers
	if (gridContainer.value) {
		gridContainer.value.removeEventListener('touchstart', handleSwipeStart, { capture: true } as any);
		gridContainer.value.removeEventListener('touchmove', handleSwipeMove, { capture: true } as any);
		gridContainer.value.removeEventListener('touchend', handleSwipeEnd, { capture: true } as any);
		gridContainer.value.removeEventListener('touchcancel', handleTouchCancel, { capture: true } as any);
	}
	
	if (container.value) {
		container.value.removeEventListener('touchstart', handleSwipeStart, { capture: true } as any);
		container.value.removeEventListener('touchmove', handleSwipeMove, { capture: true } as any);
		container.value.removeEventListener('touchend', handleSwipeEnd, { capture: true } as any);
		container.value.removeEventListener('touchcancel', handleTouchCancel, { capture: true } as any);
	}
});
</script>

