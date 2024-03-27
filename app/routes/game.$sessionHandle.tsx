import { useState, useEffect } from 'react';
import { Form, useParams, useLoaderData, redirect, useActionData } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno
import { createGamePlayer, findGameCards, getGameSession } from "~/db/game";
import { getPlayerSession, savePlayerSession } from "~/session/gameSession";
import { json } from "@remix-run/node";

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const sessionHandle: string = params?.sessionHandle ?? '';
	const session = await getGameSession(sessionHandle);
	if (!session) {
		return redirect('/');
	}
	const cards = findGameCards(sessionHandle);
	return cards;
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const sessionHandle: string = params?.sessionHandle ?? '';
	const formData = await request.formData();
	const session = await getGameSession(sessionHandle);
	const name = formData.get('name') as string;
	const playerId = await createGamePlayer(session.id, name);
	if (playerId === null) {
		return json({ playerId: null, name, nameExists: true });
	} 
	return json({ name, playerId, nameExists: false });
};

export default function Game() {
	const { sessionHandle } = useParams();
	const cards = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const [savedPlayerId, setSavedPlayerId] = useState<number | null>(null);
	const { name, playerId: formPlayerId, nameExists } = actionData ?? {};
	const playerId = savedPlayerId ?? formPlayerId;

	useEffect(() => {
		if (formPlayerId && sessionHandle) {
			savePlayerSession(sessionHandle, formPlayerId);
		}
	}, [formPlayerId])

	useEffect(() => {
		setSavedPlayerId(getPlayerSession(sessionHandle as string));
	}, [sessionHandle]);

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
		<section>
			<h1>Welcome to Salad Spinner!</h1>
			<a href='/'>New game</a>
			<div>
				Game name: {sessionHandle}
			</div>
			{
				playerId
					? (
						<>
							<div>
								Welcome, {name}
							</div>
							<div>
								Cards: {JSON.stringify(cards)}
							</div>
						</>
					)
					: playerCreationForm
			}
		</section>
	)
}