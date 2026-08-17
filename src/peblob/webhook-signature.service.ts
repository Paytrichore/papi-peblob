import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class WebhookSignatureService {
  assertValidSignature(
    signatureHeader: string | undefined,
    timestampHeader: string | undefined,
    rawBody: string,
  ): void {
    const secret = process.env.WEBHOOK_SHARED_SECRET;
    if (!secret || !signatureHeader || !timestampHeader) {
      throw new UnauthorizedException('Invalid webhook authentication');
    }

    const timestamp = Number(timestampHeader);
    const tolerance =
      Number(process.env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS ?? '300') * 1000;
    if (
      !Number.isFinite(timestamp) ||
      Math.abs(Date.now() - timestamp) > tolerance
    ) {
      throw new UnauthorizedException('Stale webhook timestamp');
    }

    const expected = createHmac('sha256', secret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest('hex');
    const provided = signatureHeader.replace(/^sha256=/, '');
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
