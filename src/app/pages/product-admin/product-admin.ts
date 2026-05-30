import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';

interface Product {
  stockid: string;
  description: string;
  categoryid: string;
  categorydescription: string;
  mbflag: string;
  qoh: number;
  location: string;
  units: string;
  cover_image_id: number | null;
  cover_image_url?: string;
}

interface Category {
  categoryid: string;
  categorydescription: string;
}

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-admin.html'
})
export class ProductAdminPage implements OnInit {
  private apis = inject(ManagerApis);
  
  products = signal<Product[]>([]);
  loading = signal(false);
  categories = signal<Category[]>([]);
  
  searchTerm = '';
  selectedCategory = '';
  
  currentPage = 1;
  limit = 25;
  total = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.apis.getProductCategories().subscribe({
      next: (res: any) => {
        this.categories.set(res);  // ✅ Usar .set()
      },
      error: (err: any) => console.error('Error al cargar categorías:', err)
    });
  }

  loadProducts() {
    this.loading.set(true);
    
    const params = {
      search: this.searchTerm,
      stockCat: this.selectedCategory,
      page: this.currentPage,
      limit: this.limit
    };
    
    this.apis.getProductsAdmin(params).subscribe({
      next: (res: any) => {
        const products = res.data.map((p: Product) => ({
          ...p,
          cover_image_url: p.cover_image_id 
            ? `https://quinchau.com/weberp/img/p/${p.cover_image_id.toString().split('').join('/')}/${p.cover_image_id}-home_default.jpg`
            : null
        }));
        this.products.set(products);
        this.total = res.pagination.total;
        this.totalPages = res.pagination.totalPages;
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  getImageUrl(imageId: number | null): string {
    if (!imageId) return '';
    const digits = imageId.toString().split('');
    return `https://quinchau.com/weberp/img/p/${digits.join('/')}/${imageId}-home_default.jpg`;
  }
}