import type { Moment } from 'moment';
import { Notice } from 'obsidian';
import { RRule } from 'rrule';

/**
 * 체크박스를 설정한 요일에 반복적으로 체크가 해제되도록 만들기 위한 구성 요소 (나중에 필요한거 보고 좀 더 추가해야 할듯.....)
 */
export class Recurrence {
	//초기화 되는 날짜 정보
	public readonly rrule: RRule;
	//체크박스를 체크한 날짜
	public readonly referenceDate: Moment | null;
	//체크박스를 초기화 하는 날짜
	public readonly recurrenceDate: Moment | null;


	constructor({ rrule, referenceDate, recurrenceDate }: { rrule: RRule; referenceDate: Moment | null; recurrenceDate: Moment | null; }) {
		this.rrule = rrule;
		this.referenceDate = referenceDate;
		this.recurrenceDate = recurrenceDate;
	}


	/**
	 * 매개변수의 텍스트로 Recurrence 객체를 생성하기 위한 static 함수
	 * @param param0
	 * @returns
	 */
	public static fromText({ recurrenceRuleText, doneDate, recurrDate }: { recurrenceRuleText: string; doneDate: Moment | null; recurrDate: Moment | null; }): Recurrence | null {
		try {
			//들어온 텍스트가 정상적인지 한번 더 필터링
			const match = recurrenceRuleText.match(/^([a-zA-Z0-9, !]+?)( when done)?$/i);
			if (match == null) {
				return null;
			}
			//들어오는 텍스트를 자연어로 처리하여 반복 요일 생성
			const options = RRule.parseText(match[1].trim());

			if (options !== null) {
				// 체크박스를 체크한 날짜
				let referenceDate: Moment | null = null;
				// 초기화되는 날짜
				let recurrenceDate: Moment | null = null;

				if (doneDate) {
					referenceDate = window.moment(doneDate);
				}
				if (recurrenceDate) {
					recurrenceDate = window.moment(recurrDate);
				}

				//옵션에 반복을 시작하는 날짜(체크박스를 체크한 날짜)의 시작 시간을 입력, 체크를 안했다면 오늘 날짜의 시작 시간을 입력
				if (referenceDate !== null) {
					options.dtstart = window.moment(referenceDate).startOf('day').toDate();
				} else {
					options.dtstart = window.moment().startOf('day').toDate();
				}

				const rrule = new RRule(options);
				return new Recurrence({
					rrule,
					referenceDate,
					recurrenceDate
				});
			}
			else {
				const msg =
					'반복 명령어를 해석할 수 없습니다.';
				console.warn(msg);
				new Notice(msg, 10000);
				return null;
			}
		}
		catch (e) {
			// 반복 규칙을 읽을 수 없음. 사용자가 아직 입력을 마치지 않았을 수 있음. 테스트 파일이 window.moment를 설정하지 않은 경우에 유용하므로 오류 메시지를 출력합니다.
			if (e instanceof Error) {
				console.log("Recurrence Error : " + e.message);
			}
			return null;
		}
	}
	/**
	 * 다음 
	 * @returns
	 */
	public next(): Moment | null { //일반 task는 recurrence를 만드는 순간부터 이미 due, start 가 이미 만들어저있기 때문에 가능했다. 즉 우리는 바꿔야한다.
		const next = this.nextReferenceDate();

		if (next !== null) {
			let recurrenceDate: Moment | null = null;
			if (this.referenceDate) {
				if (this.recurrenceDate) {
					const originalDifference = window.moment.duration(this.recurrenceDate.diff(this.referenceDate));

					// Cloning so that original won't be manipulated:
					recurrenceDate = window.moment(next);
					// Rounding days to handle cross daylight-savings-time recurrences.
					recurrenceDate.add(Math.round(originalDifference.asDays()), 'days');
				}
			}

			return recurrenceDate;
		}

		return null;
	}
	/**
	 * 다음 초기화 날짜를 반환
	 * @returns
	 */
	public nextReferenceDate(): Date {
		////현재 날짜를 기준으로 다음 초기화 날짜를 확인
		//const ruleBasedOnToday = new RRule({
		//	...this.rrule.origOptions,
		//	dtstart: window.moment().startOf('day').toDate()
		//});
		//return this.nextAfter(window.moment().endOf('day'), ruleBasedOnToday).toDate();
		////이거 return this.nextAfter(window.moment().endOf('day'), rrule).toDate(); 해도 되는거 아니야? 나중에 다 만들고 확인해보기

		const after = window.moment(this.referenceDate ?? undefined).endOf('day');	//done 날짜를 기준(없을경우 현재 기준)으로 설정했음. !!!완성 후 정상이면 위 주석 삭제, 비정상이면 위 주석껄로 해보기
		return this.nextAfter(after, this.rrule).toDate();
	}
	/**
	 * 파라미터의 rrule의 기반으로 after의 다음 초기화 날짜를 반환하는 함수
	 * 계속적기
	 * @param after
	 * @param rrule
	 * @returns
	 */
	private nextAfter(after: Moment, rrule: RRule): Moment {
		// 표준 시간대를 고려하지않고 utc로 계산한다는데 맞어?
		//let next = window.moment(rrule.after(after.toDate()));
		let next = window.moment(rrule.after(after.toDate())).subtract(9, 'hours');	//rrule이 무조건 utc로 계산하기때문에 -9시 함
		const asText = this.rrule.toText();

		// 매달 반복되는 일이라면 따로 세팅해줘야함
		const monthMatch = asText.match(/every( \d+)? month(s)?(.*)?/);
		if (monthMatch !== null) {
			new Notice('asd');
			// 'every month on the 31st' 같이 날짜를 정하는 경우
			if (!asText.includes(' on ')) {
				next = Recurrence.nextAfterMonths(after, next, rrule, monthMatch[1]);
			}
		}

		// 매년 반복되는 일이라면 따로 세팅해줘야함
		const yearMatch = asText.match(/every( \d+)? year(s)?(.*)?/);
		if (yearMatch !== null) {
			next = Recurrence.nextAfterYears(after, next, rrule, yearMatch[1]);
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

		while (Recurrence.isSkippingTooManyMonths(after, next, parsedSkippingMonths)) {
			next = Recurrence.fromOneDayEarlier(after, rrule);
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

		while (Recurrence.isSkippingTooManyYears(after, next, parsedSkippingYears)) {
			next = Recurrence.fromOneDayEarlier(after, rrule);
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
}
