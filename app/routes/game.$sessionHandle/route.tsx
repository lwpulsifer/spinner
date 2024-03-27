import { useState, useEffect } from 'react';
import { Form, useParams, useLoaderData, redirect, useActionData } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs, LinksFunction } from "@remix-run/node"; // or cloudflare/deno
import { createGamePlayer, findGameCards, getGamePlayer, getGameSession } from "~/db/game";
import { getPlayerSession, savePlayerSession } from "~/session/gameSession";
import { json } from "@remix-run/node";
import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const userPrefs = createCookie("user-prefs", {
  maxAge: 604_800, // one week
});

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const sessionHandle: string = params?.sessionHandle ?? '';
	const session = await getGameSession(sessionHandle);
	if (!session) {
		return redirect('/');
	}
	const cookieHeader = request.headers.get("Cookie");
  const cookie = (await userPrefs.parse(cookieHeader)) || {};
	const playerId = cookie.playerId;
	let player;
	if (playerId) {
		player = await getGamePlayer(sessionHandle, playerId);
	}
	const cards = await findGameCards(sessionHandle);
	return { cards, player };
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const sessionHandle: string = params?.sessionHandle ?? '';
	const formData = await request.formData();
	const session = await getGameSession(sessionHandle);
	const name = formData.get('name') as string;
	const playerId = await createGamePlayer(session.id, name);
	if (!playerId) {
		return json({ nameExists: true });
	}
	const cookieHeader = request.headers.get("Cookie");
  const cookie = (await userPrefs.parse(cookieHeader)) || {};
	cookie.playerId = playerId;
	return redirect("", {
    headers: {
      "Set-Cookie": await userPrefs.serialize(cookie),
    }
	});
};


export default function Game() {
	const { sessionHandle } = useParams();
	const { cards, player } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const { nameExists } = actionData ?? {};
	
	const playerCreationForm = (
		<Form method="POST">
			<label>
				Player name:
				<input type="text" name="name" required />
				<p style={{ color: 'red' }}>{nameExists ? 'Name already exists' : ''}</p>
			</label>
			<button type="submit">Submit</button>
		</Form>
	)

	return (
		<section className={'bg-orange-500'}>
			<h1>Welcome to Salad Spinner!</h1>
			<a href='/'>New game</a>
			<div>
				Game name: {sessionHandle}
			</div>
			{
				player
					? (
						<div className='bg-grey-50'>
							{`Welcome, Player: ${player.name}`}
						</div>
					)
					: playerCreationForm
			}
		</section>
	)
}