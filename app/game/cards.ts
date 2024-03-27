import { scoringTypesToRules } from './cards';
const CardTypeMap = {
	A: 'A' as CardType,
	B: 'B' as CardType,
	C: 'C' as CardType,
	D: 'D' as CardType,
	E: 'E' as CardType,
	F: 'F' as CardType,
}
const CardTypes = Array.from(Object.values(CardTypeMap));
type CardType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

type ScoringType = 'FEWEST_OF_TYPE' | 'MOST_OF_TYPE' | 'TYPES_WITH_AT_LEAST' 
| 'TYPES_WITH_AT_MOST' | 'SET_OF_TYPES' | 'MOST_TOTAL' | 'LEAST_TOTAL' | 'POINTS_PER_TYPE';

type ScoringRule = (hand: Array<Card>, otherHands: Array<Array<Card>>) => number;
type ScoringRuleFactory = (...args: any[]) => ScoringRule;

export type Card = {
	type: CardType,
	scoringType: ScoringType,
	params: any,
}

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);

const fewestOfType = ({ type, value }: { type: CardType, value: number }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	const cardsOfType = (hand: Array<Card>) => hand.filter(card => card.type === type).length;
	return otherHands.find(otherHand => cardsOfType(otherHand) >= cardsOfType(hand)) === null
		? value
		: 0;
};

const mostOfType = ({ type, value }: { type: CardType, value: number }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	const cardsOfType = (hand: Array<Card>) => hand.filter(card => card.type === type).length;
	return otherHands.find(otherHand => cardsOfType(otherHand) <= cardsOfType(hand)) === null
		? value
		: 0;
}

const typesWithAtLeast = ({ atLeast, value }: { atLeast: number, value: number }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	return Object.entries(groupBy(hand, hand => hand.type)).filter(([type, cardsOfType]) => cardsOfType.length >= atLeast).length * value;
}

const typesWithAtMost = ({ atMost, value }: { atMost: number, value: number }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	return Object.entries(groupBy(hand, hand => hand.type)).filter(([type, cardsOfType]) => cardsOfType.length <= atMost).length * value;
}

const setOfTypes = ({ types, value }: { types: Partial<{ [k in CardType]: number }>, value: number }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	let retValue = 0;
	const groups = groupBy(hand, hand => hand.type);
	const groupCounts = Object.fromEntries(Object.entries(groups).map(([ type, cardsOfType]) => ([type, cardsOfType.length])));
	while (true) {
	  for (let [type, setCount] of Object.entries(groupCounts)) {
			groupCounts[type] -= setCount;
			if (groupCounts[type] < 0) {
				break;
			}
		}
		retValue += value;
	}
	return retValue;
}

const mostTotal = ({ value } : { value: number }) =>  (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	return otherHands.find(otherHand => otherHand.length >= hand.length) === null
		? value
		: 0;
}

const leastTotal = ({ value } : { value: number }) =>  (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	return otherHands.find(otherHand => otherHand.length <= hand.length) === null
		? value
		: 0;
}

const evenOdd = ({ type, values: [evenVal, oddVal ]} : { type: CardType, values: [number, number] }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	return hand.filter(card => card.type === type).length % 2 === 0 ? evenVal : oddVal;
};

const pointsPerType = ({ typeValues }: { typeValues: Partial<{ [k in CardType]: number }> }) => (hand: Array<Card>, otherHands: Array<Array<Card>>) => {
	let retValue = 0;
	const groups = groupBy(hand, hand => hand.type);
	const groupCounts = Object.fromEntries(Object.entries(groups).map(([ type, cardsOfType]) => ([type, cardsOfType.length])));
	Object.entries(typeValues).forEach(([type, value]) => {
		retValue += value * groupCounts[type];
	});
	return retValue;
}

export const scoringTypesToRules: { [k in ScoringType]: ScoringRuleFactory } = {
	'FEWEST_OF_TYPE': fewestOfType,
	'MOST_OF_TYPE': mostOfType,
	'TYPES_WITH_AT_LEAST': typesWithAtLeast,
  'TYPES_WITH_AT_MOST': typesWithAtMost,
	'SET_OF_TYPES': setOfTypes,
	'MOST_TOTAL': mostTotal,
	'LEAST_TOTAL': leastTotal,
	'POINTS_PER_TYPE': pointsPerType,
}

export const DECK: Array<Card> = [

	{ type: CardTypeMap.A, scoringType: "MOST_TOTAL", params: { value: 10 } },
	{ type: CardTypeMap.B, scoringType: 'LEAST_TOTAL', params: { value: 7 }},
	{ type: CardTypeMap.C, scoringType: 'TYPES_WITH_AT_LEAST', params: { atLeast: 2, value: 3 }},
	{ type: CardTypeMap.D, scoringType: 'TYPES_WITH_AT_LEAST', params: { atLeast: 3, value: 5 }},
	{ type: CardTypeMap.E, scoringType: 'SET_OF_TYPES', params: { types: Object.fromEntries(Object.keys(scoringTypesToRules).map(t => [t, 1])), value: 12 }},
	{ type: CardTypeMap.F, scoringType: 'TYPES_WITH_AT_MOST', params: { atMost: 0, value: 5 }},

	

	// // 6 Fewest of type.
	// ...CardTypes.map(type => ({ type, rule: [ fewestOfType({ type, value: 7 }) ] })),

	// // 6 Most of type.
	// ...CardTypes.map(type => ({ type, rule: [ mostOfType({ type, value: 7 }) ]})),

	// // 6 Even-odd total cards
	// ...CardTypes.map(type => ({ type, rule: [ evenOdd({ type, values: [7, 3] }) ]})),

	// // TODO 12 pairs of different types, 5 points each

	// // 6 for pairs of the same type
	// ...CardTypes.map(type => ({ type, rule: [ setOfTypes({ types: { [type]: 2 }, value: 5 }) ]})),

	// // 6 for 3 of the same type
	// ...CardTypes.map(type => ({ type, rule: [ setOfTypes({ types: { [type]: 3 }, value: 5 }) ]})),

	// // TODO 12 for 3 of all different types.

	// // TODO 12 1/1 point cards

	// // 6 3/-2 point cards

	// // 6 2-point cards
	// ...CardTypes.map(type => ({ type, rule: [ setOfTypes({ types: { [type]: 1 }, value: 2}) ]})),

	// // TODO 6 2/1/-2 cards

	// // TODO 6 4/-2/-2 cards

	// // TODO 6 2/2/-4 cards

	// // TODO 6 3/-1/-1 cards
];

function convertToSnakeCase(obj: Object) {
  const snakeCaseObj = {};

  for (const key in obj) {
    let snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    snakeCaseObj[snakeCaseKey] = obj[key];
  }

  return snakeCaseObj;
}

function shuffleArray<T>(array: Array<T>): Array<T> {
	const ret = [...array];
	for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
	}
	return ret;
}

export function createDeck(cards: Array<Card>) {
	return shuffleArray(cards).map((card, i) => {
		return {
			...convertToSnakeCase(card),
			order: i,
			deck_index: i % 3,
		};
	});
}