import { alphabetModel, cardGameModel } from '../src';

describe('Models', () => {
  it('should export card game and alphabet models', () => {
    expect(alphabetModel).toBeTruthy();
    expect(cardGameModel).toBeTruthy();
  });
});
