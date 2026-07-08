import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          ttl: 60 * 5, // 5 minutes in-memory cache
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
