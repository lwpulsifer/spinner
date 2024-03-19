import { useState } from 'react';
import type { MetaFunction } from "@vercel/remix";
import { DECK } from "~/game/cards";
import { createGameSession, createGamePlayer } from '~/db/game';
import { redirect } from "@remix-run/node";
import { savePlayerSession } from '~/session/gameSession';
import { Form, useParams, useLoaderData, redirect, useActionData } from "@remix-run/react";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const sessionHandle = formData.get("name");
  const cards = formData.get("cards");
  const sessionId = await createGameSession(sessionHandle, cards);
  if (!sessionId) {
    throw 'No data';
  }
  return redirect(`/game/${sessionHandle}`);
}
export const meta: MetaFunction = () => {
  return [
    { title: "Salad Spinner" },
    { name: "Salad Spinner game", content: "Enjoy :)" },
  ];
};

export default function Index() {
  const [cards, setCards] = useState(DECK);

  const cardInputs = cards.map((card, i) => {
    const { scoringType, type, params } = card;
    return (
      <li key={i}>
        <div>
          Type: {type}
        </div>
        <div>
          Scoring type: {scoringType}
        </div>
        <div>
          Params: {JSON.stringify(params)}
        </div>
      </li>
    )
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Salad Spinner</h1>
      <Form method="POST">
        <label>
          Game name:
          <input type="text" name="name" required />
        </label>
        {cardInputs}
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
