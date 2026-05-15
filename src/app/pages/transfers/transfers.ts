import { Component, OnInit, inject, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Transfer, TransferGroup } from '../../models/transfer.model';
import { SearchService } from '../../services/search.service';
import { FormsModule } from '@angular/forms';

type UnifiedItem = { type: 'single'; data: Transfer } | { type: 'group'; data: TransferGroup };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './transfers.html',
})
export class Transfers implements OnInit {
  private managerState = inject(ManagerState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  private isBrowser: boolean;
  
  public readonly envios = this.managerState.envios;
  public readonly recepciones = this.managerState.recepciones;
  public readonly gruposEnvio = this.managerState.gruposEnvio;
  public readonly gruposRecepcion = this.managerState.gruposRecepcion;
  
  public activeTab = computed<'ship' | 'rec'>(() => {
    return this.managerState.newTransferType() || 'ship';
  });
  public searchTerm = this.searchService.searchTerm;

  public unifiedList = computed<UnifiedItem[]>(() => {
    const isShip = this.activeTab() === 'ship';
    const transfers = isShip ? this.envios() : this.recepciones();
    const groups = isShip ? this.gruposEnvio() : this.gruposRecepcion();
    const term = this.searchTerm().toLowerCase().trim();
    
    const items: UnifiedItem[] = [];
    
    // Agregar grupos
    for (const group of groups) {
      items.push({ type: 'group', data: group });
    }
    
    // Agregar transferencias individuales
    for (const transfer of transfers) {
      items.push({ type: 'single', data: transfer });
    }
    
    // Aplicar filtro de búsqueda si hay término
    if (!term) return items;
    
    return items.filter(item => {
      if (item.type === 'group') {
        const group = item.data;
        return group.transfer_group.toLowerCase().includes(term) ||
               group.items.some(i => i.stockid.toLowerCase().includes(term)) ||
               group.customer_name?.toLowerCase().includes(term) ||
               group.delivery_type?.toLowerCase().includes(term);
      } else {
        const transfer = item.data;
        return transfer.idtransfer.toString().includes(term) ||
               transfer.stockid?.toLowerCase().includes(term) ||
               transfer.description?.toLowerCase().includes(term) ||
               transfer.location_name?.toLowerCase().includes(term) ||
               transfer.status?.toLowerCase().includes(term) ||
               transfer.shipqty?.toString().includes(term) ||
               transfer.customer_name?.toLowerCase().includes(term);
      }
    });
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      effect(() => {
        const term = this.searchTerm();
        if (term && this.unifiedList().length > 0) {
          setTimeout(() => this.scrollToFirstMatch(), 100);
        }
      });
    }
  }

  ngOnInit(): void {
    this.managerState.loadTransfers();
    if (this.managerState.newTransferType() === null) {
      this.managerState.setNewTransferType(this.activeTab());
    }
  }

  public selectTab(tab: 'ship' | 'rec'): void {
    this.managerState.setNewTransferType(tab);
  }

  public openTransferDetail(idtransfer: number): void {
    this.router.navigate(['detail', idtransfer], { relativeTo: this.route });
  }

  public openGroupDetail(transferGroup: string): void {
  this.router.navigate(['/transfer-group', transferGroup], {
    queryParams: {}  // 👈 Limpiar todos los query params
  });
}

  public createNewTransfer(): void {
    const transferType = this.activeTab();
    this.managerState.setNewTransferType(transferType);
    this.router.navigate(['/new-transfer']);
  }

  public completeGroup(transferGroup: string): void {
    // Abrir modal para completar datos de cliente y shipper
    this.router.navigate(['group', transferGroup, 'complete'], { relativeTo: this.route });
  }

  public dispatchGroup(transferGroup: string): void {
    if (confirm('¿Despachar todo el grupo? Se marcará como enviado al cliente.')) {
      this.managerState.dispatchGroup(transferGroup).subscribe({
        next: () => {
          this.managerState.loadTransfers();
        },
        error: (err) => {
          console.error('Error al despachar grupo:', err);
          alert(err?.error?.mensaje || 'Error al despachar el grupo');
        }
      });
    }
  }

  public receiveGroup(transferGroup: string): void {
    if (confirm('¿Recibir todo el grupo? Esto moverá el stock.')) {
      this.managerState.receiveGroup(transferGroup).subscribe({
        next: () => {
          this.managerState.loadTransfers();
        },
        error: (err) => {
          console.error('Error al recibir grupo:', err);
          alert(err?.error?.mensaje || 'Error al recibir el grupo');
        }
      });
    }
  }

  public clearSearch(): void {
    this.searchService.clearSearch();
  }

  private scrollToFirstMatch(): void {
    if (!this.isBrowser) return;
    
    const firstMatch = document.querySelector('.transfer-card:first-child');
    if (firstMatch) {
      firstMatch.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      this.highlightElement(firstMatch);
    }
  }

  private highlightElement(element: Element): void {
    if (!this.isBrowser) return;
    
    element.classList.add('bg-yellow-100', 'border', 'border-yellow-400');
    setTimeout(() => {
      element.classList.remove('bg-yellow-100', 'border', 'border-yellow-400');
    }, 2000);
  }
}