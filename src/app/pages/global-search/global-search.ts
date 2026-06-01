import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { ManagerState } from '../../services/manager-state';
import { ProductPicker } from '../../components/product-picker/product-picker';
import { Router } from '@angular/router';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, ProductPicker],
  templateUrl: './global-search.html',
})
export class GlobalSearchComponent {
  private searchService = inject(SearchService);
  public state = inject(ManagerState);
  private router = inject(Router);

  isOpen = this.searchService.isSearchOpen;

  onProductSelected(product: any) {
  this.searchService.closeSearch();
  this.router.navigate(['/producto', product.stockid, this.slugify(product.description)]);
}

private slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

  closeSearch() {
    this.searchService.closeSearch();
  }
}