// services/search.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  public searchTerm = signal<string>('');
  
  setSearchTerm(term: string) {
    this.searchTerm.set(term);
  }
  
  clearSearch() {
    this.searchTerm.set('');
  }
}