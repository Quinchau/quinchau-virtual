// src/app/pages/orders/orders.ts

import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { Shipper } from '../../models/transfer.model';
import { ProductPicker } from '../../components/product-picker/product-picker';
import {
    CustomerResult,
    CustomerDisplay,
    CreateOrderPayload,
    OrderLine,
    AddLinePayload,
    UpdateLinePayload,
    WarehouseOption,
    StockLocation,
} from '../../models/orders.models';
import { ManagerState } from '../../services/manager-state';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, FormsModule, ProductPicker],
    templateUrl: './orders.html',
    styles: ``
})
export class Orders implements OnDestroy {

    private apis = inject(ManagerApis);
    public state = inject(ManagerState);
    private router = inject(Router); 

    public readonly userLocation = this.state.userLocation;
    
    readonly loadingSearch = signal(false);
    readonly loadingConfirm = signal(false);
    readonly loadingAddLine = signal(false);
    readonly loadingWarehouses = signal(false);
    readonly searchError = signal('');
    readonly addLineError = signal('');
    readonly successMessage = signal('');
    
    readonly sec1State = signal<'search' | 'confirm' | 'shiploc' | 'frozen'>('search');
    readonly addLineState = signal<'idle' | 'loading' | 'awaiting_stock_selection' | 'awaiting_multi_stock_selection'>('idle');    
    readonly customerResults = signal<CustomerDisplay[]>([]);
    readonly selectedCustomer = signal<CustomerDisplay | null>(null);
    readonly selectedBranch = signal<CustomerResult | null>(null);
    readonly warehouseOptions = signal<WarehouseOption[]>([]);
    readonly selectedShiploc = signal<string | null>(null);
    readonly orderno = signal<number | null>(null);
    readonly lines = signal<OrderLine[]>([]);
    
    readonly pendingStockOptions = signal<StockLocation[]>([]);
    readonly pendingProductCode = signal('');
    readonly pendingProductQuantity = signal(1);
    readonly pendingProductDiscount = signal(0);
    
    readonly showErrorModal = signal(false);
    readonly errorModalTitle = signal('');
    readonly errorModalMessage = signal('');
    readonly showProductPicker = signal(false);
    readonly pendingProduct = signal<any>(null);
    readonly pendingQty = signal(1);
    
    // ============================================
    // PROPIEDADES PARA DESPACHO DIRECTO SIMPLIFICADO
    // ============================================
    
    // Única casilla de verificación para despacho directo al cliente
    public readonly isDirectShipping = signal<boolean>(false);
    
    // Datos del cliente para envío
    public readonly customerName = signal<string>('');
    public readonly customerPhonePrefix = signal<string>('0412');
    public readonly customerPhoneNumber = signal<string>('');
    public readonly customerId = signal<string>('');
    public readonly customerAddress = signal<string>('');
    public readonly shippingCarrier = signal<string>('');
    
    // Shippers (métodos de envío)
    public readonly shippers = signal<Shipper[]>([]);
    public readonly loadingShippers = signal<boolean>(false);
    public readonly selectedShipper = signal<Shipper | null>(null);
    public readonly orderComment = signal<string>('');

    // ── Campos del formulario ─────────────────────────────────
    phoneInput = '';
    productDiscount = 0;

    public readonly phonePrefixes = [
        { value: '0412', label: '0412' },
        { value: '0414', label: '0414' },
        { value: '0416', label: '0416' },
        { value: '0422', label: '0422' },
        { value: '0424', label: '0424' },
        { value: '0426', label: '0426' }
    ];

    // ============================================
    // COMPUTED PROPERTIES
    // ============================================

    readonly sec2Active = computed(() => this.orderno() !== null);
    
    readonly transfersPending = computed(() =>
        this.lines().some(l => l.transferStatus === 'pending')
    );

    readonly summarySubtotal = computed(() =>
        this.lines().reduce((acc, l) => acc + l.line_total, 0)
    );

    readonly summaryTotal = computed(() =>
        this.lines().reduce((acc, l) => acc + l.line_total, 0)
    );

     readonly canSaveOrder = computed(() =>
    this.sec2Active() && this.lines().length > 0
    );

    // Almacenes que NO son del usuario (para despacho desde otro almacén)
    public readonly otherWarehouses = computed(() => {
        const userLoc = this.userLocation();
        return this.warehouseOptions().filter(wh => wh.stkloc !== userLoc);
    });

    // Teléfono completo
    public readonly customerPhoneComplete = computed(() => {
        const number = this.customerPhoneNumber();
        if (!number || number.length !== 7) return '';
        return `${this.customerPhonePrefix()}${number}`;
    });

    // Validar teléfono
    public readonly isPhoneNumberValid = computed(() => {
        return /^\d{7}$/.test(this.customerPhoneNumber());
    });

    // Verificar si es DELIVERY
    public readonly isDelivery = computed(() => {
        return this.selectedShipper()?.shippername === 'DELIVERY';
    });

        public readonly isDirectShippingFormValid = computed(() => {
        if (!this.isDirectShipping()) return true;
        
        const hasShiploc = this.selectedShiploc() !== null;
        const hasShipper = this.selectedShipper() !== null;
        const hasName = this.customerName()?.trim().length > 0;
        const hasPhone = this.customerPhoneComplete().length === 11;
        const hasAddress = this.customerAddress()?.trim().length > 0;
        
        // ✅ Campos obligatorios para TODOS los métodos de envío
        if (!hasShiploc || !hasShipper || !hasName || !hasPhone || !hasAddress) {
            return false;
        }
        
        // ✅ Ya no validamos customerId ni shippingCarrier
        // El cliente ya está identificado por debtorno + branchcode
        return true;
    });

    public readonly isCreateOrderDisabled = computed(() => {
    if (this.loadingConfirm()) return true;
    if (this.isDirectShipping()) {
        return !this.isDirectShippingFormValid();
    }
    // ✅ Para recogida en tienda, siempre habilitado (ya tiene cliente)
    return false;
});

    public readonly totalDistributed = computed(() => {
    return this.pendingStockOptions().reduce((sum, loc) => sum + (loc.selectedQty || 0), 0);
});

    public readonly totalStockAvailable = computed(() => {
    return this.pendingStockOptions().reduce((sum, loc) => sum + loc.available, 0);
});

    // ============================================
    // LIFECYCLE
    // ============================================

    ngOnInit(): void {
        this.loadShippers();
    }

    ngOnDestroy(): void {
        const orderno = this.orderno();
        const hasLines = this.lines().length > 0;
        if (orderno && !hasLines) {
            this.apis.deleteOrder(orderno).subscribe({ error: () => { } });
        }
    }

    // ============================================
    // SHIPPERS
    // ============================================

    private loadShippers(): void {
        this.loadingShippers.set(true);
        this.apis.getShippers().subscribe({
            next: (response: any) => {
                if (response.exito && response.shippers) {
                    this.shippers.set(response.shippers);
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

    public compareShippers(s1: Shipper | null, s2: Shipper | null): boolean {
        return s1?.shipper_id === s2?.shipper_id;
    }

    // ============================================
    // PRODUCT PICKER
    // ============================================

    openProductPicker(): void {
        this.showProductPicker.set(true);
    }

    closeProductPicker(): void {
        this.showProductPicker.set(false);
    }

    incrementPendingQty(): void {
    const max = this.pendingProduct()?.total_quantity ?? 999;
    this.pendingQty.update(q => Math.min(q + 1, max));
}

decrementPendingQty(): void {
    this.pendingQty.update(q => Math.max(q - 1, 1));
}

confirmPendingProduct(): void {
    const product = this.pendingProduct();
    if (!product) return;
    this.productDiscount = 0;
    // Guardamos código y cantidad donde checkStockAvailability los lee
    this.pendingProduct.set(null);
    this.checkStockAvailabilityFor(
        product.stkcode ?? product.stockid,
        this.pendingQty()
    );
}

cancelPendingProduct(): void {
    this.pendingProduct.set(null);
    this.pendingQty.set(1);
}

    onProductPicked(product: any): void {
    this.showProductPicker.set(false);
    this.pendingProduct.set(product);
    this.pendingQty.set(1);
    this.addLineError.set('');
    }

    // ============================================
    // SECCIÓN 1 — CLIENTE
    // ============================================

    searchCustomer(): void {
        if (this.phoneInput.trim().length < 5) {
            this.searchError.set('Ingrese al menos 5 dígitos.');
            return;
        }
        this.searchError.set('');
        this.loadingSearch.set(true);
        this.customerResults.set([]);
        this.selectedCustomer.set(null);
        this.selectedBranch.set(null);
        this.sec1State.set('search');

        this.apis.searchCustomerByPhone(this.phoneInput.trim()).subscribe({
            next: (res) => {
                this.loadingSearch.set(false);

                if (!res.exito || !res.data?.length) {
                    this.searchError.set('No se encontró ningún cliente con ese número.');
                    return;
                }

                const map = new Map<string, CustomerDisplay>();

                for (const row of res.data) {
                    if (!map.has(row.debtorno)) {
                        map.set(row.debtorno, {
                            debtorno: row.debtorno,
                            name: row.name,
                            taxref: row.taxref,
                            area: row.area,
                            salesman: row.salesman,
                            phoneno: row.phoneno,
                            branches: [row],
                        });
                    } else {
                        const existing = map.get(row.debtorno)!;
                        existing.branches.push(row);
                        if (row.name && row.name.length < existing.name.length) {
                            existing.name = row.name;
                        }
                    }
                }

                this.customerResults.set(Array.from(map.values()));
                this.sec1State.set('confirm');
            },
            error: () => {
                this.loadingSearch.set(false);
                this.searchError.set('Error al conectar con el servidor.');
            }
        });
    }

    selectCustomer(customer: CustomerDisplay): void {
        this.selectedCustomer.set(customer);
        this.selectedBranch.set(null);
        this.searchError.set('');
    }

    confirmCustomer(): void {
        const customer = this.selectedCustomer();
        
        if (!customer) {
            this.searchError.set('Por favor, seleccione un cliente de la lista.');
            return;
        }

        const salesmanLocation = this.state.userLocation();
        
        const validBranch = customer.branches.find(b => b.defaultlocation === salesmanLocation);
        
        if (!validBranch) {
            this.errorModalTitle.set('Cliente no registrado en su almacén');
            this.errorModalMessage.set(
                `⚠️ El cliente "${customer.name}" (${customer.debtorno}) aún no está registrado en su almacén "${salesmanLocation}".\n\n` +
                `Para continuar, debe registrar una sucursal para este cliente en su almacén.`
            );
            this.showErrorModal.set(true);
            return;
        }

        this.selectedBranch.set(validBranch);
        this.sec1State.set('shiploc');
        this.loadWarehouses();
    }

    changeCustomer(): void {
        const confirmed = this.lines().length > 0
            ? confirm('¿Cambiar de cliente? Se perderán las líneas del pedido actual.')
            : true;

        if (!confirmed) return;

        const order = this.orderno();
        if (order) {
            this.apis.deleteOrder(order).subscribe({ error: () => { } });
        }

        this.resetAll();
    }

    goToCustomerManagement(): void {
        this.showErrorModal.set(false);
        this.router.navigate(['/customer'], {
            queryParams: {
                debtorno: this.selectedCustomer()?.debtorno,
                name: this.selectedCustomer()?.name
            }
        });
    }

    // ============================================
    // SELECCIÓN DE ALMACENES
    // ============================================

    loadWarehouses(): void {
        this.loadingWarehouses.set(true);
        this.apis.getWarehouses().subscribe({
            next: (res) => {
                this.warehouseOptions.set(res.data);
                this.loadingWarehouses.set(false);
            },
            error: () => {
                this.loadingWarehouses.set(false);
                this.searchError.set('Error al cargar almacenes');
            }
        });
    }

    // ============================================
    // CREAR PEDIDO
    // ============================================
    public createOrder(): void {
    if (this.isDirectShipping()) {
        this.createOrderWithDirectShipping();
    } else {
        this.createOrderNormal();
    }
}

    private createOrderNormal(): void {
    const branch = this.selectedBranch();
    if (!branch) {
        console.error('No hay branch seleccionado');
        this.searchError.set('Falta información del cliente');
        return;
    }

    const shiploc = this.userLocation();
    if (!shiploc) {
        this.searchError.set('No se pudo determinar el almacén del vendedor');
        return;
    }

    this.loadingConfirm.set(true);

    const deliveryDate = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

    console.log('📦 Creando pedido normal (recogida en tienda)', {
        debtorno: branch.debtorno,
        branchcode: branch.branchcode,
        shiploc,
    });

    const payload: CreateOrderPayload = {
        debtorno: branch.debtorno,
        branchcode: branch.branchcode,
        ordertype: branch.salestype || '01',
        shipvia: 1,
        deliverydate: deliveryDate,
        comments: '',
        shiploc: shiploc
    };

    this.apis.createOrder(payload).subscribe({
        next: (res) => {
            this.loadingConfirm.set(false);
            if (!res.exito) {
                this.searchError.set(res.mensaje || 'Error al crear pedido');
                return;
            }
            this.orderno.set(res.data.orderno);
            this.sec1State.set('frozen');
            console.log('✅ Pedido creado:', res.data.orderno);
        },
        error: (err) => {
            this.loadingConfirm.set(false);
            console.error('❌ Error:', err);
            this.searchError.set(err?.error?.mensaje || 'Error al conectar');
        }
    });
}

    private createOrderWithDirectShipping(): void {
    if (!this.isDirectShippingFormValid()) return;

    const shiploc = this.selectedShiploc();
    const branch = this.selectedBranch();
    if (!shiploc || !branch) return;

    this.loadingConfirm.set(true);

    const deliveryDate = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

    let comments = this.orderComment().trim();
    if (!this.isDelivery() && this.shippingCarrier()) {
        const transportistaMsg = `Transportista: ${this.shippingCarrier()}`;
        comments = comments 
            ? `${transportistaMsg}. ${comments}`
            : transportistaMsg;
    }

    const payload: CreateOrderPayload = {
        debtorno: branch.debtorno,
        branchcode: branch.branchcode,
        ordertype: branch.salestype || '01',
        shipvia: this.selectedShipper()?.shipper_id || 6,
        deliverydate: deliveryDate,
        comments: comments,                           // ← Comentario libre + transportista
        shiploc: shiploc,
        deliverto: this.customerName().trim(),        // ← Nombre del destinatario
        contactphone: this.customerPhoneComplete(),   // ← Teléfono
        deladd1: this.customerAddress().trim(),       // ← Dirección de entrega
        deladd2: '',
        deladd3: '',
        is_different_shipping_address: true
    };

    console.log('📦 Creando pedido con despacho directo:', {
        orderno: 'nuevo',
        shiploc,
        shipvia: this.selectedShipper()?.shippername,
        deliverto: payload.deliverto,
        contactphone: payload.contactphone,
        deladd1: payload.deladd1,
        comments: payload.comments
    });

    this.apis.createOrder(payload).subscribe({
        next: (res) => {
            this.loadingConfirm.set(false);
            if (!res.exito) {
                this.searchError.set(res.mensaje || 'Error al crear pedido');
                return;
            }
            this.orderno.set(res.data.orderno);
            this.sec1State.set('frozen');
            
            this.successMessage.set(
                `✅ Pedido #${res.data.orderno} creado\n` +
                `🚚 Envío: ${this.selectedShipper()?.shippername}\n` +
                `📍 Destino: ${this.customerAddress().substring(0, 50)}...`
            );
            setTimeout(() => this.successMessage.set(''), 5000);
        },
        error: (err) => {
            this.loadingConfirm.set(false);
            this.searchError.set(err?.error?.mensaje || 'Error al conectar');
            console.error('❌ Error al crear pedido:', err);
        }
    });
}

    // ============================================
    // SECCIÓN 2 — LÍNEAS
    // ============================================

    checkStockAvailabilityFor(stkcode: string, quantity: number): void {
    const orderno = this.orderno();
    if (!orderno) return;
    if (!stkcode.trim()) {
        this.addLineError.set('Código de producto inválido.');
        return;
    }
    this.addLineState.set('loading');
    this.addLineError.set('');
    this.apis.checkStockAvailability(orderno, stkcode.trim(), quantity).subscribe({
        next: (res) => {
            const stock = res.data;
            if (stock.autoTransfer && stock.autoSource) {
                console.log(`✅ Transferencia automática desde ${stock.autoSource}`);
                this.addLineWithSourceloc(stkcode.trim(), quantity, stock.autoSource);
            }
            else if (!stock.requiresSelection && !stock.autoTransfer) {
                console.log('✅ Stock suficiente en shiploc, agregando directamente');
                this.addLineWithSourceloc(stkcode.trim(), quantity, null);
            }
            else if (stock.requiresSelection && stock.locations?.length > 0) {
                console.log(`📋 Múltiples almacenes disponibles: ${stock.locations.length}`);
                this.pendingProductCode.set(stkcode.trim());
                this.pendingProductQuantity.set(quantity);
                this.pendingProductDiscount.set(this.productDiscount);
                this.pendingStockOptions.set(stock.locations.map(loc => ({...loc, selectedQty: 0})));
                this.addLineState.set('awaiting_multi_stock_selection');
            }
            else {
                this.addLineError.set('No hay stock disponible de este producto en ningún almacén');
                this.addLineState.set('idle');
            }
        },
        error: (err) => {
            this.addLineState.set('idle');
            this.addLineError.set(err?.error?.mensaje || 'Error al verificar stock');
        }
    });
}

public addLineWithMultipleSources(): void {
    const orderno = this.orderno();
    if (!orderno) return;
    
    // Filtrar solo los almacenes con cantidad > 0
    const selectedSources = this.pendingStockOptions().filter(loc => (loc.selectedQty || 0) > 0);
    
    if (selectedSources.length === 0) {
        this.addLineError.set('Debe seleccionar al menos un almacén');
        return;
    }
    
    // Validar que la suma total sea igual a la cantidad solicitada
    const totalSelected = selectedSources.reduce((sum, loc) => sum + (loc.selectedQty || 0), 0);
    if (totalSelected !== this.pendingProductQuantity()) {
        this.addLineError.set(`La suma de cantidades (${totalSelected}) no coincide con la solicitada (${this.pendingProductQuantity()})`);
        return;
    }
    
    this.loadingAddLine.set(true);
    this.addLineError.set('');
    
    // Crear una transferencia por cada almacén seleccionado
    let completed = 0;
    let hasError = false;
    
    for (const source of selectedSources) {
        this.addLineWithSourceloc(
            this.pendingProductCode(), 
            source.selectedQty!, 
            source.stkloc
        ).then(() => {
            completed++;
            if (completed === selectedSources.length && !hasError) {
                this.loadingAddLine.set(false);
                this.addLineState.set('idle');
                this.closeMultiStockModal();
                this.productDiscount = 0;
            }
        }).catch((err: any) => {
            if (!hasError) {
                hasError = true;
                this.loadingAddLine.set(false);
                this.addLineError.set(err?.message || 'Error al crear transferencia');
                this.addLineState.set('idle');
            }
        });
    }
}

    public closeMultiStockModal(): void {
    this.addLineState.set('idle');
    this.pendingStockOptions.set([]);
    this.pendingProductCode.set('');
    this.pendingProductQuantity.set(1);
    this.pendingProductDiscount.set(0);
}

    public updateDistribution(): void {
    const totalSelected = this.totalDistributed();
    const remaining = this.pendingProductQuantity() - totalSelected;
    
    if (remaining < 0) {
        this.addLineError.set('⚠️ La suma no puede superar la cantidad solicitada');
    } else {
        this.addLineError.set('');
    }
}

    public onTotalQuantityChange(): void {
    const maxQty = this.totalStockAvailable();
    let newQty = this.pendingProductQuantity();
    
    if (newQty > maxQty) {
        this.pendingProductQuantity.set(maxQty);
        this.addLineError.set(`⚠️ La cantidad no puede superar el stock disponible (${maxQty})`);
    } else if (newQty < 1) {
        this.pendingProductQuantity.set(1);
    } else {
        this.addLineError.set('');
    }
    
    // Resetear distribuciones
    const resetLocations = this.pendingStockOptions().map(loc => ({
        ...loc,
        selectedQty: 0
    }));
    this.pendingStockOptions.set(resetLocations);
}

    public addLineWithSourceloc(stkcode: string, quantity: number, sourceloc: string | null): Promise<any> {
    const orderno = this.orderno();
    if (!orderno) return Promise.reject('No order number');

    this.loadingAddLine.set(true);
    this.addLineError.set('');

    const payload: AddLinePayload = {
        stkcode: stkcode,
        quantity: quantity,
        discountpercent: this.productDiscount,
        sourceloc: sourceloc || undefined
    };

    return new Promise((resolve, reject) => {
        console.log('📦 Payload addLine:', payload);
        this.apis.addOrderLine(orderno, payload).subscribe({
            next: (res) => {
                this.loadingAddLine.set(false);
                if (!res.exito) {
                    this.addLineError.set(res.mensaje || 'Error al agregar producto');
                    reject(new Error(res.mensaje));
                    return;
                }
                const newLine: OrderLine = {
                    orderlineno: res.data.orderlineno,
                    stkcode: res.data.stkcode,
                    description: res.data.description,
                    units: res.data.units,
                    quantity: res.data.quantity,
                    unitprice: res.data.unitprice,
                    discountpercent: res.data.discountpercent,
                    line_total: res.data.line_total,
                    standardcost: res.data.standardcost,
                    stock_disponible: res.data.stock_disponible,
                    sourceloc: sourceloc || null,
                    transferStatus: sourceloc ? 'pending' : null
                };
                this.lines.update(lines => [...lines, newLine]);
                this.productDiscount = 0;
                this.addLineState.set('idle');
                resolve(res);
            },
            error: (err) => {
                this.loadingAddLine.set(false);
                this.addLineError.set(err?.error?.mensaje || 'Error al conectar');
                reject(err);
            }
        });
    });
}

    updateLine(index: number, field: 'quantity' | 'discountpercent', value: number): void {
        const orderno = this.orderno();
        const line = this.lines()[index];
        if (!orderno || !line) return;

        const payload: UpdateLinePayload = {
            quantity: field === 'quantity' ? value : line.quantity,
            unitprice: line.unitprice,
            discountpercent: field === 'discountpercent' ? value : line.discountpercent,
        };

        this.apis.updateOrderLine(orderno, line.orderlineno, payload).subscribe({
                    next: (res) => {
            if (!res.exito) return;
            const updated = res.data;
            this.lines.update(lines =>
                lines.map((l, i) => i === index ? { 
            ...l, 
            ...updated,
            line_total: updated.quantity * updated.unitprice * (1 - updated.discountpercent)
        } : l)
    );
},
            error: () => { }
        });
    }

    deleteLine(index: number): void {
        const orderno = this.orderno();
        const line = this.lines()[index];
        if (!orderno || !line) return;

        if (line.transferStatus === 'pending') {
            if (!confirm(`⚠️ Esta línea tiene transferencias pendientes.\n¿Eliminar cancelará las transferencias asociadas. Continuar?`)) {
                return;
            }
        } else if (line.transferStatus === 'completed') {
            this.errorModalTitle.set('No se puede eliminar');
            this.errorModalMessage.set('Esta línea ya tiene transferencias ejecutadas. No se puede eliminar.');
            this.showErrorModal.set(true);
            return;
        }

        if (!confirm(`¿Eliminar "${line.description || line.stkcode}" del pedido?`)) return;

        this.apis.deleteOrderLine(orderno, line.orderlineno).subscribe({
            next: () => {
                this.lines.update(lines => lines.filter((_, i) => i !== index));
            },
            error: () => { }
        });
    }

    // ============================================
    // GUARDAR PEDIDO
    // ============================================

    saveOrder(): void {
        if (!this.canSaveOrder()) return;

        this.successMessage.set(`✅ Pedido #${this.orderno()} guardado exitosamente`);
        setTimeout(() => {
            this.resetAll();
        }, 2000);
    }

    // ============================================
    // HELPERS
    // ============================================

    private resetAll(): void {
        this.sec1State.set('search');
        this.customerResults.set([]);
        this.selectedCustomer.set(null);
        this.selectedBranch.set(null);
        this.selectedShiploc.set(null);
        this.orderno.set(null);
        this.lines.set([]);
        this.phoneInput = '';
        this.productDiscount = 0;
        this.searchError.set('');
        this.addLineError.set('');
        this.successMessage.set('');
        this.showProductPicker.set(false);
        this.addLineState.set('idle');
        this.isDirectShipping.set(false);
        this.customerName.set('');
        this.customerPhoneNumber.set('');
        this.customerId.set('');
        this.customerAddress.set('');
        this.shippingCarrier.set('');
        this.selectedShipper.set(null);
        this.orderComment.set('');
    }

    formatCurrency(value: number): string {
        return '$' + value.toFixed(2);
    }

    closeErrorModal(): void {
        this.showErrorModal.set(false);
        this.errorModalTitle.set('');
        this.errorModalMessage.set('');
    }

    closeErrorModalAndReset(): void {
        this.showErrorModal.set(false);
        this.selectedCustomer.set(null);
        this.customerResults.set([]);
        this.sec1State.set('search');
        this.phoneInput = '';
    }

    closeStockModal(): void {
        this.addLineState.set('idle');
        this.pendingStockOptions.set([]);
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    onSearchCustomer(): void { this.searchCustomer(); }
    onConfirmCustomer(): void { this.confirmCustomer(); }
    onChangeCustomer(): void { this.changeCustomer(); }
    onSaveOrder(): void { this.saveOrder(); }
    onSelectCustomer(customer: CustomerDisplay): void { this.selectCustomer(customer); }
    onCreateOrder(): void { this.createOrder(); }  // ← Cambiado: llama a createOrder()

    onUpdateLineQuantity(index: number, event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        if (!isNaN(value)) this.updateLine(index, 'quantity', value);
    }

    onUpdateLineDiscount(index: number, event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value);
        if (!isNaN(value)) this.updateLine(index, 'discountpercent', value);
    }

    onDeleteLine(index: number): void {
        this.deleteLine(index);
    }
}