import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ProductImageUploaderComponent, ImageItem } from '../../pages/product-image-uploader/product-image-uploader';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProductImageUploaderComponent],
  templateUrl: './product-create.html'
})
export class ProductCreatePage implements OnInit {
  productForm: FormGroup;
  categories: any[] = [];
  units: any[] = [];
  taxCategories: any[] = [];
  images: ImageItem[] = [];
  loading = false;
  tempStockId = 'temp';

  constructor(
    private fb: FormBuilder,
    private apis: ManagerApis,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      stockid: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]+$/), Validators.maxLength(20)]],
      description: ['', [Validators.required, Validators.maxLength(50)]],
      longdescription: ['', Validators.required],
      descriptionUS: ['', [Validators.required, Validators.maxLength(50)]],
      longdescriptionUS: ['', Validators.required],
      categoryid: ['', Validators.required],
      mbflag: ['A', Validators.required],
      units: ['', Validators.required],
      taxcatid: ['1', Validators.required],
      costo: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
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
      fabricante_url: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadUnits();
    this.loadTaxCategories();
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

  loadCategories() {
  this.apis.getProductCategories().subscribe({
    next: (res: any) => this.categories = res,
    error: (err: any) => console.error('Error al cargar categorías:', err)
  });
}

loadUnits() {
  this.apis.getUnits().subscribe({
    next: (res: any) => this.units = res,
    error: (err: any) => console.error('Error al cargar unidades:', err)
  });
}

loadTaxCategories() {
  this.apis.getTaxCategories().subscribe({
    next: (res: any) => this.taxCategories = res,
    error: (err: any) => console.error('Error al cargar impuestos:', err)
  });
}

  onImagesChanged(images: ImageItem[]) {
    this.images = images.filter(img => img.status === 'done');
  }

  onSubmit() {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.images.length === 0) {
      alert('Debe subir al menos una imagen');
      return;
    }

    this.loading = true;

    const formValue = {
      ...this.productForm.value,
      discontinued: this.productForm.value.discontinued ? '1' : '0',
      controlled: this.productForm.value.controlled ? '1' : '0',
      serialised: this.productForm.value.serialised ? '1' : '0',
      perishable: this.productForm.value.perishable ? '1' : '0',
      fabricante_url: this.fabricante_urlArray.value.filter((u: string) => u && u.trim() !== '')
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(formValue));

    for (const image of this.images) {
      if (image.file) {
        formData.append('images', image.file);
      }
    }

    this.apis.createProduct(formData).subscribe({
      next: () => {
        this.loading = false;
        alert('Producto creado exitosamente');
        this.router.navigate(['/product-admin']);
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.error || 'Error al crear producto');
      }
    });
  }
}