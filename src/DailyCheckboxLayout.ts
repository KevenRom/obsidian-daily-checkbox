/**
 * Various rendering options for a query.
 * See applyOptions below when adding options here.
 */
export class LayoutOptions {
	hidePostponeButton = false;
	hideTaskCount = false;
	hideBacklinks = false;
	hidePriority = false;
	hideCreatedDate = false;
	hideStartDate = false;
	hideScheduledDate = false;
	hideDoneDate = false;
	hideDueDate = false;
	hideRecurrenceRule = false;
	hideEditButton = false;
	hideUrgency = true;
	hideTags = false;
	shortMode = false;
	explainQuery = false;
	hideRecurrenceDate = false;
}


export type TaskLayoutComponent =
	// NEW_TASK_FIELD_EDIT_REQUIRED
	| 'description'
	| 'recurrenceRule'
	| 'doneDate'
	| 'recurrenceDate'
	| 'blockLink';


/**
 * dailyCheckbox가 렌더링될때 렌더링의 레이아웃을 나타내기위한 클래스
 * 원하는 옵션을 설정한 LayoutOptions 객채를 사용함으로써 원하는 레이아웃을 설정 가능
 */
export class TaskLayout {
	public defaultLayout: TaskLayoutComponent[] = [
		'description',
		'recurrenceRule',
		'doneDate',
		'recurrenceDate',
		'blockLink',
	];
	public shownTaskLayoutComponents: TaskLayoutComponent[];
	public hiddenTaskLayoutComponents: TaskLayoutComponent[] = [];
	public options: LayoutOptions;
	public taskListHiddenClasses: string[] = [];


	constructor(options?: LayoutOptions) {
		if (options) {
			this.options = options;
		} else {
			this.options = new LayoutOptions();
		}
		this.shownTaskLayoutComponents = this.defaultLayout;
		this.applyOptions();
	}


	/**
	 * 옵션에 따라 레이아웃의 컴포넌트를 제거함. 일부 요소(설명 등)는 제거할 옵션이 없기 때문에 여기에서는 다루지않음
	 */
	private applyOptions() {
		const componentsToHideAndGenerateClasses: [boolean, TaskLayoutComponent][] = [
			[this.options.hideRecurrenceRule, 'recurrenceRule'],
			[this.options.hideRecurrenceDate, 'recurrenceDate'],
			[this.options.hideDoneDate, 'doneDate'],
		];
		for (const [hide, component] of componentsToHideAndGenerateClasses) {
			this.hideComponent(hide, component);
			this.generateHiddenClassForTaskList(hide, component);
		}

		const componentsToGenerateClassesOnly: [boolean, string][] = [
			// Tags are hidden, rather than removed. See tasks-layout-hide-tags in styles.css.
			[this.options.hideTags, 'tags'],

			// The following components are handled in QueryRenderer.ts and thus are not part of the same flow that
			// hides TaskLayoutComponent items. However, we still want to have 'tasks-layout-hide' items for them
			// (see https://github.com/obsidian-tasks-group/obsidian-tasks/issues/1866).
			// This can benefit from some refactoring, i.e. render these components in a similar flow rather than
			// separately.
			[this.options.hideUrgency, 'urgency'],
			[this.options.hideBacklinks, 'backlinks'],
			[this.options.hideEditButton, 'edit-button'],
			[this.options.hidePostponeButton, 'postpone-button'],
		];
		for (const [hide, component] of componentsToGenerateClassesOnly) {
			this.generateHiddenClassForTaskList(hide, component);
		}

		if (this.options.shortMode) this.taskListHiddenClasses.push('tasks-layout-short-mode');
	}

	private generateHiddenClassForTaskList(hide: boolean, component: string) {
		if (hide) {
			this.taskListHiddenClasses.push(`tasks-layout-hide-${component}`);
		}
	}

	/**
	 * Move a component from the shown to hidden if the given layoutOption criteria is met.
	 */
	private hideComponent(hide: boolean, component: TaskLayoutComponent) {
		if (hide) {
			this.hiddenTaskLayoutComponents.push(component);
			this.shownTaskLayoutComponents = this.shownTaskLayoutComponents.filter((element) => element != component);
		}
	}
}
