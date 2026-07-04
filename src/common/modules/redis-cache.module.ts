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
        const store = await redisStore({
          socket: {
            host: configService.get('app.redis.host', 'localhost'),
            port: configService.get('app.redis.port', 6379),
          },
          ttl: 60 * 5, // 5 minutes default TTL
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
