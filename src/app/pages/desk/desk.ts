import { Component, inject, ViewChild, ElementRef, AfterViewInit, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChatBridgeService } from '../../services/chat-bridge';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-desk',
  imports: [],
  templateUrl: './desk.html',
  styles: ``,
})
export class Desk implements AfterViewInit {
  private chatBridge = inject(ChatBridgeService);
  private sanitizer = inject(DomSanitizer);
  
  chatbotUrl: SafeResourceUrl;

  @ViewChild('chatIframe') iframeRef!: ElementRef<HTMLIFrameElement>;

  constructor() {
    // Sanitizar la URL para que Angular la considere segura
    const rawUrl = `${environment.chatbotUrl}/desk`;
    this.chatbotUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  ngAfterViewInit() {
    console.log('[Desk] Inicializando con URL:', this.chatbotUrl);
    
    if (this.iframeRef && this.iframeRef.nativeElement) {
      this.chatBridge.registerIframe(this.iframeRef.nativeElement);
      console.log('[Desk] Iframe registrado en ChatBridgeService');
    } else {
      console.error('[Desk] Iframe no encontrado');
    }
  }
}