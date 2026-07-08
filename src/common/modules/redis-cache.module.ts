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
          storeOptions = { url: redisUrl };
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
