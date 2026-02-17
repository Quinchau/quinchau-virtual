import { Component, OnInit, inject, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Transfer } from '../../models/transfer.model';
import { SearchService } from '../../services/search.service';
import { FormsModule } from '@angular/forms';

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
  
  public activeTab = computed<'ship' | 'rec'>(() => {
    return this.managerState.newTransferType() || 'ship';
  });
  public searchTerm = this.searchService.searchTerm;

  public filteredTransfers = computed<Transfer[]>(() => {
    const transfers = this.activeTab() === 'ship' ? this.envios() : this.recepciones();
    const term = this.searchTerm().toLowerCase().trim();
    
    if (!term) return transfers;
    
    return transfers.filter(transfer => 
      transfer.idtransfer.toString().includes(term) ||
      transfer.stockid?.toLowerCase().includes(term) ||
      transfer.description?.toLowerCase().includes(term) ||
      transfer.location_name?.toLowerCase().includes(term) ||
      transfer.status?.toLowerCase().includes(term) ||
      transfer.shipqty?.toString().includes(term)
    );
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {

//     effect(() => {
//   console.log('🔧 [HOME] Transfer type:', this.managerState.newTransferType());
//   // Deberías ver 'ship' o 'rec' según la tarjeta clickeada
// });
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      effect(() => {
        const term = this.searchTerm();
        if (term && this.filteredTransfers().length > 0) {
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

  public createNewTransfer(): void {
    const transferType = this.activeTab();
    this.managerState.setNewTransferType(transferType);
    this.router.navigate(['/new-transfer']);
  }

  public clearSearch(): void {
    this.searchService.clearSearch();
  }

  private scrollToFirstMatch(): void {
    if (!this.isBrowser) return;
    
    const firstMatch = document.querySelector('.transfer-item:first-child');
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