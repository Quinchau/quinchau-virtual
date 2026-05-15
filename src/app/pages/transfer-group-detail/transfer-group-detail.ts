import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { Transfer } from '../../models/transfer.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transfer-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-group-detail.html',
})
export class TransferGroupDetailComponent implements OnInit {
  private managerState = inject(ManagerState);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public groupId = signal<string | null>(null);
  public groupItems = signal<Transfer[]>([]);
  public loading = signal(true);
  public searchTerm = signal('');

  // Datos del grupo (tomados del primer item)
  public customerName = signal('');
  public customerPhone = signal('');
  public customerId = signal('');
  public customerAddress = signal('');
  public deliveryType = signal('');
  public shippingCarrier = signal('');
  public shippingId = signal('');
  public paymentStatus = signal<'unpaid' | 'paid'>('unpaid');
  public deliveryStatus = signal<'pending' | 'dispatched' | 'delivered'>('pending');

  // Computed: estado del grupo
  public allPickedUp = computed(() => {
    return this.groupItems().every(item => item.status === 'Recogido');
  });

  public anyPickedUp = computed(() => {
    return this.groupItems().some(item => item.status === 'Recogido');
  });

  public groupStatus = computed(() => {
    if (this.deliveryStatus() === 'delivered') return 'Entregado al cliente';
    if (this.deliveryStatus() === 'dispatched') return 'Enviado al cliente';
    if (this.allPickedUp()) return 'Listo para despachar';
    if (this.anyPickedUp()) return 'Recogido parcial';
    return 'Pendiente';
  });

  public pickedUpCount = computed(() => {
    return this.groupItems().filter(item => item.status === 'Recogido').length;
  });

  public filteredItems = computed(() => {
    const items = this.groupItems();
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return items;
    return items.filter(item =>
      item.idtransfer.toString().includes(term) ||
      item.stockid?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.location_name?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.groupId.set(this.route.snapshot.paramMap.get('groupId'));
    this.loadGroup();
  }

  loadGroup(): void {
  this.loading.set(true);
  const groupId = this.groupId();
  if (!groupId) return;

  // ✅ Obtener del estado global de managerState
  const allTransfers = this.managerState['transfers']();
  const items = allTransfers.filter(t => t.transfer_group === groupId);
  
  this.groupItems.set(items);
  
  if (items.length > 0) {
    const first = items[0];
    this.customerName.set(first.customer_name || '');
    this.customerPhone.set(first.customer_phone || '');
    this.customerId.set(first.customer_id || '');
    this.customerAddress.set(first.customer_address || '');
    this.deliveryType.set(first.delivery_type || '');
    this.shippingCarrier.set(first.shipping_carrier || '');
    this.shippingId.set((first as any).shipping_id || '');
    this.paymentStatus.set((first.payment_status as any) || 'unpaid');
    this.deliveryStatus.set((first.delivery_status as any) || 'pending');
  }
  
  this.loading.set(false);
}

  markAsPickedUp(item: Transfer): void {
    if (item.status !== 'Pendiente') return;
    
    this.managerState.updateTransferStatus(item.idtransfer.toString(), 'Recogido').subscribe({
      next: () => {
        this.groupItems.update(items =>
          items.map(i => 
            i.idtransfer === item.idtransfer 
              ? { ...i, status: 'Recogido' } 
              : i
          )
        );
      },
      error: (err) => alert('Error al marcar recogido: ' + err.message)
    });
  }

  dispatchGroup(): void {
    if (!this.allPickedUp()) {
      alert('Debes recoger todos los productos antes de despachar');
      return;
    }
    
    if (confirm('¿Despachar todo el grupo al cliente?')) {
      this.managerState.dispatchGroup(this.groupId()!).subscribe({
        next: () => {
          this.deliveryStatus.set('dispatched');
          this.router.navigate(['/transfers']);
        },
        error: (err) => alert('Error al despachar: ' + err.message)
      });
    }
  }

  confirmDelivery(): void {
    if (this.deliveryStatus() !== 'dispatched') {
      alert('Primero debe despachar el envío');
      return;
    }
    
    if (confirm('¿Confirmar entrega al cliente?')) {
      this.managerState.receiveGroup(this.groupId()!).subscribe({
        next: () => {
          this.deliveryStatus.set('delivered');
          this.router.navigate(['/transfers']);
        },
        error: (err) => alert('Error al confirmar entrega: ' + err.message)
      });
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  goBack(): void {
    this.router.navigate(['/transfers']);
  }
}