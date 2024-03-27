function createKey(sessionHandle: string) {
	return `SALAD_SPINNER.${sessionHandle}`;
}

export function savePlayerSession(sessionHandle: string, playerId: number) {
	const key = createKey(sessionHandle);
	if (typeof window !== undefined) {
		window.localStorage.setItem(key, String(playerId));
	}
}

export function getPlayerSession(sessionHandle: string | undefined): number | null {
	if (typeof window === undefined) {
		console.log('Server render');
		return null;
	}
	if (sessionHandle === undefined) {
		return null;
	}
	const storedValue = window.localStorage.getItem(createKey(sessionHandle));
	return storedValue === null
		? null
		: Number(storedValue);
}