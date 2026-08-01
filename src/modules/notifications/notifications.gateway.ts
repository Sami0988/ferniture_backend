import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Use the guard to validate the token
      const context = {
        switchToWs: () => ({ getClient: () => client }),
        getHandler: () => null,
        getClass: () => NotificationsGateway,
      } as any;

      const canActivate = await this.wsJwtGuard.canActivate(context);
      if (!canActivate) {
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, client);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Admins join the admin room
      if (client.userRole && ['super_admin', 'manager'].includes(client.userRole)) {
        client.join('admins');
      }

      this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    client.join(room);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
  }

  // Called by services to broadcast events
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToAdmins(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedClients(): number {
    return this.connectedClients.size;
  }
}
