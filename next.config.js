const { networkInterfaces } = require('node:os');

const isPrivateIpv4 = (address) => {
  const octets = address.split('.').map(Number);
  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
};

const allowedDevOrigins = Object.values(networkInterfaces())
  .flatMap((entries) => entries ?? [])
  .filter(
    (entry) =>
      entry.family === 'IPv4' &&
      !entry.internal &&
      isPrivateIpv4(entry.address),
  )
  .map((entry) => entry.address);

module.exports = {
  allowedDevOrigins,
  reactStrictMode: true,
};
