'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface UpiQrCodeProps {
  value: string
  size?: number
}

export default function UpiQrCode({ value, size = 130 }: UpiQrCodeProps) {
  return (
    <div className="p-2.5 bg-white rounded-xl border border-slate-200 inline-block shadow-xs">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={false}
      />
    </div>
  )
}
