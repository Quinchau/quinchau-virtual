import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerApis } from '../../services/manager-apis';
import { environment } from '../../../environments/environment';
import { ProductImageEditor } from '../../pages/product-image-editor/product-image-editor';

export interface ImageItem {
  id?: number;
  url: string;
  file?: File;
  cover: boolean;
  status: 'pending' | 'uploading' | 'done' | 'error';
  retries: number;
}

@Component({
  selector: 'app-product-image-uploader',
  standalone: true,
  imports: [CommonModule, ProductImageEditor],
  templateUrl: './product-image-uploader.html'
})
export class ProductImageUploaderComponent implements OnInit {
  @Input() stockId: string = '';
  @Input() initialImages: ImageItem[] = [];
  @Output() imagesChanged = new EventEmitter<ImageItem[]>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  images: ImageItem[] = [];
  editingImage: ImageItem | null = null;
  
  // ✅ Estado del editor
  editorVisible: boolean = false;
  selectedImageId: number = 0;
  selectedImageUrl: string = '';

  constructor(private apis: ManagerApis) {}

  ngOnInit() {
    this.images = [...this.initialImages];
  }

  openEditor(event: Event, imageId: number) {
  event.stopPropagation();
  event.preventDefault();
  
  this.selectedImageId = imageId;
  // ← usar image.url en lugar de getImageUrl
  const image = this.images.find(img => img.id === imageId);
  this.selectedImageUrl = image?.url || this.getImageUrl(imageId);
  this.editorVisible = true;
}

  // ✅ Cerrar editor
  closeEditor() {
    this.editorVisible = false;
    this.selectedImageId = 0;
    this.selectedImageUrl = '';
  }

  onImageSaved(event: { imageUrl: string; imageId: number }) {
  const image = this.images.find(img => img.id === event.imageId);
  if (image) {
    image.url = `${this.getImageUrl(event.imageId)}?t=${Date.now()}`;
  }
  this.closeEditor();
  this.imagesChanged.emit(this.images);
}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    for (const file of files) {
      const url = URL.createObjectURL(file);
      this.images.push({
        file,
        url,
        cover: this.images.length === 0,
        status: 'pending',
        retries: 0
      });
      this.uploadImage(this.images.length - 1);
    }
    input.value = '';
    this.imagesChanged.emit(this.images);
  }

  async uploadImage(index: number) {
    const image = this.images[index];
    if (!image.file || !this.stockId || this.stockId === 'temp') {
      image.status = 'done';
      this.imagesChanged.emit(this.images);
      return;
    }
    
    image.status = 'uploading';
    
    try {
      const result = await this.apis.addProductImage(this.stockId, image.file).toPromise();
      image.id = result.imageId;
      image.status = 'done';
      delete image.file;
      
      if (image.cover && this.images.filter(i => i.cover).length === 1 && image.id) {
        await this.apis.setPrimaryImage(this.stockId, image.id).toPromise();
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      image.status = 'error';
    }
    
    this.imagesChanged.emit(this.images);
  }

  async setPrimary(imageId: number) {
    if (!this.stockId || this.stockId === 'temp') {
      this.images.forEach(img => img.cover = false);
      const img = this.images.find(i => i.id === imageId);
      if (img) img.cover = true;
      this.imagesChanged.emit(this.images);
      return;
    }
    
    try {
      await this.apis.setPrimaryImage(this.stockId, imageId).toPromise();
      this.images.forEach(img => img.cover = false);
      const img = this.images.find(i => i.id === imageId);
      if (img) img.cover = true;
      this.imagesChanged.emit(this.images);
    } catch (error) {
      console.error('Error al marcar principal', error);
      alert('Error al marcar imagen como principal');
    }
  }

  async deleteImage(imageId: number) {
    if (this.images.length <= 1) {
      alert('El producto debe tener al menos una imagen');
      return;
    }
    
    if (this.stockId && this.stockId !== 'temp') {
      try {
        await this.apis.deleteProductImage(this.stockId, imageId).toPromise();
      } catch (error) {
        console.error('Error al eliminar imagen', error);
        alert('Error al eliminar imagen');
        return;
      }
    }
    
    this.images = this.images.filter(img => img.id !== imageId);
    
    const hasCover = this.images.some(img => img.cover);
    if (!hasCover && this.images.length > 0 && this.images[0].id) {
      await this.setPrimary(this.images[0].id);
    } else if (!hasCover && this.images.length > 0) {
      this.images[0] = { ...this.images[0], cover: true };
      this.imagesChanged.emit([...this.images]);
    }
    
    this.imagesChanged.emit([...this.images]);
  }

  retryUpload(image: ImageItem) {
    const index = this.images.indexOf(image);
    if (index !== -1) {
      this.uploadImage(index);
    }
  }

  getImageUrl(imageId: number): string {
    const digits = imageId.toString().split('');
    return `${environment.imgProductsUrl}/${digits.join('/')}/${imageId}.jpg`;
  }
}