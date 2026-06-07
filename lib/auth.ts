export function verifyTickSecret(request: Request): boolean {
  const header = request.headers.get('authorization');
  if (!header) return false;

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;

  return token === process.env.TICK_SECRET;
}
