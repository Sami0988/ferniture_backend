import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const user = await this.authService.validateAccessToken(token as string);
      // Attach user to the socket for later use
      client.userId = user.id;
      client.userRole = user.role;
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}
