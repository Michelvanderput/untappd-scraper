import type { BeerData } from '../types/beer';

/** Fruitbier (incl. kriek, framboise, fruited sours, radler): wie dit draait moet een adtje doen */
export const isFruitBeer = (beer: BeerData): boolean =>
  /fruit|kriek|framboise|radler|shandy/i.test(`${beer.style ?? ''} ${beer.subcategory ?? ''}`);
