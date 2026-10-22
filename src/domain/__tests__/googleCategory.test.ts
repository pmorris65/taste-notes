import { categoryFromGoogleTypes } from '../googleCategory';

describe('categoryFromGoogleTypes', () => {
  it.each([
    ['italian_restaurant', [], 'restaurant'],
    ['restaurant', [], 'restaurant'],
    ['coffee_shop', ['cafe', 'store'], 'cafe'],
    ['bakery', ['food', 'store'], 'cafe'],
    ['pub', ['bar', 'restaurant'], 'bar'],
    ['book_store', ['store'], 'shop'],
    ['supermarket', ['grocery_store', 'food'], 'shop'],
    ['park', ['point_of_interest'], 'other'],
  ] as const)('%s → %s', (primary, types, expected) => {
    expect(categoryFromGoogleTypes(primary, [...types])).toBe(expected);
  });

  it('falls back to the other types when the primary type is generic', () => {
    expect(categoryFromGoogleTypes('point_of_interest', ['establishment', 'sushi_restaurant'])).toBe('restaurant');
  });

  it('handles a missing primary type', () => {
    expect(categoryFromGoogleTypes(undefined, ['wine_bar'])).toBe('bar');
    expect(categoryFromGoogleTypes(undefined)).toBe('other');
  });
});
