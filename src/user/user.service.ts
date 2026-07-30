import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

export interface PeblobDraftCreatedEvent {
  eventType: 'peblob-created-from-draft';
  eventId: string;
  occurredAt: string;
  userId: string;
  peblobId: string;
  correlationId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  isActive: boolean;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly userApiUrl: string;
  private readonly webhookSecret: string;
  private readonly webhookMaxRetries: number;
  private readonly webhookRetryDelayMs: number;

  constructor(private configService: ConfigService) {
    // URL de ton microservice User (via variable d'environnement)
    this.userApiUrl = this.configService.get<string>(
      'USER_API_URL',
      'http://localhost:3001',
    );
    this.webhookSecret = this.configService.get<string>(
      'WEBHOOK_SHARED_SECRET',
      '',
    );
    this.webhookMaxRetries = Number(
      this.configService.get<string>('WEBHOOK_MAX_RETRIES', '2'),
    );
    this.webhookRetryDelayMs = Number(
      this.configService.get<string>('WEBHOOK_RETRY_DELAY_MS', '200'),
    );
  }

  async notifyPeblobDraftCreated(event: PeblobDraftCreatedEvent): Promise<void> {
    if (!this.webhookSecret) {
      throw new Error('WEBHOOK_SHARED_SECRET is not configured');
    }

    const timestamp = Date.now().toString();
    const body = JSON.stringify(event);
    const signature = createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    let attempt = 0;
    while (attempt <= this.webhookMaxRetries) {
      try {
        const response = await fetch(
          `${this.userApiUrl}/webhooks/peblob-draft-created`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-timestamp': timestamp,
              'x-webhook-signature': `sha256=${signature}`,
            },
            body,
          },
        );

        if (response.ok) {
          return;
        }

        const shouldRetry = response.status >= 500;
        if (!shouldRetry || attempt === this.webhookMaxRetries) {
          throw new Error(
            `Webhook failed with status ${response.status} after ${attempt + 1} attempt(s)`,
          );
        }
      } catch (error) {
        if (attempt === this.webhookMaxRetries) {
          throw error;
        }
      }

      attempt += 1;
      await this.delay(this.webhookRetryDelayMs);
    }

    throw new Error('Webhook failed unexpectedly');
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.userApiUrl}/users/${userId}`);
      return response.ok;
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la vérification de l'utilisateur ${userId}:`,
        error,
      );
      return false; // En cas d'erreur réseau, on considère que l'utilisateur n'existe pas
    }
  }

  /**
   * Récupérer le profil d'un utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.userApiUrl}/users/${userId}`);

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();
      // Validate shape before casting (minimal check)
      if (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        'email' in data &&
        'username' in data &&
        'createdAt' in data &&
        'isActive' in data
      ) {
        return data as UserProfile;
      }
      this.logger.warn(
        `Profil utilisateur ${userId} reçu mais format inattendu.`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du profil ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Récupérer plusieurs profils d'utilisateurs
   */
  async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];

    // On pourrait optimiser avec une requête batch si l'API User le supporte
    for (const userId of userIds) {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        profiles.push(profile);
      }
    }

    return profiles;
  }

  /**
   * Notifier l'API User qu'un utilisateur a créé des contenus
   * (optionnel - pour des statistiques par exemple)
   */
  async notifyUserActivity(
    userId: string,
    action: string,
    details?: string,
  ): Promise<void> {
    try {
      await fetch(`${this.userApiUrl}/users/${userId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          service: 'papi-peblob',
          timestamp: new Date().toISOString(),
          details,
        }),
      });
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la notification d'activité pour ${userId}:`,
        error,
      );
      // On ne fait pas échouer l'opération principale si la notification échoue
    }
  }
}
