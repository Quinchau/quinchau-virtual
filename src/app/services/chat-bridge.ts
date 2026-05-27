import { Injectable, signal, OnDestroy, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface WadeskSession {
  token: string;
  agent_id: string;
}

@Injectable({ providedIn: 'root' })
export class ChatBridgeService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private session = signal<WadeskSession | null>(null);
  private socket: Socket | null = null;
  private iframeRef: HTMLIFrameElement | null = null;

  // Signals públicas
  readonly unreadCount = signal(0);
  readonly isConnected = signal(false);
  readonly activeConversationId = signal<string | null>(null);
  readonly hasSession = computed(() => !!this.session());

  constructor() {
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Restaurar unreadCount desde localStorage
      const saved = localStorage.getItem('chat_unread_count');
      if (saved) this.unreadCount.set(parseInt(saved, 10));

      // Persistir en localStorage cuando cambie
      effect(() => {
        localStorage.setItem('chat_unread_count', String(this.unreadCount()));
      });

      // Escuchar mensajes del iframe
      window.addEventListener('message', this.onIframeMessage);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('message', this.onIframeMessage);
    }
    this.disconnectSocket();
  }

  registerIframe(iframe: HTMLIFrameElement) {
    if (isPlatformBrowser(this.platformId)) {
      this.iframeRef = iframe;
    }
  }

  private onIframeMessage = (event: MessageEvent) => {
    if (!isPlatformBrowser(this.platformId)) return;
    if (event.origin !== environment.chatbotUrl) return;

    const { type, payload } = event.data ?? {};

    switch (type) {
      case 'WADESK_TOKEN':
        this.onWadeskToken(payload);
        break;
      case 'UNREAD_COUNT':
        if (!this.isConnected()) {
          this.unreadCount.set(payload.count);
        }
        break;
      case 'CONVERSATION_ACTIVE':
        this.activeConversationId.set(payload.conversationId ?? null);
        break;
    }
  };

  private onWadeskToken(session: WadeskSession) {
    this.session.set(session);
    this.connectSocket(session.token, session.agent_id);
  }

  private connectSocket(token: string, agentId: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket?.connected) return;

    const url = `${environment.wsUrl}/gestion`;
    
    this.socket = io(url, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('[ChatBridge] WebSocket conectado a /gestion');
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('notification', (payload: any) => {
      if (payload.type === 'message:new' && payload.target_agent_id === agentId) {
        this.unreadCount.update(v => v + 1);
      }
    });
  }

  private disconnectSocket() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
  }

  sendProduct(product: {
    id: string;
    name: string;
    price: number;
    image: string;
    url: string;
  }) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.postToIframe('SEND_PRODUCT', product);
  }

  resetUnread() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.unreadCount.set(0);
    this.postToIframe('RESET_UNREAD', {});
  }

  private postToIframe(type: string, payload: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.iframeRef?.contentWindow?.postMessage(
      { type, payload },
      environment.chatbotUrl
    );
  }
}