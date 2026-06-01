// src/app/pages/product-detail/product-detail.ts
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ManagerState } from '../../services/manager-state';
import { AvailableLocation, NewTransfer } from '../../models/transfer.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [],
  templateUrl: './product-detail.html',
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  public managerState = inject(ManagerState);
  private router = inject(Router);

  public transferType = this.managerState.newTransferType;
  public defaultLocation = computed(() => this.managerState.currentUser()?.defaultlocation ?? null);
  public shiploc = signal<string | null>(null);
  public recloc = signal<string | null>(null);
  public quantity = signal<number>(1);
  public stockid = computed(() => this.managerState.currentProduct());
  public selectedLocation = signal<AvailableLocation | null>(null);
  public selectedImage = signal<string | null>(null);

  public readonly availableLocations = computed(() => {
  const product = this.stockid();
  const defaultLoc = this.defaultLocation();
  
  if (!product?.available_locations) return [];
  
  // Para AMBOS tipos: mostrar ubicaciones que NO sean la actual del usuario
  return product.available_locations.filter(loc => 
    loc.loccode !== defaultLoc
  );
});

public selectImage(url: string): void {
  this.selectedImage.set(url);
}

  public readonly derivedLocations = computed(() => {
  const transferType = this.transferType();
  const defaultLoc = this.defaultLocation();
  const selectedLoc = this.selectedLocation();
  
  
  if (transferType === 'ship') {
    // ENVÍO: desde mi ubicación hacia la seleccionada
    return {
      shiploc: defaultLoc,                    // Origen: mi ubicación
      recloc: selectedLoc?.loccode || null    // Destino: ubicación seleccionada
    };
  } else {
    // RECEPCIÓN: desde la seleccionada hacia mi ubicación  
    return {
      shiploc: selectedLoc?.loccode || null,  // Origen: ubicación seleccionada
      recloc: defaultLoc                      // Destino: mi ubicación
    };
  }
});

  public readonly availableStock = computed(() => {
    const transferType = this.transferType();
    const product = this.stockid();
    const defaultLoc = this.defaultLocation();
    const selectedLoc = this.selectedLocation();
    
    if (!product?.available_locations) return 0;
    
    if (transferType === 'ship') {
      const origen = product.available_locations.find(loc => loc.loccode === defaultLoc);
      return origen?.qty || 0;
    } else {
      return selectedLoc?.qty || 0;
    }
  });

  public readonly isValidForm = computed(() => {
    const locations = this.derivedLocations();
    return !!locations.shiploc && 
           !!locations.recloc && 
           this.quantity() > 0 && 
           this.quantity() <= this.availableStock() &&
           !!this.stockid() &&
           !!this.managerState.currentUser();
  });

  public readonly transferPayload = computed((): NewTransfer | null => {
    if (!this.isValidForm()) return null;
    
    const product = this.stockid();
    const user = this.managerState.currentUser();
    const locations = this.derivedLocations();
    
    return {
      stockid: product!.stockid,
      shipqty: this.quantity(),
      shiploc: locations.shiploc!,
      recloc: locations.recloc!,
      user: user!.realname
    };
  });

  constructor() {
  }

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const stockid = params.get('id');
    if (stockid) {
      this.selectedImage.set(null); // reset al cambiar producto
      this.managerState.loadProductDetail(stockid);
    }
  });
}

  // === MÉTODOS PÚBLICOS ===
  public closeModal(): void {
    this.managerState.clearTransferCompleted();
    this.router.navigate(['/transfers']);
  }

  public selectLocation(loc: AvailableLocation): void {
    this.selectedLocation.set(loc);
  }

  public increment(): void {
    if (this.quantity() < this.availableStock()) {
      this.quantity.update(q => q + 1);
    }
  }

  public decrement(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  public onQuantityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    
    if (!isNaN(value) && value >= 1 && value <= this.availableStock()) {
      this.quantity.set(value);
    } else {
      this.quantity.set(1);
    }
  }

  public confirmTransfer(): void {
    const payload = this.transferPayload();
    
    if (payload) {
      this.managerState.setNewTransfer(payload);
      this.managerState.executeNewTransfer();
    }
  }
}