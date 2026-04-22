import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { OutgoingMessage } from '../../models/transfer.model';

@Component({
  selector: 'app-manual-whatsapp',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './manual-whatsapp.html',
})
export class ManualWhatsapp implements OnInit {
  private state = inject(ManagerState);

  public readonly messages      = this.state.pendingMessages;
  public readonly isLoading     = this.state.whatsappIsLoading;
  public readonly sentStats     = this.state.sentStats;
  public readonly activeMessage = signal<OutgoingMessage | null>(null);
  public readonly actionStatus  = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  public readonly highCount = computed(() =>
    this.messages().filter(m => m.priority === 'high').length
  );
  public readonly lowCount = computed(() =>
    this.messages().filter(m => m.priority === 'low').length
  );

  ngOnInit(): void {
    this.state.loadWhatsapp();
  }

  public selectMessage(msg: OutgoingMessage): void {
    if (msg.status === 'wait') {
      this.activeMessage.set(msg);
      return;
    }

    this.actionStatus.set('loading');
    this.state.lockMessage(msg.id).subscribe({
      next: () => {
        this.activeMessage.set({ ...msg, status: 'wait' });
        this.actionStatus.set('idle');
      },
      error: () => this.actionStatus.set('error')
    });
  }

  public openWhatsApp(): void {
    const msg = this.activeMessage();
    if (!msg) return;
    window.open(msg.whatsapp_link, '_blank');
  }

  public confirmSent(): void {
    const msg = this.activeMessage();
    if (!msg) return;

    this.actionStatus.set('loading');
    this.state.markMessageSent(msg.id).subscribe({
      next: () => {
        this.activeMessage.set(null);
        this.actionStatus.set('success');
        setTimeout(() => this.actionStatus.set('idle'), 2000);
      },
      error: () => this.actionStatus.set('error')
    });
  }

  public dismissActive(): void {
    this.activeMessage.set(null);
  }

  public reload(): void {
    this.state.reloadWhatsapp();
  }
}