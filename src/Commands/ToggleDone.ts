//import { Editor, MarkdownView, type EditorPosition, type MarkdownFileInfo, Notice } from 'obsidian';
import { Editor, MarkdownView, type MarkdownFileInfo, Notice } from 'obsidian';


/**
 * 옵시디언 command(Ctrl+P)에 추가 할 커맨드
 * @param checking
 * @param editor
 * @param view
 * @returns
 */
export const toggleDone = (checking: boolean, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
	//마크다운 보기에 있지 않으면 명령이 표시되지 않아야 함.
	if (checking) {
		if (!(view instanceof MarkdownView)) {
			return false;
		}
		// 다음과 같은 상황에서만 트리거 된다 : 
		// - Convert lines to list items.
		// - Convert list items to tasks.
		// - Toggle tasks' status.
		return true;
	}

	//현재 보고있는 파일의 경로를 확인
	const path = view.file?.path;
	if (path === undefined) {
		return;
	}

	const origCursorPos = editor.getCursor();
	const lineNumber = origCursorPos.line;
	const line = editor.getLine(lineNumber);


	new Notice("완료!!");


	//const insertion = toggleLine(line, path);
	//editor.setLine(lineNumber, insertion.text);


	////커서 위치는 line, ch 오프셋 모두 0을 기준으로 한다.
	////"ch" 오프셋이 줄 길이보다 크면 다음 줄로 계속 이동합니다.
	////기본적으로 "editor.setLine()"은 커서가 이미 줄 끝에 있는 경우 커서를 줄 끝에 유지합니다,
	////또는 커서가 다른 곳에 있으면 처음으로 이동합니다.Licat은 이를 Discord에서 한 쪽 또는 다른 쪽에 "고착"된다고 설명했습니다.
	//editor.setCursor(getNewCursorPosition(origCursorPos, insertion));
};
