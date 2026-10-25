/** « Pot-au-feu » → « POTAUFEU » : majuscules, sans accents ni ponctuation. */
export function normalize(word: string) {
  return word
    .normalize('NFD')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
}
