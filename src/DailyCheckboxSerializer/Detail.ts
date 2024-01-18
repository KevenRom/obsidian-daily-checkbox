import { DailyCheckbox } from "../DailyCheckbox";


type Writeable<T> = { -readonly [P in keyof T]: T[P] };	//제네릭 타입 T를 받아 T의 모든 속성에서 읽기 전용에서 쓰기 가능한 속성으로 변환하는 작업
export type DailyCheckDetails = Writeable<
	Pick<
		DailyCheckbox,
		| 'description'
		| 'doneDate'
		| 'recurrenceRRule'
		| 'recurrenceDate'
		| 'tags'
	>
>;


/**
 * DailyCheckbox가 파일에서 어떻게 읽혀지고 작성되는지를 관리하는 인터페이스.
 * 체크박스 문자를 제외한 텍스트인 body 텍스트만 책임을 짐
 */
export interface DailyCheckboxSerializer {
	deserialize(line: string): DailyCheckDetails;
	serialize(task: DailyCheckbox): string;
}
