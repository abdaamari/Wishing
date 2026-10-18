import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

type QRCodeProps = {
  url: string;
  size?: number;
};

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  return <QRCodeSVG value={url} size={size} level="M" includeMargin={true} />;
}
