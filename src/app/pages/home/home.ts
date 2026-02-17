import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBox } from '../../components/search-box/search-box';
import { ManagerState } from '../../services/manager-state';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchBox], 
  templateUrl: './home.html',
})
export class Home {
  public managerState = inject(ManagerState);
  private router = inject(Router); 
  private route = inject(ActivatedRoute);

 public clearSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }
}