import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';

type GlobalWithFetch = typeof globalThis & { fetch: typeof fetch };

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
  const globalWithFetch = globalThis as GlobalWithFetch;

  const configValues: Record<string, string> = {
    USER_API_URL: 'http://localhost:3001',
    WEBHOOK_SHARED_SECRET: 'secret',
    WEBHOOK_MAX_RETRIES: '2',
    WEBHOOK_RETRY_DELAY_MS: '0',
  };

  const configService = {
    get: jest.fn(
      (key: string, fallback?: string) => configValues[key] ?? fallback,
    ),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(configService);
    globalWithFetch.fetch = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >() as unknown as typeof fetch;
  });

  it('posts a signed webhook successfully', async () => {
    const response = { ok: true, status: 200 } as Response;
    (
      globalWithFetch.fetch as jest.MockedFunction<typeof fetch>
    ).mockResolvedValue(response);

    await service.notifyPeblobDraftCreated(event);

    const fetchMock = globalWithFetch.fetch as unknown as jest.MockedFunction<
      typeof fetch
    >;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/webhooks/peblob-draft-created',
      expect.anything(),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.method).toBe('POST');

    const headers = requestInit.headers as Record<string, string>;
    expect(headers['x-webhook-signature']).toMatch(/^sha256=/);
    expect(headers['x-webhook-timestamp']).toBeTruthy();
  });

  it('retries on 5xx and then succeeds', async () => {
    const fetchMock = globalWithFetch.fetch as jest.MockedFunction<
      typeof fetch
    >;
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    await service.notifyPeblobDraftCreated(event);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries', async () => {
    (
      globalWithFetch.fetch as jest.MockedFunction<typeof fetch>
    ).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(service.notifyPeblobDraftCreated(event)).rejects.toThrow(
      'Webhook failed with status 503 after 3 attempt(s)',
    );
  });
});
