// src/app/services/search.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  public searchTerm = signal<string>('');
  public isSearchOpen = signal<boolean>(false);
  
  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }
  
  clearSearch() {
    this.searchTerm.set('');
  }
  
  openSearch() {
    this.isSearchOpen.set(true);
  }
  
  closeSearch() {
    this.isSearchOpen.set(false);
    this.clearSearch(); // Limpiamos al cerrar
  }
}