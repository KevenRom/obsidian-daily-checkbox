import { Status } from "./Status";
import { StatusConfiguration, StatusType } from "./StatusConfiguration";


/**
 * 체크박스가 가질 수 있는 상태를 추적하기 위한 클래스
 */
export class StatusRegistry {
	private static instance: StatusRegistry;
	private _registeredStatuses: Status[] = [];


	/**
	 * 이 클래스는 체크박스의 상태를 생성하고 사용하기 위한 클래스입니다.
	 * 또한 기본 done, empty, todo 상태는 기본으로 등록되어있습니다.
	 */
	public constructor() {
		this.addDefaultStatusTypes();
	}


	/**
	 * 생성자로 기본 상태 추가하는 함수
	 */
	private addDefaultStatusTypes(): void {
		const defaultStatuses = [Status.makeTodo(), Status.makeInProgress(), Status.makeDone(), Status.makeCancelled()];

		defaultStatuses.forEach((status) => {
			this.add(status);
		});
	}
	/**
	 * 새 상태를 추가해주는 함수
	 * @param status
	 */
	public add(status: StatusConfiguration | Status): void {
		if (!this.hasSymbol(status.symbol)) {
			if (status instanceof Status) {
				this._registeredStatuses.push(status);
			} else {
				this._registeredStatuses.push(new Status(status));
			}
		}
	}
	/**
	 * 싱글턴 패턴
	 * @returns
	 */
	public static getInstance(): StatusRegistry {
		if (!StatusRegistry.instance) {
			StatusRegistry.instance = new StatusRegistry();
		}
		return StatusRegistry.instance;
	}
	/**
	 * symbolToFind 매개변수로_registeredStatuses 배열 안에 해당 Symbol이 존재하는지 여부를 true 또는 false로 반환
	 * @param symbolToFind
	 * @returns
	 */
	private hasSymbol(symbolToFind: string): boolean {
		return (
			this._registeredStatuses.find((element) => {
				return element.symbol === symbolToFind;
			}) !== undefined
		);
	}
	/**
	 * symbolToFind 매개변수로_registeredStatuses 배열 안에 찾아 첫 번째 것을 반환
	 * @param symbolToFind
	 * @returns
	 */
	private getSymbol(symbolToFind: string): Status {
		return this._registeredStatuses.filter(({ symbol }) => symbol === symbolToFind)[0];
	}
	/**
	 * 체크박스 심볼에 따라 등록된 상태를 반환합니다. 없을경우 새로운 unknown 상태 생성
	 * @param symbol
	 * @returns
	 */
	public bySymbolOrCreate(symbol: string): Status {
		if (this.hasSymbol(symbol)) {
			return this.getSymbol(symbol);
		}
		return Status.createUnknownStatus(symbol);
	}
	/**
	 * 체크박스 심볼에 따라 등록된 상태를 반환합니다. 없을경우 empty 반환
	 * @param symbol
	 * @returns
	 */
	public bySymbol(symbol: string): Status {
		if (this.hasSymbol(symbol)) {
			return this.getSymbol(symbol);
		}

		return Status.EMPTY;
	}
	/**
	 * 다음 상태가 존재한다면 다음 상태를 반환하고, 없을경우 새로운 todo 상태를 생성한다.
	 * @param status
	 * @returns
	 */
	public getNextStatusOrCreate(status: Status): Status {
		const nextStatus = this.getNextStatus(status);
		if (nextStatus.type !== StatusType.EMPTY) {
			return nextStatus;
		}
		//등록되지 않은 심볼이기 때문에 Unknown 상태를 만듭니다.
		return Status.createUnknownStatus(status.nextStatusSymbol);
	}
	/**
	 * 다음 상태를 반환. 없을경우 Status.EMPTY를 반환
	 * @param status
	 * @returns
	 */
	public getNextStatus(status: Status): Status {
		if (status.nextStatusSymbol !== '') {
			const nextStatus = this.bySymbol(status.nextStatusSymbol);
			if (nextStatus !== null) {
				return nextStatus;
			}
		}
		return Status.EMPTY;
	}
}
