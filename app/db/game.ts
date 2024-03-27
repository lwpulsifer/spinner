import { supabase } from "./supabase";
import { createDeck, type Card } from '../game/cards.js'

type Player = {
	name: string,
	player_id: number,
	lead_player: boolean,
};

export async function createGameSession(session_handle: string, cards: Card[]) {
	const sessionResponse = await supabase.from("game_sessions")
	.insert([{ session_handle }])
	.select('id')
	.single();
	const res = await supabase.from("session_cards").insert(createDeck(cards));
	if (res.error) {
		console.error('Failed inserting cards');
	}
	return sessionResponse.data?.id;
}

export async function createGamePlayer(sessionId: number, playerName: string) {
	const currentPlayers = await supabase.from('players')
		.select()
		.eq('session_id', sessionId);
	const players = currentPlayers.data ?? [];
	const playersWithSameName = players.filter(player => player.name === playerName);
	if (playersWithSameName.length) {
		return null;
	}
	const response = await supabase.from('players')
	.insert([{ session_id: sessionId, name: playerName, lead_player: players.length === 0 }])
	.select('player_id')
	.single();
	return response.data?.player_id;
}

export async function getGamePlayer(session_handle: string, playerId: number) {
	const session = await getGameSession(session_handle);
	console.log(session.id);
	console.log(playerId);
	const response = await supabase.from('players')
		.select()
		.eq('session_id', session.id)
		.eq('player_id', playerId)
		.single();
	return response.data as Player;
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