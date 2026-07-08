import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createCache } from 'cache-manager';

const logger = new Logger('RedisCacheModule');

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('app.redis.url');
        
        try {
          if (redisUrl) {
            const { redisStore } = await import('cache-manager-redis-store');
            const url = new URL(redisUrl);
            const isTls = url.protocol === 'rediss:';
            
            const store = await redisStore({
              socket: {
                host: url.hostname,
                port: parseInt(url.port || '6379', 10),
                tls: isTls ? {} : undefined,
                reconnectStrategy: (retries: number) => {
                  if (retries > 10) return new Error('Redis max retries');
                  return Math.min(retries * 100, 3000);
                },
              },
              password: url.password ? decodeURIComponent(url.password) : undefined,
              ttl: 60 * 5,
            });

            return {
              store: () => store,
              ttl: 60 * 5,
            };
          }
        } catch (error) {
          logger.warn(`Redis connection failed: ${error.message}. Using in-memory cache.`);
        }

        // Fallback to in-memory cache
        return {
          ttl: 60 * 5,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
