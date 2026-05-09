import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';
import { Router, RouterOutlet } from '@angular/router';
import { SearchBox } from '../../components/search-box/search-box';
import { Product, NewTransfer, AvailableLocation, Shipper } from '../../models/transfer.model';

@Component({
  selector: 'app-new-transfer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SearchBox, FormsModule],
  templateUrl: './newtransfer.html',
})
export class NewTransferComponent implements OnInit {
  public managerState = inject(ManagerState);
  public managerApis = inject(ManagerApis);
  public router = inject(Router);

  // Signals del formulario
  public selectedProduct = signal<Product | null>(null);
  public shipqty = signal<number>(1);
  public shiploc = signal<string>('');
  public recloc = signal<string>('');

  // Signals Tipo B (despacho al cliente — solo aplica en modo RECIBIR)
  public isCustomerDelivery = signal<boolean>(false);
  public customerName = signal<string>('');
  public customerPhone = signal<string>('');
  public customerId = signal<string>('');        // Documento de identidad
  public customerAddress = signal<string>('');
  public selectedShipper = signal<Shipper | null>(null);  // Shipper seleccionado
  public shippingCarrier = signal<string>('');
  
  // Lista de shippers desde el backend
  public shippers = signal<Shipper[]>([]);
  public loadingShippers = signal<boolean>(false);

  // Modo activo: 'ship' (ENVIAR) | 'rec' (RECIBIR)
  public readonly transferMode = computed(() => {
    return this.managerState.newTransferType() ?? 'ship';
  });

  // Computed para saber si el shipper seleccionado es DELIVERY
  public readonly isDelivery = computed(() => {
    return this.selectedShipper()?.shippername === 'DELIVERY';
  });

  // Detalle del producto seleccionado
  public readonly currentProductDetail = computed(() => {
    const detail = this.managerState.currentProduct();
    const selected = this.selectedProduct();
    if (detail && selected && detail.stockid === selected.stockid) {
      return detail;
    }
    return null;
  });

  // Ubicaciones con stock > 0
  public readonly availableLocations = computed(() => {
    const detail = this.currentProductDetail();
    const locations = detail?.available_locations || [];
    return locations.filter((loc: AvailableLocation) => loc.qty > 0);
  });

  // Ubicación por defecto del usuario (su almacén)
  public readonly userDefaultLocation = computed(() => {
    return this.managerState.currentUser()?.defaultlocation || '';
  });

  // Stock disponible en el almacén propio del usuario
  public readonly userLocationStock = computed(() => {
    const userLoc = this.userDefaultLocation();
    const locations = this.availableLocations();
    if (!userLoc || locations.length === 0) return 0;
    return locations.find(loc => loc.loccode === userLoc)?.qty || 0;
  });

  // Stock máximo transferible desde el origen seleccionado (shiploc)
  public readonly maxQuantity = computed(() => {
    const loc = this.shiploc();
    const locations = this.availableLocations();
    if (!loc || locations.length === 0) return 0;
    return locations.find(locItem => locItem.loccode === loc)?.qty || 0;
  });

  // Opciones para el selector variable según el modo
  public readonly destinationOptions = computed(() => {
    const locations = this.availableLocations();
    const userLoc = this.userDefaultLocation();
    return locations.filter((loc: AvailableLocation) => loc.loccode !== userLoc);
  });

  // Validación del formulario
  public readonly isFormValid = computed(() => {
    if (!this.shiploc() || !this.recloc() || this.shipqty() < 1) return false;
    if (this.shipqty() > this.maxQuantity()) return false;
    if (this.shiploc() === this.recloc()) return false;

    if (this.isCustomerDelivery()) {
        if (!this.customerName().trim()) return false;
        if (!this.selectedShipper()) return false;
        if (!this.isPhoneNumberValid()) return false;  // Teléfono obligatorio y válido
        if (!this.customerAddress().trim()) return false;
        
        // Si NO es delivery, requiere documento de identidad
        if (!this.isDelivery()) {
            if (!this.customerId().trim()) return false;
            if (!this.shippingCarrier().trim()) return false;
        }
    }

    return true;
});

  public phonePrefix = signal<'0412' | '0414' | '0416' | '0422' | '0424' | '0426'>('0412');
  public phoneNumber = signal<string>('');
  public phoneComplete = computed(() => {
      if (!this.phoneNumber() || this.phoneNumber().length !== 7) return '';
      return `${this.phonePrefix()}${this.phoneNumber()}`;
  });

  public phonePrefixes = [
    { value: '0412', label: '0412' },
    { value: '0414', label: '0414' },
    { value: '0416', label: '0416' },
    { value: '0422', label: '0422' },
    { value: '0424', label: '0424' },
    { value: '0426', label: '0426' }
];

public isPhoneNumberValid = computed(() => {
    const number = this.phoneNumber();
    return /^\d{7}$/.test(number);
});

  public compareShippers(s1: Shipper | null, s2: Shipper | null): boolean {
    return s1?.shipper_id === s2?.shipper_id;
}

  ngOnInit(): void {
    this.loadShippers();
  }

  private loadShippers(): void {
    this.loadingShippers.set(true);
    this.managerApis.getShippers().subscribe({
      next: (response: any) => {
        if (response.exito && response.shippers) {
          this.shippers.set(response.shippers);
          // Preseleccionar DELIVERY por defecto
          const defaultShipper = response.shippers.find((s: Shipper) => s.shippername === 'DELIVERY');
          if (defaultShipper) {
            this.selectedShipper.set(defaultShipper);
          }
        }
        this.loadingShippers.set(false);
      },
      error: (error) => {
        console.error('Error cargando shippers:', error);
        this.loadingShippers.set(false);
      }
    });
  }

  public onProductClick(product: Product): void {
    console.log('🖱️ Producto seleccionado:', product.stockid);

    // Resetear formulario
    this.shipqty.set(1);
    this.shiploc.set('');
    this.recloc.set('');
    this.isCustomerDelivery.set(false);
    this.customerName.set('');
    this.customerPhone.set('');
    this.customerId.set('');
    this.customerAddress.set('');
    this.shippingCarrier.set('');
    
    // Resetear shipper a DELIVERY por defecto
    const defaultShipper = this.shippers().find(s => s.shippername === 'DELIVERY');
    if (defaultShipper) {
      this.selectedShipper.set(defaultShipper);
    }

    // Fijar el campo que corresponde al almacén propio según el modo
    if (this.transferMode() === 'ship') {
      this.shiploc.set(this.userDefaultLocation());
    } else {
      this.recloc.set(this.userDefaultLocation());
    }

    this.managerState.clearCurrentProduct();
    this.selectedProduct.set(product);
    this.managerState.loadProductDetail(product.stockid);
  }

  public closeModal(): void {
    this.selectedProduct.set(null);
    this.managerState.clearCurrentProduct();
  }

  public createTransfer(): void {
    if (!this.isFormValid()) return;
    const product = this.selectedProduct();
    if (!product) return;
    const shipper = this.selectedShipper();
    if (!shipper) return;

    const transferData: NewTransfer = {
      stockid: product.stockid,
      shipqty: this.shipqty(),
      shiploc: this.shiploc(),
      recloc: this.recloc(),
      user: this.managerState.currentUser()?.realname || '',
    };

    if (this.isCustomerDelivery()) {
    const customerDelivery: any = {
        customer_name: this.customerName().trim(),
        customer_phone: this.phoneComplete(),  // Teléfono completo concatenado
        customer_address: this.customerAddress().trim(),
        delivery_type: shipper.shippername,
    };
    
    if (!this.isDelivery()) {
        customerDelivery.customer_id = this.customerId().trim();
        customerDelivery.shipping_carrier = this.shippingCarrier().trim();
    }
    
    transferData.customer_delivery = customerDelivery;
}

    this.managerState.setNewTransfer(transferData);
    this.managerState.executeNewTransfer();
    this.closeModal();
    this.router.navigate(['/transfers']);
  }

  public goBack(): void {
    this.router.navigate(['/transfers']);
  }
}