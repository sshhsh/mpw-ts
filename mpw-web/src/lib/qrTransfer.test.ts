import { describe, expect, it } from 'vitest'

import { createQrFrames, QrFrameCollector } from './qrTransfer'

describe('QR transfer framing', () => {
  it('reassembles shuffled and duplicated frames', () => {
    const frames = createQrFrames('abcdefghijklmnopqrstuvwxyz', 100)
    const collector = new QrFrameCollector()
    const order = [...frames].reverse()
    let result: string | undefined

    for (const frame of [...order, order[0]]) {
      result = collector.add(frame).complete ?? result
    }

    expect(result).toBe('abcdefghijklmnopqrstuvwxyz')
  })

  it('rejects frames from a different batch', () => {
    const first = new QrFrameCollector()
    const second = createQrFrames('second', 100)[0]
    first.add(createQrFrames('first', 100)[0])

    expect(() => first.add(second)).toThrow('当前迁移批次')
  })
})