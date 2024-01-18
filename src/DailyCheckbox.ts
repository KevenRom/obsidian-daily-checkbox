import type { Moment } from 'moment';
import { Status } from "./Status/Status";
import { StatusRegistry } from "./Status/StatusRegistry";
import { DEFAULT_SYMBOLS, DefaultTaskSerializer } from './DailyCheckboxSerializer/DefaultDailyCheckboxSerializer';
import { RRule } from 'rrule';


/**
 * 마크다운 텍스트의 각종 구성 요소를 추출하기 위한 정규 표현식
 */
export class RegularExpressions {
	public static readonly dateFormat = 'YYYY-MM-DD';
	public static readonly dateTimeFormat = 'YYYY-MM-DD HH:mm';

	// Matches indentation before a list marker (including > for potentially nested blockquotes or Obsidian callouts)
	public static readonly indentationRegex = /^([\s\t>]*)/;

	// Matches - * and + list markers, or numbered list markers (eg 1.)
	public static readonly listMarkerRegex = /([-*+]|[0-9]+\.)/;

	// Matches a checkbox and saves the status character inside
	public static readonly checkboxRegex = /\[(.)\]/u;

	// Matches the rest of the task after the checkbox.
	public static readonly afterCheckboxRegex = / *(.*)/u;

	// Main regex for parsing a line. It matches the following:
	// - Indentation
	// - List marker
	// - Status character
	// - Rest of task after checkbox markdown
	// See Task.extractTaskComponents() for abstraction around this regular expression.
	// That is private for now, but could be made public in future if needed.
	public static readonly taskRegex = new RegExp(
		RegularExpressions.indentationRegex.source +
		RegularExpressions.listMarkerRegex.source +
		' +' +
		RegularExpressions.checkboxRegex.source +
		RegularExpressions.afterCheckboxRegex.source,
		'u',
	);

	// Used with the "Create or Edit Task" command to parse indentation and status if present
	public static readonly nonTaskRegex = new RegExp(
		RegularExpressions.indentationRegex.source +
		RegularExpressions.listMarkerRegex.source +
		'? *(' +
		RegularExpressions.checkboxRegex.source +
		')?' +
		RegularExpressions.afterCheckboxRegex.source,
		'u',
	);

	// Used with "Toggle Done" command to detect a list item that can get a checkbox added to it.
	public static readonly listItemRegex = new RegExp(
		RegularExpressions.indentationRegex.source + RegularExpressions.listMarkerRegex.source,
	);

	// Match on block link at end.
	public static readonly blockLinkRegex = / \^[a-zA-Z0-9-]+$/u;

	// Regex to match all hash tags, basically hash followed by anything but the characters in the negation.
	// To ensure URLs are not caught it is looking of beginning of string tag and any
	// tag that has a space in front of it. Any # that has a character in front
	// of it will be ignored.
	// EXAMPLE:
	// description: '#dog #car http://www/ddd#ere #house'
	// matches: #dog, #car, #house
	// MAINTENANCE NOTE:
	//  If hashTags is modified, please update 'Recognising Tags' in Tags.md in the docs.
	public static readonly hashTags = /(^|\s)#[^ !@#$%^&*(),.?":{}|<>]+/g;
	public static readonly hashTagsFromEnd = new RegExp(this.hashTags.source + '$');
}


/**
 * DailyCheckbox가 있는 원본 텍스트를 섹션별로 나누어 정의하기 위한 인터페이스
 */
interface DailyCheckboxComponents {
	indentation: string;
	listMarker: string;
	status: Status;
	body: string;
	blockLink: string;
}


export class DailyCheckbox {
	public indentation: string;
	public listMarker: string;
	public status: Status;
	public blockLink: string;
	public description: string;
	public doneDate: Moment | null;
	public recurrenceRRule: RRule | null;
	public recurrenceDate: Moment | null;
	public tags: string[];
	public originalMarkdown: string;


	constructor({
		indentation,
		listMarker,
		status,
		blockLink,
		description,
		doneDate,
		recurrenceRRule,
		recurrenceDate,
		tags,
		originalMarkdown
	}: {
		indentation: string;
		listMarker: string;
		status: Status;
		blockLink: string;
		description: string;
		doneDate: Moment | null;
		recurrenceRRule: RRule | null;
		recurrenceDate: Moment | null;
		tags: string[] | [];
		originalMarkdown: string;
	}) {
		this.indentation = indentation;
		this.listMarker = listMarker;
		this.status = status;
		this.blockLink = blockLink;
		this.description = description;
		this.doneDate = doneDate;
		this.recurrenceRRule = recurrenceRRule;
		this.recurrenceDate = recurrenceDate;
		this.tags = tags;
		this.originalMarkdown = originalMarkdown;
	}


	/**
	 * 옵시디언 노트에서 주어진 줄을 가져와 작업 객체를 반환합니다.
     * 줄에 글로벌 필터가 있는지 확인합니다.
	 * @param Line
	 * @param taskLocation
	 * @param fallbackDate
	 */
	public static fromLine({ line }: { line: string; }): DailyCheckbox | null {
		const taskComponents = DailyCheckbox.extractLineComponents(line);
		if (taskComponents === null) {
			return null;
		}

		//if (!GlobalFilter.getInstance().includedIn(taskComponents.body)) {
		//	return null;
		//}

		return DailyCheckbox.parseLineSignifiers(line);
	}
	/**
	 * 줄을 파싱하여 세부 사항을 얻으려고 시도합니다.
	 * 이 함수는 글로벌 필터가 없어도 줄을 읽고 세부 사항을 얻으려고 시도합니다. 글로벌 필터 확인이 필요한 경우 Task.fromLine을 사용하세요.
	 * @param line
	 * @param taskLocation
	 * @param fallbackDate
	 * @returns
	 */
	public static parseLineSignifiers(line: string): DailyCheckbox | null {
		const taskComponents = DailyCheckbox.extractLineComponents(line);
		if (taskComponents === null) {
			return null;
		}

		//체크박스를 제외한 나머지 텍스트로 각종 dailcheckbox를 추출한다.
		const taskInfo = new DefaultTaskSerializer(DEFAULT_SYMBOLS).deserialize(taskComponents.body);

		taskInfo.tags = taskInfo.tags.map((tag) => tag.trim());	// 태그 주위에 공백이 제거되었는지 확인
		//taskInfo.tags = taskInfo.tags.filter((tag) => !GlobalFilter.getInstance().equals(tag));	// 글로벌 필터가 있을경우 제거

		return new DailyCheckbox({
			...taskComponents,
			...taskInfo,
			originalMarkdown: line
		});
	}
	/**
	* 태스크 라인의 구성 요소를 추출합니다.
	* 특징으로는 체크박스까지만 구성 요소를 추출한다.
	* @param line
	* @returns
	*/
	static extractLineComponents(line: string): DailyCheckboxComponents | null {
		// 줄을 확인하여 마크다운 텍스트인지 확인합니다.
		const regexMatch = line.match(RegularExpressions.taskRegex);
		if (regexMatch === null) {
			return null;
		}

		const indentation = regexMatch[1];	//indentationRegex 변수 참조 (공백이나 탭, > 문자 등)
		const listMarker = regexMatch[2];	//listMarkerRegex 변수 참조
		const statusString = regexMatch[3];	//checkboxRegex 변수 참조 (체크박스 안에 상태)
		let body = regexMatch[4].trim();	//afterCheckboxRegex  변수 참조 (체크박스 이후 나머지 문자들)
		const status = StatusRegistry.getInstance().bySymbolOrCreate(statusString);	//체크박스 안의 변수인 statusString를 참조하여 체크박의 상태를 나타내기위한 status를 반환
		const blockLinkMatch = body.match(RegularExpressions.blockLinkRegex);	//블록 링크(참조)에 대해 매치하고 찾았다면 제거합니다. 항상 라인의 끝에 있을 것으로 예상됩니다. (블록 링크란 https://statisticsplaybook.com/obsidian-markdown-cheatsheet/ 에서 문단 참조 검색)
		const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';
		if (blockLink !== '') {
			body = body.replace(RegularExpressions.blockLinkRegex, '').trim();
		}

		return { indentation, listMarker, status, body, blockLink };
	}
	/**
	 * 문자열에 발견된 태그 배열을 반환
	 */
	public static extractHashtags(description: string): string[] {
		return description.match(RegularExpressions.hashTags)?.map((tag) => tag.trim()) ?? [];
	}
	/**
	 * dailycheckbox를 토글하고 생성된 dailycheckbox를 반환.
	 * 어떤것이 원본 dailycheckbox
	 * 만약 dailycheckbox가 반복되지 않는다면 [toggled]를 반환합니다.
	 * 반복되는 dailycheckbox가 있을경우 [next, toggled] 순서로 반환
	 * @returns
	 */
	public toggle(): DailyCheckbox {
		const newStatus = StatusRegistry.getInstance().getNextStatusOrCreate(this.status);
		const newTasks = this.handleNewStatus(newStatus);

		return newTasks;
	}
	/**
	 * 새 상태를 파라미터로 받고 그걸로 DailyCheckbox를 생성하는 함수
	 * @param newStatus
	 * @returns
	 */
	public handleNewStatus(newStatus: Status): DailyCheckbox {
		// 새 상태가 현재 상태 동작과 동일한 경우 개체를 만들 필요 없음
		if (newStatus.identicalTo(this.status)) {
			return this;
		}

		let newDoneDate = null;
		let newRecurrenceDate = null;
		if (newStatus.isCompleted() && this.recurrenceRRule !== null) {
			newDoneDate = window.moment();
			newRecurrenceDate = this.nextAfter(window.moment().endOf('day'), new RRule({ ...this.recurrenceRRule.origOptions, dtstart: newDoneDate.startOf('day').toDate() }));
		}

		return new DailyCheckbox({
			...this,
			status: newStatus,
			doneDate: newDoneDate,
			recurrenceDate: newRecurrenceDate,
		});
	}
	/**
	 * 매개변수의 after 날짜를 rrule 기준으로 다음 체크 날짜를 반환하는 함수
	 * (이게 지금 함수를 보면 알겠지만 매개변수로 필요한 변수를 다 받기 때문에 this.nextAfter일 필요가 없지만, 수정하면 다른 함수도 몽땅 고쳐야하기 때문에 귀차나)
	 * @param after
	 * @param rrule
	 * @returns
	 */
	private nextAfter(after: Moment, rrule: RRule): Moment {
		// rrule이 무조건 utc로 계산하기때문에 -9시 함
		let next = window.moment(rrule.after(after.toDate())).subtract(9, 'hours');
		const asText = rrule.toText();

		// 매달 반복되는 일이라면 따로 세팅해줘야함
		const monthMatch = asText.match(/every( \d+)? month(s)?(.*)?/);
		if (monthMatch !== null) {
			// 'every month on the 31st' 같이 날짜를 정하는 경우
			if (!asText.includes(' on ')) {
				next = DailyCheckbox.nextAfterMonths(after, next, rrule, monthMatch[1]);
			}
		}

		// 매년 반복되는 일이라면 따로 세팅해줘야함
		const yearMatch = asText.match(/every( \d+)? year(s)?(.*)?/);
		if (yearMatch !== null) {
			next = DailyCheckbox.nextAfterYears(after, next, rrule, yearMatch[1]);
		}

		return next;
	}
	/**
 * skippingMonths 파라미터로 들어오는 개월 후의 다음 날짜를 계산하는 함수	
 */
	private static nextAfterMonths(after: Moment, next: Moment, rrule: RRule, skippingMonths: string | undefined,): Moment {
		let parsedSkippingMonths = 1;
		if (skippingMonths !== undefined) {
			parsedSkippingMonths = Number.parseInt(skippingMonths.trim(), 10);
		}

		while (DailyCheckbox.isSkippingTooManyMonths(after, next, parsedSkippingMonths)) {
			next = DailyCheckbox.fromOneDayEarlier(after, rrule);
		}

		return next;
	}
	private static isSkippingTooManyMonths(after: Moment, next: Moment, skippingMonths: number): boolean {
		let diffMonths = next.month() - after.month();

		// Maybe some years have passed?
		const diffYears = next.year() - after.year();
		diffMonths += diffYears * 12;

		return diffMonths > skippingMonths;
	}
	/**
	 * skippingYears 파라미터로 들어오는 년 후의 다음 날짜를 계산하는 함수	
	 */
	private static nextAfterYears(after: Moment, next: Moment, rrule: RRule, skippingYears: string | undefined,): Moment {
		let parsedSkippingYears = 1;
		if (skippingYears !== undefined) {
			parsedSkippingYears = Number.parseInt(skippingYears.trim(), 10);
		}

		while (DailyCheckbox.isSkippingTooManyYears(after, next, parsedSkippingYears)) {
			next = DailyCheckbox.fromOneDayEarlier(after, rrule);
		}

		return next;
	}
	private static isSkippingTooManyYears(after: Moment, next: Moment, skippingYears: number): boolean {
		const diff = next.year() - after.year();

		return diff > skippingYears;
	}
	private static fromOneDayEarlier(after: Moment, rrule: RRule): Moment {
		after.subtract(1, 'days').endOf('day');

		const options = rrule.origOptions;
		options.dtstart = after.startOf('day').toDate();
		rrule = new RRule(options);

		return window.moment(rrule.after(after.toDate()));
	}
	/**
	 * dailycheckbox의 모든 요소를 문자열로 직렬화 합니다.
	 * @returns
	 */
	public toString(): string {
		return new DefaultTaskSerializer(DEFAULT_SYMBOLS).serialize(this);
	}
	/**
	 * dailcheckbox를 옵시디언의 체크박스 텍스트 형식으로 반환합니다.
	 * @returns
	 */
	public toFileLineString(): string {
		return `${this.indentation}${this.listMarker} [${this.status.symbol}] ${this.toString()}`;
	}
}
