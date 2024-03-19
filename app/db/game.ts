import { supabase } from "./supabase";
import type { Card } from '../game/cards.js'

export async function createGameSession(session_handle: string, cards: Card[]) {
	console.log("Creating game session");
	const sessionResponse = await supabase.from("game_sessions")
	.insert([{ session_handle }])
	.select('id')
	.single();
	await supabase.from("session_cards").insert(cards);
	return sessionResponse.data?.id;
}

export async function createGamePlayer(sessionId: number, playerName: string) {
	const currentPlayers = await supabase.from('players')
		.select()
		.eq('name', playerName)
		.eq('session_id', sessionId);
	if (currentPlayers.data?.length) {
		return null;
	}
	const response = await supabase.from('players')
	.insert([{ session_id: sessionId, name: playerName }])
	.select('player_id')
	.single();
	return response.data?.player_id;
}

export async function getGameSession(sessionHandle: string) {
	const sessionResponse = await supabase.from('game_sessions').select().eq('session_handle', sessionHandle).single();
	return sessionResponse?.data;
}

export async function findGameCards(session_handle: string) {
	const session = await getGameSession(session_handle);
	if (!session) {
		return [];
	}
	const cardsResponse = await supabase.from("session_cards").select().eq('session_id', session.id);
	return cardsResponse.data;
}