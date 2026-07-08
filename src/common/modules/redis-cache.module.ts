import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createCache } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('app.redis.url');
        
        let storeOptions: any;
        if (redisUrl) {
          const url = new URL(redisUrl);
          const isTls = url.protocol === 'rediss:';
          storeOptions = {
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
          };
        } else {
          storeOptions = {
            socket: {
              host: configService.get('app.redis.host', 'localhost'),
              port: configService.get('app.redis.port', 6379),
            },
          };
        }

        const store = await redisStore({
          ...storeOptions,
          ttl: 60 * 5,
        });

        return {
          store: () => store,
          ttl: 60 * 5,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
