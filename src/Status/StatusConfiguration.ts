/**
 * 옵시디언의 구성에 의해 저장되는 객체
 */
export enum StatusType {
	TODO = 'TODO',
	DONE = 'DONE',
	IN_PROGRESS = 'IN_PROGRESS',
	CANCELLED = 'CANCELLED',
	NON_TASK = 'NON_TASK',
	EMPTY = 'EMPTY',
}
export class StatusConfiguration {
	public readonly symbol: string;
	public readonly name: string;
	public readonly nextStatusSymbol: string;
	public readonly availableAsCommand: boolean;
	public readonly type: StatusType;

	constructor(symbol: string, name: string, nextStatusSymbol: string, availableAsCommand: boolean, type: StatusType = StatusType.TODO) {
		this.symbol = symbol;
		this.name = name;
		this.nextStatusSymbol = nextStatusSymbol;
		this.availableAsCommand = availableAsCommand;
		this.type = type;
	}
}
