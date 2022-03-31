import type { NextRequest } from 'next/server';
import middleware from 'lib/middleware';

// eslint-disable-next-line
export default async function (req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return middleware(req);
}
