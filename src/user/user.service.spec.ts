import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';

describe('UserService notifyPeblobDraftCreated', () => {
  const event = {
    eventType: 'peblob-created-from-draft' as const,
    eventId: '7f718931-f6c7-4d01-81f9-4ef79d5baf47',
    occurredAt: '2026-07-30T10:00:00.000Z',
    userId: 'user-1',
    peblobId: 'peblob-1',
    correlationId: 'corr-1',
  };

  let service: UserService;

  const configValues: Record<string, string> = {
    USER_API_URL: 'http://localhost:3001',
    WEBHOOK_SHARED_SECRET: 'secret',
    WEBHOOK_MAX_RETRIES: '2',
    WEBHOOK_RETRY_DELAY_MS: '0',
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string) => configValues[key] ?? fallback),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(configService);
  });

  it('posts a signed webhook successfully', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

    await service.notifyPeblobDraftCreated(event);

    expect((global as any).fetch).toHaveBeenCalledWith(
      'http://localhost:3001/webhooks/peblob-draft-created',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-webhook-signature': expect.stringMatching(/^sha256=/),
          'x-webhook-timestamp': expect.any(String),
        }),
      }),
    );
  });

  it('retries on 5xx and then succeeds', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    await service.notifyPeblobDraftCreated(event);

    expect((global as any).fetch).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 });

    await expect(service.notifyPeblobDraftCreated(event)).rejects.toThrow(
      'Webhook failed with status 503 after 3 attempt(s)',
    );
  });
});
