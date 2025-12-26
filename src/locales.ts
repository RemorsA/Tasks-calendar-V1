export type Language = 'ru' | 'en' | 'zh';

export interface Translations {
	[key: string]: string;
}

export const translations: Record<Language, Translations> = {
	ru: {

		'noTasks': 'Задачи не найдены',
		'onlyCalendarTasks': 'Отображаются только задачи с эмодзи 📅',
		'checkConsole': 'Проверьте консоль (F12) для отладочной информации',
		'tasks': 'задач',
		'completed': 'выполнено',
		'task': 'Задача',
		'more': 'еще',
		'tasksForDate': 'Задачи на',
		'noTasksForDate': 'На эту дату нет задач',
		'openTask': 'Открыть задачу',
		'completedTask': 'Выполнено',
		'markCompleted': 'Выполнено',
		'markIncomplete': 'Не выполнено',
		'overdue': 'Не выполнено',
		'current': 'Текущие',
		'completedSection': 'Завершенные',

		'tasksPluginNotFound': 'Плагин Tasks не найден',
		'failedToCreateOrAccessNote': 'Не удалось создать или получить доступ к заметке',
		'taskAddedSuccessfully': 'Задача успешно добавлена',
		'failedToCreateFolder': 'Не удалось создать папку. Проверьте путь в настройках.',
		'failedToCreateNote': 'Не удалось создать заметку. Проверьте путь к папке в настройках.',
		'failedToToggleTaskCompletion': 'Не удалось изменить статус задачи',
		'failedToOpenFile': 'Не удалось открыть файл',

		'createTask': 'Создать задачу',
		'create': 'Создать',
		'createTaskInEditor': 'Создать задачу в редакторе',
		'openTaskCalendar': 'Открыть календарь задач',
		'settingsTitle': 'Настройки "Tasks calendar"',
		'close': 'Закрыть',
		'openFileForThisDate': 'Открыть файл с этой датой',
		'hideCompletedTasks': 'Скрыть выполненные задачи',
		'showCompletedTasks': 'Показать выполненные задачи',

		'tasksFolderPath': 'Путь к папке с задачами',
		'tasksFolderPathDesc': 'Путь к папке с задачами. Используется для загрузки задач в календарь (например, "Tasks" или "Notes/Tasks"). Оставьте пустым, чтобы использовать корень хранилища.',
		'tasksCreateFolderPath': 'Путь к папке для создания задач',
		'tasksCreateFolderPathDesc': 'Путь к папке, куда будут создаваться новые файлы с задачами. Если не указано, будет использоваться путь из настройки "Путь к папке с задачами".',
		'tasksCreateFolderPathPlaceholder': 'Tasks',
		'autoOpenCalendar': 'Автоматически открывать календарь при запуске',
		'autoOpenCalendarDesc': 'При открытии приложения автоматически открывать вкладку с календарем. Если вкладка уже открыта, переключиться на нее.',
		'language': 'Язык / Language',
		'languageDesc': 'Язык интерфейса / Interface language',
		'filenameFormat': 'Формат имени файла',
		'filenameFormatDesc': 'Формат имени файла для новых задач (например: YYYY-MM, YYYY-MM-DD). Используйте токены moment.js.',
		'taskColors': 'Цвета задач',
		'incompleteTaskColor': 'Цвет невыполненных задач',
		'incompleteTaskColorDesc': 'Цвет фона для невыполненных задач. Нажмите на цветовой круг или выберите пресет.',
		'completedTaskColor': 'Цвет выполненных задач',
		'completedTaskColorDesc': 'Цвет фона для выполненных задач. Нажмите на цветовой круг или выберите пресет.',
		'overdueTaskColor': 'Цвет просроченных задач',
		'overdueTaskColorDesc': 'Цвет фона для просроченных задач (невыполненные задачи из прошлых дат).',
		'resetToDefault': 'Сбросить',
		'presets': 'Пресеты'
	},
	en: {

		'noTasks': 'No tasks found',
		'onlyCalendarTasks': 'Only tasks with 📅 emoji are displayed',
		'checkConsole': 'Check console (F12) for debugging information',
		'tasks': 'tasks',
		'completed': 'completed',
		'task': 'Task',
		'more': 'more',
		'tasksForDate': 'Tasks for',
		'noTasksForDate': 'No tasks for this date',
		'openTask': 'Open task',
		'completedTask': 'Completed',
		'markCompleted': 'Completed',
		'markIncomplete': 'Incomplete',
		'overdue': 'Overdue',
		'current': 'Current',
		'completedSection': 'Completed',

		'tasksPluginNotFound': 'Tasks plugin not found',
		'failedToCreateOrAccessNote': 'Failed to create or access note',
		'taskAddedSuccessfully': 'Task added successfully',
		'failedToCreateFolder': 'Failed to create folder. Check the path in settings.',
		'failedToCreateNote': 'Failed to create note. Check the folder path in settings.',
		'failedToToggleTaskCompletion': 'Failed to toggle task completion',
		'failedToOpenFile': 'Failed to open file',

		'createTask': 'Create task',
		'create': 'Create',
		'createTaskInEditor': 'Create task in editor',
		'openTaskCalendar': 'Open task calendar',
		'settingsTitle': '"Tasks calendar" settings',
		'close': 'Close',
		'openFileForThisDate': 'Open file for this date',
		'hideCompletedTasks': 'Hide completed tasks',
		'showCompletedTasks': 'Show completed tasks',

		'tasksFolderPath': 'Tasks folder path',
		'tasksFolderPathDesc': 'Path to folder with tasks. Used for loading tasks in calendar (e.g., "Tasks" or "Notes/Tasks"). Leave empty to use vault root.',
		'tasksCreateFolderPath': 'Path to folder for creating tasks',
		'tasksCreateFolderPathDesc': 'Path to folder where new task files will be created. If not specified, the path from "Tasks folder path" setting will be used.',
		'tasksCreateFolderPathPlaceholder': 'Tasks',
		'autoOpenCalendar': 'Auto-open calendar on startup',
		'autoOpenCalendarDesc': 'Automatically open calendar tab when the app starts. If the tab is already open, switch to it.',
		'language': 'Language / Язык',
		'languageDesc': 'Interface language / Язык интерфейса',
		'filenameFormat': 'Filename format',
		'filenameFormatDesc': 'Filename format for new tasks (e.g., YYYY-MM, YYYY-MM-DD). Use moment.js tokens.',
		'taskColors': 'Task Colors',
		'incompleteTaskColor': 'Incomplete task color',
		'incompleteTaskColorDesc': 'Background color for incomplete tasks. Click the color circle or choose a preset.',
		'completedTaskColor': 'Completed task color',
		'completedTaskColorDesc': 'Background color for completed tasks. Click the color circle or choose a preset.',
		'overdueTaskColor': 'Overdue task color',
		'overdueTaskColorDesc': 'Background color for overdue tasks (incomplete tasks from past dates).',
		'resetToDefault': 'Reset',
		'presets': 'Presets'
	},
	zh: {

		'noTasks': '未找到任务',
		'onlyCalendarTasks': '仅显示带有 📅 表情符号的任务',
		'checkConsole': '检查控制台 (F12) 以获取调试信息',
		'tasks': '任务',
		'completed': '已完成',
		'task': '任务',
		'more': '更多',
		'tasksForDate': '任务日期',
		'noTasksForDate': '此日期没有任务',
		'openTask': '打开任务',
		'completedTask': '已完成',
		'markCompleted': '已完成',
		'markIncomplete': '未完成',
		'overdue': '逾期',
		'current': '当前',
		'completedSection': '已完成',

		'tasksPluginNotFound': '未找到 Tasks 插件',
		'failedToCreateOrAccessNote': '无法创建或访问笔记',
		'taskAddedSuccessfully': '任务已成功添加',
		'failedToCreateFolder': '无法创建文件夹。请检查设置中的路径。',
		'failedToCreateNote': '无法创建笔记。请检查设置中的文件夹路径。',
		'failedToToggleTaskCompletion': '无法切换任务完成状态',
		'failedToOpenFile': '无法打开文件',

		'createTask': '创建任务',
		'create': '创建',
		'createTaskInEditor': '在编辑器中创建任务',
		'openTaskCalendar': '打开任务日历',
		'settingsTitle': '设置 "Tasks calendar"',
		'close': '关闭',
		'openFileForThisDate': '打开此日期的文件',
		'hideCompletedTasks': '隐藏已完成的任务',
		'showCompletedTasks': '显示已完成的任务',

		'tasksFolderPath': '任务文件夹路径',
		'tasksFolderPathDesc': '任务文件夹路径。用于加载日历中的任务（例如，"Tasks" 或 "Notes/Tasks"）。留空以使用库根目录。',
		'tasksCreateFolderPath': '创建任务的文件夹路径',
		'tasksCreateFolderPathDesc': '将创建新任务文件的文件夹路径。如果未指定，将使用"任务文件夹路径"设置中的路径。',
		'tasksCreateFolderPathPlaceholder': 'Tasks',
		'autoOpenCalendar': '启动时自动打开日历',
		'autoOpenCalendarDesc': '应用启动时自动打开日历标签页。如果标签页已打开，则切换到该标签页。',
		'language': '语言 / Language / Язык',
		'languageDesc': '界面语言 / Interface language / Язык интерфейса',
		'filenameFormat': '文件名格式',
		'filenameFormatDesc': '新任务的文件名格式（例如：YYYY-MM, YYYY-MM-DD）。使用 moment.js 令牌。',
		'taskColors': '任务颜色',
		'incompleteTaskColor': '未完成任务颜色',
		'incompleteTaskColorDesc': '未完成任务的背景颜色。点击颜色圆圈或选择预设。',
		'completedTaskColor': '已完成任务颜色',
		'completedTaskColorDesc': '已完成任务的背景颜色。点击颜色圆圈或选择预设。',
		'overdueTaskColor': '逾期任务颜色',
		'overdueTaskColorDesc': '逾期任务的背景颜色（过去日期的未完成任务）。',
		'resetToDefault': '重置',
		'presets': '预设'
	}
};

export function t(lang: Language, key: string): string {
	return translations[lang]?.[key] || translations.en[key] || key;
}

export function getDayNames(lang: Language): string[] {
	if (lang === 'ru') {
		return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
	}
	if (lang === 'zh') {
		return ['一', '二', '三', '四', '五', '六', '日'];
	}
	return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

export function getFullDayNames(lang: Language): string[] {
	if (lang === 'ru') {
		return ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
	}
	if (lang === 'zh') {
		return ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
	}
	return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

export function getMonthNames(lang: Language): string[] {
	if (lang === 'ru') {
		return ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
			'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
	}
	if (lang === 'zh') {
		return ['一月', '二月', '三月', '四月', '五月', '六月',
			'七月', '八月', '九月', '十月', '十一月', '十二月'];
	}
	return ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
}

export function getMonthNamesGenitive(lang: Language): string[] {
	if (lang === 'ru') {
		return ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
			'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
	}
	return getMonthNames(lang);
}

