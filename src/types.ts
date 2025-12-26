import { TFile } from 'obsidian';

export interface TasksCalendarSettings {
	tasksFolderPath: string;
	tasksCreateFolderPath: string;
	language: 'ru' | 'en' | 'zh';
	filenameFormat: string;
	showCompletedTasks: boolean;
	autoOpenCalendar: boolean;
	incompleteTaskColor: string;
	completedTaskColor: string;
	overdueTaskColor: string;
}

export const DEFAULT_SETTINGS: TasksCalendarSettings = {
	tasksFolderPath: '/',
	tasksCreateFolderPath: '',
	language: 'en',
	filenameFormat: 'YYYY-MM',
	showCompletedTasks: true,
	autoOpenCalendar: false,
	incompleteTaskColor: '#DFCFBA', // Vanilla Chocolate
	completedTaskColor: '#2D3E56', // Deep Blueberry
	overdueTaskColor: '#E7993F' // Warm Caramel
};

export interface Task {
	text: string;
	date: Date | null;
	file: TFile;
	line: number;
	isCompleted: boolean;
}

export interface SwipeHandlers {
	touchStart: ((e: TouchEvent) => void) | null;
	touchMove: ((e: TouchEvent) => void) | null;
	touchEnd: ((e: TouchEvent) => void) | null;
	touchCancel: ((e: TouchEvent) => void) | null;
	mouseDown: ((e: MouseEvent) => void) | null;
	mouseMove: ((e: MouseEvent) => void) | null;
	mouseUp: ((e: MouseEvent) => void) | null;
	mouseLeave: ((e: MouseEvent) => void) | null;
	gridContainer: HTMLElement | null;
}

export interface ModalSwipeHandlers {
	start: ((e: TouchEvent) => void) | null;
	move: ((e: TouchEvent) => void) | null;
	end: ((e: TouchEvent) => void) | null;
	cancel: ((e: TouchEvent) => void) | null;
	container: HTMLElement | null;
}

