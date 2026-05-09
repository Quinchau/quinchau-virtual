import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ManagerState } from '../../services/manager-state';
import { SearchService } from '../../services/search.service';
import { TransferAction } from '../../data/transfer-actions';

@Component({
  selector: 'app-transfer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-detail.html',
})
export class TransferDetailComponent implements OnInit {
  public managerState = inject(ManagerState);
  private searchService = inject(SearchService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  public readonly transferenciaDetalle$ = this.managerState.transferenciaDetalle$;
  public TransferAction = TransferAction;
  
  searchTerm = signal(''); 

  ngOnInit(): void {
    const idtransfer = this.route.snapshot.paramMap.get('id');
    if (idtransfer) {
      this.managerState.loadTransferenciaDetalle(idtransfer);
    }
  }

  onSearchChange(): void {
    this.searchService.setSearchTerm(this.searchTerm());
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchService.clearSearch();
  }

  goBack(): void {
    this.location.back();
  }

  formatLongDescription(description: string | undefined): SafeHtml {
    if (!description) return '';
    const formattedText = description.replace(/\r\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formattedText);
  }

  onActionClick(action: TransferAction | null, nextStatus: string | null): void {
  const idtransfer = this.route.snapshot.paramMap.get('id');
  if (!action || !idtransfer) return;

  const handleResponse = {
    next: () => {
      // Para DeleteTransfer, redirigir inmediatamente sin recargar el detalle
      if (action === TransferAction.DeleteTransfer) {
        this.router.navigate(['/transfers']);
        return;
      }
      
      // Recargar el detalle después de otras operaciones exitosas
      this.managerState.loadTransferenciaDetalle(idtransfer);
      
      // Navegar para ReceiveTransfer
      if (action === TransferAction.ReceiveTransfer) {
        this.router.navigate(['/transfers']);
      }
    },
    error: (err: any) => {
      console.error('Error en la operación:', err);
      alert(err?.error?.mensaje || 'Ocurrió un error al procesar la solicitud.');
    }
  };

  switch (action) {
    // Tipo A (original)
    case TransferAction.MarkAsPickedUp:
      if (confirm('¿Marcar el producto como recogido?')) {
        this.managerState.updateTransferStatus(idtransfer, nextStatus || 'Recogido').subscribe(handleResponse);
      }
      break;

    case TransferAction.MarkAsDelivered:
      if (confirm('¿Confirmar la entrega al cliente?')) {
        this.managerState.updateTransferStatus(idtransfer, nextStatus || 'Entregado al cliente').subscribe(handleResponse);
      }
      break;

    case TransferAction.ReturnTransfer:
      if (confirm('¿Devolver transferencia?')) {
        this.managerState.updateTransferStatus(idtransfer, 'Devuelto').subscribe(handleResponse);
      }
      break;

    case TransferAction.ReceiveTransfer:
      if (confirm('¿Recibir la transferencia? Se moverá el stock.')) {
        this.managerState.executeTransfer(idtransfer).subscribe(handleResponse);
      }
      break;

    case TransferAction.DeleteTransfer:
      if (confirm('¿Estás seguro de eliminar esta transferencia? Esta acción no se puede deshacer.')) {
        this.managerState.deleteTransfer(idtransfer).subscribe(handleResponse);
      }
      break;

    // === TIPO B: Pago y documentos (independientes del status) ===
    case TransferAction.ConfirmPayment:
      if (confirm('¿Confirmar el pago del cliente? Esta acción no se puede deshacer.')) {
        this.managerState.confirmPayment(idtransfer).subscribe(handleResponse);
      }
      break;

    case TransferAction.UploadVoucher:
      this.triggerFileUpload('voucher', idtransfer);
      break;

    case TransferAction.UploadShippingDoc:
      this.triggerFileUpload('shipping-doc', idtransfer);
      break;
  }
}

  private triggerFileUpload(type: 'voucher' | 'shipping-doc', idtransfer: string): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        if (type === 'voucher') {
          this.managerState.uploadVoucher(idtransfer, file).subscribe({
            next: () => {
              alert('Comprobante subido correctamente');
              this.managerState.loadTransferenciaDetalle(idtransfer);
            },
            error: (err) => alert(err?.error?.mensaje || 'Error al subir comprobante')
          });
        } else {
          this.managerState.uploadShippingDoc(idtransfer, file).subscribe({
            next: () => {
              alert('Guía subida correctamente');
              this.managerState.loadTransferenciaDetalle(idtransfer);
            },
            error: (err) => alert(err?.error?.mensaje || 'Error al subir guía')
          });
        }
      }
    };
    input.click();
  }
}