import { StatusConfiguration, StatusType } from "./StatusConfiguration";

/**
 * 체크박스가 가질 수 있는 상태를 정의한 클래스
 */
export class Status {
	public readonly configuration: StatusConfiguration;
	public static DONE: Status = Status.makeDone();	//기본 완료 상태
	public static TODO: Status = Status.makeTodo();	//기본 해제 상태
	public static EMPTY: Status = Status.makeEmpty();	//비어 있는 상태, 문제가 있을 때 사용


	constructor(configuration: StatusConfiguration) {
		this.configuration = configuration;
	}


	public get symbol(): string {
		return this.configuration.symbol;
	}
	public get name(): string {
		return this.configuration.name;
	}
	public get nextStatusSymbol(): string {
		return this.configuration.nextStatusSymbol;
	}
	public get availableAsCommand(): boolean {
		return this.configuration.availableAsCommand;
	}
	public get type(): StatusType {
		return this.configuration.type;
	}


	static makeDone(): Status {
		return new Status(new StatusConfiguration('x', 'Done', ' ', true, StatusType.DONE));
	}
	static makeTodo(): Status {
		return new Status(new StatusConfiguration(' ', 'Todo', 'x', true, StatusType.TODO));
	}
	static makeEmpty(): Status {
		return new Status(new StatusConfiguration('', 'EMPTY', '', true, StatusType.EMPTY));
	}
	static makeInProgress(): Status {
		return new Status(new StatusConfiguration('/', 'In Progress', 'x', true, StatusType.IN_PROGRESS));
	}
	static makeCancelled(): Status {
		return new Status(new StatusConfiguration('-', 'Cancelled', ' ', true, StatusType.CANCELLED));
	}
	static createUnknownStatus(unknownSymbol: string) {
		return new Status(new StatusConfiguration(unknownSymbol, 'Unknown', 'x', false, StatusType.TODO));
	}


	/**
	 * 체크박스가 완료(DONE)되었는지 확인하는 함수 
	 * @returns
	 */
	public isCompleted(): boolean {
		return this.type === StatusType.DONE;
	}
	/**
	 * 파라미터에 들어오는 상태와 비교합니다.
	 * 어떤 필드라도 차이점이 있으면 false, 차이점이 없으면 true를 반환
	 * @param other
	 * @returns
	 */
	public identicalTo(other: Status): boolean {
		const args: Array<keyof StatusConfiguration> = [
			'symbol',
			'name',
			'nextStatusSymbol',
			'availableAsCommand',
			'type',
		];
		for (const el of args) {
			if (this[el] !== other[el]) return false;
		}
		return true;
	}
}
