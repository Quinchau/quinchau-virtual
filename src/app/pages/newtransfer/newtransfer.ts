import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerState } from '../../services/manager-state';
import { Router, RouterOutlet } from '@angular/router';
import { SearchBox } from '../../components/search-box/search-box';


@Component({
  selector: 'app-new-transfer',
  standalone: true,
  // Añadimos SearchBox y quitamos FormsModule (si ya no usas otros inputs aquí)
  imports: [CommonModule, RouterOutlet, SearchBox], 
  templateUrl: './newtransfer.html',
})
export class NewTransferComponent implements OnInit {
  public managerState = inject(ManagerState);
  public router = inject(Router);
  public selectedStockid: string | null = null;
  
  ngOnInit(): void {}

  // Mantenemos solo la lógica de navegación y UI de la lista
  onProductClick(stockid: string): void {
    this.router.navigate(['new-transfer/product', stockid]);
  }

  closeModal(): void {
    this.selectedStockid = null;
  }
}