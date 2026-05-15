import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { ManagerState } from '../../services/manager-state';
import { ProductPicker } from '../../components/product-picker/product-picker';
import { ProductOrder } from '../product-order/product-order';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, ProductPicker, ProductOrder],
  templateUrl: './global-search.html',
})
export class GlobalSearchComponent {
  private searchService = inject(SearchService);
  public state = inject(ManagerState);

  isOpen = this.searchService.isSearchOpen;

  selectedProductId = computed(() => 
    this.state.currentProductCard()?.stockid ?? null
  );

  onProductSelected(product: any) {
    console.log('onProductSelected llamado', product.stockid);
    this.state.currentProductCard.set({
      ...product,
      qty_in_order: product.qty_in_order ?? 1,
    });
  }

  closeProductDetail() {
    this.state.closeProductDetail();
  }

  closeSearch() {
    this.state.closeProductDetail();
    this.searchService.closeSearch();
  }
}