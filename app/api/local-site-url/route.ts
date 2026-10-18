import { networkInterfaces } from 'node:os';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map(Number);
  return (
    octets.length === 4 &&
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168))
  );
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'LAN address is only available in development.' },
      { status: 404 },
    );
  }

  const addresses = Object.entries(networkInterfaces()).flatMap(
    ([interfaceName, entries]) =>
      (entries ?? [])
        .filter(
          (entry) =>
            entry.family === 'IPv4' &&
            !entry.internal &&
            isPrivateIpv4(entry.address),
        )
        .map((entry) => ({
          interfaceName,
          address: entry.address,
        })),
  );

  addresses.sort((first, second) => {
    const rank = (interfaceName: string) =>
      /^en0$/i.test(interfaceName)
        ? 0
        : /wi-?fi|wlan/i.test(interfaceName)
          ? 1
          : 2;
    return rank(first.interfaceName) - rank(second.interfaceName);
  });

  const lanAddress = addresses[0]?.address;
  if (!lanAddress) {
    return NextResponse.json(
      { error: 'No local Wi-Fi IPv4 address was found.' },
      { status: 503 },
    );
  }

  const requestUrl = new URL(request.url);
  const siteUrl = new URL(
    '/wish',
    `${requestUrl.protocol}//${lanAddress}${requestUrl.port ? `:${requestUrl.port}` : ''}`,
  );

  return NextResponse.json(
    { siteUrl: siteUrl.toString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
