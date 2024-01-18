import type { Moment } from 'moment';
import type { TaskLayoutComponent } from '../DailyCheckboxLayout';
import { DailyCheckbox, RegularExpressions } from "../DailyCheckbox";
import { DailyCheckDetails, DailyCheckboxSerializer } from "./Detail";
import { TaskLayout } from '../DailyCheckboxLayout';
import { Notice } from 'obsidian';
import { RRule } from 'rrule';


/**
 * DefaultTaskSerializer가 태스크를 직렬화, 역직렬화하는 데 사용하는 기호를 정리한 인터페이스
 */
export interface DefaultDailyCheckboxSerializerSymbols {
	readonly doneDateSymbol: string;
	readonly recurrenceSymbol: string;
	readonly recurrenceDateSymbol: string;
	readonly TaskFormatRegularExpressions: {
		doneDateRegex: RegExp;
		recurrenceRegex: RegExp;
		recurrenceDateRegex: RegExp;
	};
}


/**
 * 옵시디언에서 dailyCheckbox를 표기하기위한 기호 맵
 */
export const DEFAULT_SYMBOLS: DefaultDailyCheckboxSerializerSymbols = {
	doneDateSymbol: '✅',
	recurrenceSymbol: '🔁',
	recurrenceDateSymbol: '⏳',
	TaskFormatRegularExpressions: {
		doneDateRegex: /✅ *(\d{4}-\d{2}-\d{2})$/u,
		recurrenceRegex: /🔁 ?([a-zA-Z0-9, !]+)$/iu,
		recurrenceDateRegex: /⏳ *(\d{4}-\d{2}-\d{2})$/u,
	},
} as const;


export class DefaultTaskSerializer implements DailyCheckboxSerializer {
	constructor(public readonly symbols: DefaultDailyCheckboxSerializerSymbols) { }


	/**
	 * DailyCheckDetails 정보를 직렬화하여 텍스트를 생성
	 * @param task
	 * @returns
	 */
	public serialize(task: DailyCheckbox): string {
		const taskLayout = new TaskLayout();
		let taskString = '';
		for (const component of taskLayout.shownTaskLayoutComponents) {
			taskString += this.componentToString(task, taskLayout, component);
		}
		return taskString;
	}
	public componentToString(dailyCheckbox: DailyCheckbox, layout: TaskLayout, component: TaskLayoutComponent) {
		const {
			doneDateSymbol,
			recurrenceSymbol,
			recurrenceDateSymbol,
		} = this.symbols;
		switch (component) {
			case 'description':
				return dailyCheckbox.description;
			case 'doneDate':
				if (!dailyCheckbox.doneDate) return '';
				return layout.options.shortMode
					? ' ' + doneDateSymbol
					: ` ${doneDateSymbol} ${dailyCheckbox.doneDate.format(RegularExpressions.dateFormat)}`;
			case 'recurrenceRule':
				if (!dailyCheckbox.recurrenceRRule) return '';
				return layout.options.shortMode
					? ' ' + recurrenceSymbol
					: ` ${recurrenceSymbol} ${dailyCheckbox.recurrenceRRule.toText()}`;
			case 'recurrenceDate':
				if (!dailyCheckbox.recurrenceDate) return '';
				return layout.options.shortMode
					? ' ' + recurrenceDateSymbol
					: ` ${recurrenceDateSymbol} ${dailyCheckbox.recurrenceDate.format(RegularExpressions.dateFormat)}`;
			case 'blockLink':
				return dailyCheckbox.blockLink ?? '';
			default:
				throw new Error(`Don't know how to render task component of type '${component}'`);
		}
	}
	/**
	 * 텍스트를 역직렬화 하여 DailyCheckDetails 정보를 파싱
	 * @param description
	 */
	public deserialize(description: string): DailyCheckDetails {
		const { TaskFormatRegularExpressions } = this.symbols;
		const maxRuns = 20;	// 무한루프가 되지 않도록 최대반복을 설정
		let runs = 0;
		let matched: boolean;
		let doneDate: Moment | null = null;
		let recurrenceRRule: RRule | null = null;
		let recurrenceDate: Moment | null = null;
		let trailingTags = '';	// 태그들은 모든 태스크 구성 요소를 따라갈 필요는 없지만, 결국에는 태스크 설명의 끝에 다시 붙여넣고자 합니다.

		// 역직렬화를 어떤 순서로 해도 특별한 문자열($)을 찾을때까지 계속 매칭하고 제거함. 만약 예상된 순서대로 있다면 루프는 한 번만 실행됨.
		do {
			matched = false;

			const doneDateMatch = description.match(TaskFormatRegularExpressions.doneDateRegex);
			if (doneDateMatch !== null) {
				doneDate = window.moment(doneDateMatch[1], RegularExpressions.dateFormat);
				description = description.replace(TaskFormatRegularExpressions.doneDateRegex, '').trim();
				matched = true;
			}

			const recurrenceMatch = description.match(TaskFormatRegularExpressions.recurrenceRegex);
			if (recurrenceMatch !== null) {


				try {

					new Notice("aaaaaaa111");
					const options = RRule.parseText(recurrenceMatch[1].trim());

					new Notice("aaaaaaa2222");
				}
				catch (error) {
					// 오류 처리
					console.log("null 반환: 예외가 발생했습니다.");
				}


				const options = RRule.parseText(recurrenceMatch[1].trim());






				new Notice("ddddddddddddd");
				if (options !== null)
					recurrenceRRule = new RRule(options);
				else
					new Notice('반복 명령어를 해석할 수 없습니다.', 10000);
				description = description.replace(TaskFormatRegularExpressions.recurrenceRegex, '').trim();
				matched = true;

			}

			const recurrenceDateMatch = description.match(TaskFormatRegularExpressions.recurrenceDateRegex);
			if (recurrenceDateMatch !== null) {
				recurrenceDate = window.moment(recurrenceDateMatch[1], RegularExpressions.dateFormat);
				description = description.replace(TaskFormatRegularExpressions.recurrenceDateRegex, '').trim();
				matched = true;
			}

			const tagsMatch = description.match(RegularExpressions.hashTagsFromEnd);
			if (tagsMatch != null) {
				description = description.replace(RegularExpressions.hashTagsFromEnd, '').trim();
				matched = true;
				const tagName = tagsMatch[0].trim();
				trailingTags = trailingTags.length > 0 ? [tagName, trailingTags].join(' ') : tagName;
			}

			runs++;
		} while (matched && runs <= maxRuns);
		
		if (trailingTags.length > 0) description += ' ' + trailingTags;
		
		return {
			description,
			doneDate,
			recurrenceRRule,
			recurrenceDate,
			tags: DailyCheckbox.extractHashtags(description),
		};
	}
}
