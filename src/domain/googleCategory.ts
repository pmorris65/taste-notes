import type { Category } from './types';

const CAFE = new Set(['cafe', 'coffee_shop', 'tea_house', 'bakery', 'cat_cafe', 'dog_cafe', 'dessert_shop', 'ice_cream_shop']);
const BAR = new Set([
  'bar',
  'pub',
  'wine_bar',
  'night_club',
  'cocktail_bar',
  'lounge_bar',
  'sports_bar',
  'irish_pub',
  'beer_garden',
  'brewpub',
]);
const RESTAURANT = new Set([
  'restaurant',
  'meal_takeaway',
  'meal_delivery',
  'food_court',
  'diner',
  'bar_and_grill',
  'cafeteria',
  'deli',
]);
const SHOP = new Set(['store', 'supermarket', 'shopping_mall', 'market', 'grocery_store', 'department_store']);

function classify(type: string): Category | null {
  if (CAFE.has(type)) return 'cafe';
  if (BAR.has(type)) return 'bar';
  if (RESTAURANT.has(type) || type.endsWith('_restaurant')) return 'restaurant';
  if (SHOP.has(type) || type.endsWith('_store') || type.endsWith('_shop')) return 'shop';
  return null;
}

/** Maps Google Places types (most specific first) to the app's categories. */
export function categoryFromGoogleTypes(primaryType: string | undefined, types: string[] = []): Category {
  for (const type of [primaryType, ...types]) {
    const category = type ? classify(type) : null;
    if (category) return category;
  }
  return 'other';
}
