// src/app/services/socket-io.service.ts
import { inject, Injectable, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { ManagerState } from './manager-state';

@Injectable({ providedIn: 'root' })
export class SocketIoService {
  private platformId = inject(PLATFORM_ID);
  private managerState = inject(ManagerState);

  private socket: Socket | null = null;
  private connected = signal(false);

  constructor() {
  if (!isPlatformBrowser(this.platformId)) {
    //console.log('[WS] ❌ No se inicia SocketIoService (SSR detectado)');
    return;
  }

  console.log('[WS] 🔧 SocketIoService inicializado en el navegador');

  effect(() => {
    const user = this.managerState.currentUser();

    //console.log('[WS] 🔄 Effect disparado. currentUser =', user);

    if (user) {
      const token = this.getTokenFromCookie();
      //console.log('[WS] 👤 Usuario detectado. Token encontrado:', !!token);

      if (token) {
        //console.log('[WS] 🚀 Intentando conectar WebSocket con token...');
        this.connect(token);
      } else {
        //console.warn('[WS] ⚠️ Usuario presente pero NO hay token en cookie');
      }

    } else {
      //console.log('[WS] 👋 No hay usuario. Desconectando WebSocket...');
      this.disconnect();
    }
  });
}

private getTokenFromCookie(): string | null {
  if (!isPlatformBrowser(this.platformId)) return null;
  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

private connect(token: string) {
  if (this.socket) return;

  this.socket = io(`${environment.websocketUrl}/gestion`, {
    transports: ['websocket'],
    auth: { token },
  });

  this.socket.on('connect', () => this.connected.set(true));
  this.socket.on('disconnect', () => this.connected.set(false));
}
  private disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  emit(event: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }

  isConnected() {
    return this.connected();
  }
}
