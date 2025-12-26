<template>
	<div class="tasks-for-date-modal" ref="modalContainer">
		<div class="tasks-for-date-modal-header">
			<h2 
				:class="{
					'tasks-for-date-modal-header-clickable': true,
					'tasks-for-date-modal-header-today': isToday
				}"
				@click="openMonthlyNoteFile"
				:title="translate('openFileForThisDate')"
			>
				{{ dateStr }}
			</h2>
			<button @click="close" class="close-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024">
					<path fill="currentColor" d="M764.288 214.592L512 466.88L259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512L214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"/>
				</svg>
			</button>
		</div>
		<div class="tasks-for-date-modal-content" ref="markdownContainer"></div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { App, MarkdownRenderer, TFile, Notice, moment } from 'obsidian';
import { t } from '../locales';
import { ModalSwipeHandlers } from '../types';
import type TasksCalendarPlugin from '../../main';

interface ViewInterface {
	getLanguage: () => 'ru' | 'en' | 'zh';
	getFullDayNames: () => string[];
	getMonthNames: () => string[];
	getMonthNamesGenitive?: () => string[];
	t: (key: string) => string;
	plugin: TasksCalendarPlugin;
	loadTasks?: () => Promise<void>;
}

interface Props {
	app: App;
	view: ViewInterface;
	date: Date;
	onClose?: () => void;
	onDateChange?: (date: Date) => void;
}

const props = defineProps<Props>();

const modalContainer = ref<HTMLElement | null>(null);
const markdownContainer = ref<HTMLElement | null>(null);

let linkClickHandler: ((e: MouseEvent) => void) | null = null;

const swipeHandlers: ModalSwipeHandlers = {
	start: null,
	move: null,
	end: null,
	cancel: null,
	container: null
};

const isToday = computed(() => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const modalDate = new Date(props.date);
	modalDate.setHours(0, 0, 0, 0);
	return modalDate.getTime() === today.getTime();
});

const translate = (key: string): string => {
	return props.view.t(key);
};

const dateStr = computed(() => {
	const lang = props.view.getLanguage();
	const fullDayNames = props.view.getFullDayNames();
	const monthNames = props.view.getMonthNamesGenitive ? props.view.getMonthNamesGenitive() : props.view.getMonthNames();
	
	const dayOfWeek = props.date.getDay();
	const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	const dayName = fullDayNames[dayIndex];
	const dayNumber = props.date.getDate();
	const monthName = monthNames[props.date.getMonth()];
	
	return `${dayName} / ${dayNumber} ${monthName}`;
});

const close = () => {
	if (props.onClose) {
		props.onClose();
	}
};

const loadTasks = async () => {
	if (!markdownContainer.value) return;
	
	markdownContainer.value.innerHTML = '';
	
	const folderPath = (props.view.plugin.settings.tasksFolderPath || '').trim().replace('/', '');
	const pathFilter = folderPath ? `path includes ${folderPath}` : '';
	
	const dateQuery = moment(props.date).format('YYYY-MM-DD');
	const query = `\`\`\`tasks
${pathFilter}
sort by due AND done
filter by function \\
	const today = task.due.moment?.isSame(moment("${dateQuery}"), 'day') || false; \\
	const overdue = task.due.moment?.isBefore(moment(), 'day') || false; \\
	const isDone = task.isDone; \\
	return overdue && !isDone || today && !isDone || today && isDone;
short
show tree
hide due date
hide recurrence rule
hide task count
hide done date
\`\`\``;

	const plugins = (props.app as any).plugins;
	const tasksPlugin = plugins?.plugins?.['obsidian-tasks-plugin'];
	let tasksRendered = false;
	
	if (tasksPlugin?.apiV1) {
		try {
			await MarkdownRenderer.renderMarkdown(
				query,
				markdownContainer.value,
				'',
				props.view.plugin
			);
			
			await new Promise(resolve => setTimeout(resolve, 10));
			
			const taskBlocks = markdownContainer.value.querySelectorAll('.tasks-list-container, .task-list-view, .task-list-item');
			if (taskBlocks.length > 0) {
				tasksRendered = true;
				
				if (tasksPlugin.apiV1 && typeof (tasksPlugin.apiV1 as any).renderTaskBlock === 'function') {
					for (const block of Array.from(taskBlocks)) {
						try {
							(tasksPlugin.apiV1 as any).renderTaskBlock(block as HTMLElement);
						} catch (e) {
							// Ignore errors
						}
					}
				}
			} else {
				const emptyMessage = document.createElement('div');
				emptyMessage.className = 'tasks-for-date-modal-empty';
				emptyMessage.textContent = translate('noTasksForDate');
				markdownContainer.value.appendChild(emptyMessage);
			}
		} catch (e) {
			console.warn('[Task Calendar] Failed to use Tasks query renderer:', e);
			tasksRendered = false;
		}
	}
	
	if (!tasksRendered && !tasksPlugin?.apiV1) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'tasks-for-date-modal-empty';
		emptyMessage.textContent = props.view.t('noTasksForDate');
		markdownContainer.value.appendChild(emptyMessage);
	}
	
	attachCheckboxHandlers(markdownContainer.value!);
};

const attachCheckboxHandlers = (container: HTMLElement) => {
	const topLevelListItems = container.querySelectorAll('ul > li, ol > li');
	let taskIndex = 0;
	
	topLevelListItems.forEach((listItem) => {
		const parentList = listItem.closest('ul, ol');
		if (!parentList) return;
		
		const allCheckboxes = Array.from(listItem.querySelectorAll('input[type="checkbox"]'));
		let taskCheckbox: HTMLInputElement | null = null;
		
		for (const checkbox of allCheckboxes) {
			const checkboxEl = checkbox as HTMLInputElement;
			const checkboxParentList = checkboxEl.closest('ul, ol');
			const nestedListsInItem = listItem.querySelectorAll('ul, ol');
			let isInNestedList = false;
			
			for (const nestedList of Array.from(nestedListsInItem)) {
				if (nestedList.contains(checkboxEl) && nestedList !== parentList) {
					isInNestedList = true;
					break;
				}
			}
			
			if (!isInNestedList && checkboxParentList === parentList) {
				taskCheckbox = checkboxEl;
				break;
			}
		}
		
		if (taskCheckbox) {
			const initialChecked = taskCheckbox.checked;
			const checkbox = taskCheckbox;
			
			checkbox.addEventListener('change', async (e) => {
				e.stopPropagation();
				e.preventDefault();
				
				const wasChecked = checkbox.checked;
				checkbox.checked = initialChecked;
				
				const taskElement = checkbox.closest('.task-list-item, .task-list-view-item');
				if (!taskElement) {
					checkbox.checked = !wasChecked;
					return;
				}
				
				const plugins = (props.app as any).plugins;
				const tasksPlugin = plugins?.plugins?.['obsidian-tasks-plugin'];
				
				if (tasksPlugin?.apiV1) {
					try {
					setTimeout(async () => {
						if (props.view.loadTasks) {
							await props.view.loadTasks();
						}
						await loadTasks();
					}, 100);
					} catch (error) {
						console.error('[Task Calendar] Error toggling task:', error);
						checkbox.checked = !wasChecked;
					}
				} else {
					checkbox.checked = !wasChecked;
				}
			});
			
			taskIndex++;
		}
	});
};

const attachLinkHandlers = (container: HTMLElement) => {
	// Remove existing handler if any
	if (linkClickHandler && markdownContainer.value) {
		markdownContainer.value.removeEventListener('click', linkClickHandler, true);
	}
	
	// Create new handler
	linkClickHandler = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		
		// Don't close if clicking on checkbox or button
		if (target.closest('input[type="checkbox"]') || target.closest('button')) {
			return;
		}
		
		const link = target.closest('a');
		
		if (link) {
			// Check if it's an internal link or a link to a file
			const href = link.getAttribute('href') || '';
			const isInternalLink = link.classList.contains('internal-link') || 
				href.startsWith('#') || 
				href.includes('.md') ||
				link.hasAttribute('data-href');
			
			if (isInternalLink) {
				// Close modal when clicking on a link
				// Use a small delay to allow the link to navigate first
				setTimeout(() => {
					close();
				}, 150);
			}
		}
	};
	
	// Add handler using capture phase to catch events early
	container.addEventListener('click', linkClickHandler, true);
};

const addSwipeHandlers = (container: HTMLElement) => {
	if (swipeHandlers.container) {
		if (swipeHandlers.start) {
			swipeHandlers.container.removeEventListener('touchstart', swipeHandlers.start, { capture: true } as any);
		}
		if (swipeHandlers.move) {
			swipeHandlers.container.removeEventListener('touchmove', swipeHandlers.move, { capture: true } as any);
		}
		if (swipeHandlers.end) {
			swipeHandlers.container.removeEventListener('touchend', swipeHandlers.end, { capture: true } as any);
		}
		if (swipeHandlers.cancel) {
			swipeHandlers.container.removeEventListener('touchcancel', swipeHandlers.cancel, { capture: true } as any);
		}
	}
	
	let swipeStartX = 0;
	let swipeStartY = 0;
	let swipeStartTime = 0;
	let isSwiping = false;
	let touchIdentifier: number | null = null;
	
	const handleSwipeStart = (e: TouchEvent) => {
		if (e.touches.length === 1) {
		const target = e.target as HTMLElement;
		const touch = e.touches[0];
			const startX = touch.clientX;
			const screenWidth = window.innerWidth;
			const edgeThreshold = 50; // Threshold from screen edge for sidebar gestures
		
			// Ignore touches on interactive elements
		if (target && (
			target.closest('input[type="checkbox"]') ||
			target.closest('button') ||
			target.closest('a') ||
			target.closest('.task-extras') ||
				target.closest('.modal-close-button') ||
				target.closest('.close-button')
		)) {
			return;
		}
		
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
		const target = e.target as HTMLElement;
		if (target && (
			target.closest('input[type="checkbox"]') ||
			target.closest('button') ||
			target.closest('a') ||
			target.closest('.task-extras')
		)) {
			return;
		}
		
		if (touchIdentifier === null || !container) return;
		
		const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier);
		if (!touch) return;
		
		const deltaX = touch.clientX - swipeStartX;
		const absDeltaX = Math.abs(deltaX);
		const absDeltaY = Math.abs(touch.clientY - swipeStartY);
		
		// Only start swiping if horizontal movement is greater than vertical and significant
		// This prevents conflicts with clicks (which require < 10px movement)
		if (absDeltaX > 20 && absDeltaX > absDeltaY * 1.5) {
				isSwiping = true;
				container.style.transition = 'none';
				container.style.transform = `translateX(${deltaX}px)`;
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
		const target = e.target as HTMLElement;
		if (target && (
			target.closest('input[type="checkbox"]') ||
			target.closest('button') ||
			target.closest('a') ||
			target.closest('.task-extras')
		)) {
			swipeStartX = 0;
			swipeStartY = 0;
			isSwiping = false;
			touchIdentifier = null;
			return;
		}
		
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
			const containerWidth = container?.clientWidth || window.innerWidth;
			
			if (container) {
				// Animate current view out
			container.style.transition = 'transform 0.1s ease-out';
			container.style.transform = `translateX(${direction === 1 ? -containerWidth : containerWidth}px)`;
			
			setTimeout(async () => {
				const newDate = new Date(props.date);
				newDate.setDate(newDate.getDate() + direction);
				// Emit date change event to parent
				if (props.onDateChange) {
					props.onDateChange(newDate);
				}
				
					// Reset position and animate in
					if (container) {
				container.style.transition = 'none';
				container.style.transform = `translateX(${direction === 1 ? containerWidth : -containerWidth}px)`;
				
				await loadTasks();
				
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
								if (container) {
									container.style.transition = 'transform 0.1s ease-out';
						container.style.transform = 'translateX(0)';
								}
					});
				});
					}
			}, 100);
			} else {
				// Fallback without animation
				const newDate = new Date(props.date);
				newDate.setDate(newDate.getDate() + (deltaX < 0 ? 1 : -1));
				if (props.onDateChange) {
					props.onDateChange(newDate);
				}
			}
		} else {
			// Reset position if swipe was not sufficient
			if (container) {
				container.style.transition = 'transform 0.1s ease-out';
			container.style.transform = 'translateX(0)';
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
		if (container && isSwiping) {
			container.style.transition = 'transform 0.1s ease-out';
			container.style.transform = 'translateX(0)';
			// Block sidebar on cancel if we were swiping
			e.preventDefault();
			e.stopPropagation();
		}
		swipeStartX = 0;
		swipeStartY = 0;
		isSwiping = false;
		touchIdentifier = null;
	};
	
	swipeHandlers.start = handleSwipeStart;
	swipeHandlers.move = handleSwipeMove;
	swipeHandlers.end = handleSwipeEnd;
	swipeHandlers.cancel = handleTouchCancel;
	swipeHandlers.container = container;
	
	// Use capture phase to intercept events before Obsidian's handlers
	container.addEventListener('touchstart', handleSwipeStart, { passive: false, capture: true });
	container.addEventListener('touchmove', handleSwipeMove, { passive: false, capture: true });
	container.addEventListener('touchend', handleSwipeEnd, { passive: false, capture: true });
	container.addEventListener('touchcancel', handleTouchCancel, { passive: false, capture: true });
};

const openMonthlyNoteFile = async () => {
	try {
		const format = props.view.plugin.settings.filenameFormat || 'YYYY-MM';
		const dateHeader = moment(props.date).format(format);
		const fileName = `${dateHeader}.md`;
		
		// Use tasksCreateFolderPath if specified, otherwise fall back to tasksFolderPath
		const folderPathSetting = props.view.plugin.settings.tasksCreateFolderPath || props.view.plugin.settings.tasksFolderPath || '';
		let filePath = fileName;
		if (folderPathSetting.trim()) {
			const folderPath = folderPathSetting.trim().replace(/^\/+|\/+$/g, '');
			filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
		}
		
		let file = props.app.vault.getAbstractFileByPath(filePath);
		
		if (!(file instanceof TFile)) {
			if (folderPathSetting.trim()) {
				const folderPath = folderPathSetting.trim().replace(/^\/+|\/+$/g, '');
				if (folderPath) {
					const folder = props.app.vault.getAbstractFileByPath(folderPath);
					if (!folder) {
						try {
							await props.app.vault.createFolder(folderPath);
						} catch (error) {
							console.error('Error creating folder:', error);
						}
					}
				}
			}
			
			try {
				file = await props.app.vault.create(filePath, '');
			} catch (error) {
				console.error('Error creating monthly note:', error);
				new Notice(translate('failedToCreateNote'));
				return;
			}
		}
		
		if (file instanceof TFile) {
			const leaf = props.app.workspace.getLeaf();
			await leaf.openFile(file);
			close();
		}
	} catch (error) {
		console.error('Error opening monthly note file:', error);
		new Notice(translate('failedToOpenFile'));
	}
};

watch(() => props.date, () => {
	loadTasks();
}, { immediate: false });

onMounted(async () => {
	await nextTick();
	if (modalContainer.value) {
		modalContainer.value.classList.add('tasks-for-date-modal');
		const modalEl = modalContainer.value.closest('.modal');
		if (modalEl) {
			modalEl.classList.add('tasks-for-date-modal-root');
		}
	}
	
	await loadTasks();
	
	if (modalContainer.value) {
		addSwipeHandlers(modalContainer.value);
	}
	
	// Add link handler once - it will work for all dynamically added links
	if (markdownContainer.value) {
		attachLinkHandlers(markdownContainer.value);
	}
});

onUnmounted(() => {
	if (swipeHandlers.container) {
		if (swipeHandlers.start) {
			swipeHandlers.container.removeEventListener('touchstart', swipeHandlers.start, { capture: true } as any);
		}
		if (swipeHandlers.move) {
			swipeHandlers.container.removeEventListener('touchmove', swipeHandlers.move, { capture: true } as any);
		}
		if (swipeHandlers.end) {
			swipeHandlers.container.removeEventListener('touchend', swipeHandlers.end, { capture: true } as any);
		}
		if (swipeHandlers.cancel) {
			swipeHandlers.container.removeEventListener('touchcancel', swipeHandlers.cancel, { capture: true } as any);
		}
	}
	
	// Remove link click handler
	if (linkClickHandler && markdownContainer.value) {
		markdownContainer.value.removeEventListener('click', linkClickHandler, true);
		linkClickHandler = null;
	}
});
</script>

