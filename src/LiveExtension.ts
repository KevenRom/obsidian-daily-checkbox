import { EditorView,  } from '@codemirror/view';
import type { PluginValue } from '@codemirror/view';
import { Notice } from 'obsidian';
import { DailyCheckbox } from './DailyCheckbox';


export class LiveExtension implements PluginValue {
	private readonly view: EditorView;


	constructor(view: EditorView) {
		this.view = view;
		this.handleClickEvent = this.handleClickEvent.bind(this);
		this.view.dom.addEventListener('click', this.handleClickEvent);
	}
	public destroy(): void {
		this.view.dom.removeEventListener('click', this.handleClickEvent);
	}


	private handleClickEvent(event: MouseEvent): boolean {
		//클릭이 체크박스에서만 동작하도록 확인하는 if
		if (!event.target || !(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') {
			return false;
		}
		//옵시디언 API는 콜아웃, 테이블 등 렌더링된 위젯 안에서 체크박스 클릭을 처리하는 방법을 제공하고 있지 않음.
		//this.view.posAtDOM은 위젯 내부에서 어떤 클릭을 해도 위젯의 시작 위치로 반환하기 때문
		//때문에 Notice 기능으로 오류 메시지 팝업을 생성하고, 콘솔 경고를 로깅한 후 반환
		const ancestor = event.target.closest('ul.plugin-tasks-query-result, div.callout-content');
		if (ancestor) {
			if (ancestor.matches('div.callout-content')) {
				const msg =
					'렌더링된 위젯 안에서는 dailycheckbox가 작동하지 않습니다.';
				console.warn(msg);
				new Notice(msg, 10000);
			}
			return false;
		}
		//이벤트 동작을 방지하여, 체크박스의 작동을 멈추고 온전히 우리의 플러그인만으로 처리시키기 위한 함수
		event.preventDefault();

		//체크박스의 텍스트를 역직렬화하여 DailyCheckbox 객체 만들기
		const state = this.view.state;	//에디터의 내용, 텍스트, 커서위치 등 에디터의 현재 상태에 대한 정보가 담겨있는 객체
		const position = this.view.posAtDOM(event.target);	//마우스 클릭한 위치
		const line = state.doc.lineAt(position);	//에디터 전체 문서중에 클릭한 위치의 텍스트를 추출
		const task = DailyCheckbox.fromLine({
			line: line.text
		});
		if (task === null) {
			new Notice('not task(만약 이게 나온다면 증상 확인하고 수정)');
			return false;
		}
		
		// 체크박스를 클릭했기때문에 daiycheckbox를 토글하고 토글된 daiycheckbox를 텍스트로 추출
		const toggledString = task.toggle().toFileLineString();

		//토글된 텍스트를 문서에 업데이트 하기 위해 dispatch 함수 사용
		const transaction = state.update({
			changes: {
				from: line.from,
				to: line.to,
				insert: toggledString,
			}
		});
		requestAnimationFrame(() => {	//그냥 dispatch를 하면 에디터 렌더링에서 체크박스가 제대로 표시되지 않기 때문에 requestAnimationFrame을 사용하여 다음 렌더링 사이클에 작동하도록 설정
			this.view.dispatch(transaction);
		});

		return true
	}
}
