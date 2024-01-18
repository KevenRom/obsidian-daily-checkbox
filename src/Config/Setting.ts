export interface Settings {
	globalTag: string;
}
const defaultSettings: Settings = {
	globalTag: ''
};

let settings: Settings = { ...defaultSettings };

//export 함수를 파일 밖에서도 사용할 수 있게 만듬
// => 변수가 함수의 이름을 대신하게 되고, 이 변수를 사용해서 함수의 기능을 실행할 수 있게 해줌
// ...변수 변수를 바로 대입하지않고 복사한 다음 다른 요소와 오버라이드하여 대입됨
export function getSettings(): Settings
{
	return settings;
}

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
	settings = { ...settings, ...newSettings };

	return getSettings();
};
