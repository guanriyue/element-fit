export const isNumber = (n: unknown): n is number => {
  return typeof n === 'number';
}
