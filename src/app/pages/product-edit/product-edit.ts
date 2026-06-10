import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ProductImageUploaderComponent, ImageItem } from '../../pages/product-image-uploader/product-image-uploader';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProductImageUploaderComponent],
  templateUrl: './product-edit.html'
})
export class ProductEditPage implements OnInit {
  private fb = inject(FormBuilder);
  private apis = inject(ManagerApis);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productForm: FormGroup;
  stockId = '';
  loading = signal(false);
  loadingProduct = signal(true);
  categories: any[] = [];
  units: any[] = [];
  taxCategories: any[] = [];
  images: ImageItem[] = [];

  sections: Record<string, boolean> = {
    descripcion: true,
    clasificacion: true,
    precios: false,
    logistica: false,
    flags: false,
    fabricante: false,
    imagenes: false
  };

  toggleSection(key: string) {
    this.sections[key] = !this.sections[key];
  }

  constructor() {
    this.productForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(50)]],
      longdescription: ['', Validators.required],
      descriptionUS: ['', [Validators.required, Validators.maxLength(50)]],
      longdescriptionUS: ['', Validators.required],
      categoryid: ['', Validators.required],
      mbflag: ['A', Validators.required],
      units: ['', Validators.required],
      taxcatid: ['1', Validators.required],
      costo: [0, [Validators.required, Validators.min(0)]],
      price01: [0, [Validators.required, Validators.min(0)]],
      price02: [0, [Validators.required, Validators.min(0)]],
      price03: [0, [Validators.required, Validators.min(0)]],
      eoq: [0, [Validators.min(0)]],
      volume: [0, [Validators.min(0)]],
      kgs: [0, [Validators.min(0)]],
      barcode: ['', Validators.maxLength(20)],
      location: ['', Validators.maxLength(20)],
      minimo: [3, [Validators.min(0)]],
      discontinued: [false],
      controlled: [false],
      serialised: [false],
      perishable: [false],
      offers: [false],
      fabricante_url: this.fb.array([])
    });
  }

  get fabricante_urlArray() {
    return this.productForm.get('fabricante_url') as FormArray;
  }

  addFabricanteUrl() {
    this.fabricante_urlArray.push(this.fb.control(''));
  }

  removeFabricanteUrl(index: number) {
    this.fabricante_urlArray.removeAt(index);
  }

  // Métodos para calcular márgenes
  calcularMargen01(): number {
    const precio = this.productForm?.get('price01')?.value || 0;
    const costo = this.productForm?.get('costo')?.value || 0;
    if (precio <= 0 || costo <= 0) return 0;
    return ((precio - costo) / precio) * 100;
  }

  calcularMargen02(): number {
    const precio = this.productForm?.get('price02')?.value || 0;
    const costo = this.productForm?.get('costo')?.value || 0;
    if (precio <= 0 || costo <= 0) return 0;
    return ((precio - costo) / precio) * 100;
  }

  calcularMargen03(): number {
    const precio = this.productForm?.get('price03')?.value || 0;
    const costo = this.productForm?.get('costo')?.value || 0;
    if (precio <= 0 || costo <= 0) return 0;
    return ((precio - costo) / precio) * 100;
  }

  ngOnInit() {
    this.stockId = this.route.snapshot.params['stockId'];
    this.loadCategories();
    this.loadUnits();
    this.loadTaxCategories();
    this.loadProduct();
  }

  loadCategories() {
    this.apis.getProductCategories().subscribe({
      next: (res: any) => {
        this.categories = res;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar categorías:', err)
    });
  }

  loadUnits() {
    this.apis.getUnits().subscribe({
      next: (res: any) => {
        this.units = res;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar unidades:', err)
    });
  }

  loadTaxCategories() {
    this.apis.getTaxCategories().subscribe({
      next: (res: any) => {
        this.taxCategories = res;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar impuestos:', err)
    });
  }

  loadProduct() {
    this.loadingProduct.set(true);
    
    this.apis.getProductAdmin(this.stockId).subscribe({
      next: (res: any) => {
        const formValue = {
          description: res.description || '',
          longdescription: res.longdescription || '',
          descriptionUS: res.descriptionUS || '',
          longdescriptionUS: res.longdescriptionUS || '',
          categoryid: res.categoryid || '',
          mbflag: res.mbflag || 'B',
          units: res.units || 'u',
          taxcatid: res.taxcatid || '1',
          costo: parseFloat(res.costo) || 0,
          price01: parseFloat(res.price01) || 0,
          price02: parseFloat(res.price02) || 0,
          price03: parseFloat(res.price03) || 0,
          eoq: res.eoq || 0,
          volume: res.volume || 0,
          kgs: res.kgs || 0,
          barcode: res.barcode || '',
          location: res.location || '',
          minimo: res.minimo || 3,
          discontinued: res.discontinued === 1 || res.discontinued === '1',
          controlled: res.controlled === 1 || res.controlled === '1',
          serialised: res.serialised === 1 || res.serialised === '1',
          perishable: res.perishable === 1 || res.perishable === '1',
          offers: res.offers === 1 || res.offers === '1',
          };
        
        this.productForm.patchValue(formValue);
        
        // Limpiar y cargar URLs de fabricante
        while (this.fabricante_urlArray.length) {
          this.fabricante_urlArray.removeAt(0);
        }
        if (res.fabricante_url && res.fabricante_url.length > 0) {
          res.fabricante_url.forEach((url: string) => {
            if (url && url.trim() !== '') {
              this.fabricante_urlArray.push(this.fb.control(url));
            }
          });
        }
        
        this.images = res.images.map((img: any) => ({
          id: img.id_image,
          url: `${environment.imgProductsUrl}/${img.id_image.toString().split('').join('/')}/${img.id_image}-home_default.jpg`,
          cover: img.cover === 1,
          status: 'done',
          retries: 0
        }));
        
        this.loadingProduct.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar producto:', err);
        alert('Error al cargar el producto');
        this.router.navigate(['/product-admin']);
        this.loadingProduct.set(false);
      }
    });
  }

  onImagesChanged(images: ImageItem[]) {
    this.images = [...images];
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);

    const formValue = {
      ...this.productForm.value,
      discontinued: this.productForm.value.discontinued ? '1' : '0',
      controlled: this.productForm.value.controlled ? '1' : '0',
      serialised: this.productForm.value.serialised ? '1' : '0',
      perishable: this.productForm.value.perishable ? '1' : '0',
      offers: this.productForm.value.offers ? '1' : '0',
      fabricante_url: this.fabricante_urlArray.value.filter((u: string) => u && u.trim() !== '')
    };

    this.apis.updateProduct(this.stockId, formValue).subscribe({
      next: () => {
        this.loading.set(false);
        alert('✅ Producto actualizado exitosamente');
        this.router.navigate(['/product-admin']);
      },
      error: (err: any) => {
        this.loading.set(false);
        alert(err.error?.error || 'Error al actualizar producto');
      }
    });
  }
}