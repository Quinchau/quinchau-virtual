import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { WhatsappButton } from './components/whatsapp-button/whatsapp-button';
import { SocketIoService } from './services/socket-io.service';
import { SwUpdateService } from './services/sw-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, WhatsappButton],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('quinchau-virtual');
  private readonly socket = inject(SocketIoService);

  constructor() {
    inject(SwUpdateService).init();
  }
}