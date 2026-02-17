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
  imports: [CommonModule, FormsModule], // ✅ FormsModule añadido para el buscador
  templateUrl: './transfer-detail.html',
})
export class TransferDetailComponent implements OnInit {
  // --- Inyecciones ---
  public managerState = inject(ManagerState);
  private searchService = inject(SearchService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  // --- Signals y Estado ---
  public readonly transferenciaDetalle$ = this.managerState.transferenciaDetalle$;
  
  // Sincronizamos con el estado global de búsqueda
  searchTerm = signal(''); 

  ngOnInit(): void {
    const idtransfer = this.route.snapshot.paramMap.get('id');
    if (idtransfer) {
      this.managerState.loadTransferenciaDetalle(idtransfer);
    }
  }

  // --- Lógica de Búsqueda (Movida desde el Header) ---
  onSearchChange(): void {
    this.searchService.setSearchTerm(this.searchTerm());
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchService.clearSearch();
  }

  // --- Navegación y Utilidades ---
  goBack(): void {
    this.location.back();
  }

  formatLongDescription(description: string | undefined): SafeHtml {
    if (!description) return '';
    const formattedText = description.replace(/\r\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formattedText);
  }

  // --- Acciones de Negocio ---
  onActionClick(action: TransferAction | null, nextStatus: string | null): void {
    const idtransfer = this.route.snapshot.paramMap.get('id');
    if (!action || !idtransfer) return;

    // Simplificamos la lógica de redirección con una función auxiliar
    const handleResponse = {
      next: () => this.router.navigate(['/transfers']),
      error: (err: any) => {
        console.error('Error en la operación:', err);
        alert('Ocurrió un error al procesar la solicitud.');
      }
    };

    switch (action) {
      case TransferAction.MarkAsPickedUp:
      case TransferAction.MarkAsDelivered:
      case TransferAction.ReturnTransfer:
        if (nextStatus) {
          this.managerState.updateTransferStatus(idtransfer, nextStatus).subscribe(handleResponse);
        }
        break;

      case TransferAction.ReceiveTransfer:
        this.managerState.executeTransfer(idtransfer).subscribe(handleResponse);
        break;

      case TransferAction.DeleteTransfer:
        if (confirm('¿Estás seguro de eliminar esta transferencia?')) {
          this.managerState.deleteTransfer(idtransfer).subscribe(handleResponse);
        }
        break;
    }
  }
}