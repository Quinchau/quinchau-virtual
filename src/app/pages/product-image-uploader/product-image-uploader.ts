import {
  Component, Input, Output, EventEmitter,
  OnInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

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
  imports: [CommonModule, ImageCropperComponent, ProductImageEditor],
  templateUrl: './product-image-uploader.html'
})
export class ProductImageUploaderComponent implements OnInit {
  @Input() stockId: string = '';
  @Input() initialImages: ImageItem[] = [];
  @Output() imagesChanged = new EventEmitter<ImageItem[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  images: ImageItem[] = [];

  // ── Crop preview ──────────────────────────────────────
  cropVisible   = false;
  cropReady     = false;
  pendingFile: File | null = null;
  croppedBase64 = '';

  // ── Editor ────────────────────────────────────────────
  editorVisible        = false;
  selectedImageId      = 0;
  selectedImageUrl     = '';
  selectedImageIsCover = false;

  constructor(private apis: ManagerApis) {}

  ngOnInit() { this.images = [...this.initialImages]; }

  // ── Selección de archivo → abrir crop ────────────────
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.pendingFile   = file;
    this.croppedBase64 = '';
    this.cropReady     = false;
    this.cropVisible   = true;
  }

  onImageCropped(event: ImageCroppedEvent) {
    this.croppedBase64 = event.base64 ?? '';
  }

  async confirmCrop() {
    if (!this.croppedBase64) return;
    const croppedFile = this.base64ToFile(this.croppedBase64, this.pendingFile?.name ?? 'image.jpg');
    this.cropVisible  = false;
    this.pendingFile  = null;

    const newItem: ImageItem = {
      file:    croppedFile,
      url:     URL.createObjectURL(croppedFile),
      cover:   this.images.length === 0,
      status:  'pending',
      retries: 0
    };
    this.images.push(newItem);
    this.imagesChanged.emit(this.images);
    await this.uploadImage(this.images.length - 1);
  }

  cancelCrop() {
    this.cropVisible   = false;
    this.pendingFile   = null;
    this.croppedBase64 = '';
  }

  // ── Click en imagen → abrir editor ───────────────────
  onImageClick(image: ImageItem) {
    if (image.status !== 'done' || !image.id) return;
    this.selectedImageId      = image.id;
    this.selectedImageUrl     = image.url;
    this.selectedImageIsCover = image.cover;
    this.editorVisible        = true;
  }

  closeEditor() {
    this.editorVisible        = false;
    this.selectedImageId      = 0;
    this.selectedImageUrl     = '';
    this.selectedImageIsCover = false;
  }

  onImageSaved(event: { imageUrl: string; imageId: number }) {
    const image = this.images.find(img => img.id === event.imageId);
    if (image) image.url = `${this.getImageUrl(event.imageId)}?t=${Date.now()}`;
    this.closeEditor();
    }

  // Emitido por el editor al eliminar desde adentro
  async onImageDeleted(imageId: number) {
    if (this.images.length <= 1) return; // el editor ya protege esto, por seguridad
    this.images = this.images.filter(img => img.id !== imageId);
    const hasCover = this.images.some(img => img.cover);
    if (!hasCover && this.images.length > 0) {
      if (this.images[0].id) await this.setPrimary(this.images[0].id);
      else { this.images[0].cover = true; }
    }
    this.closeEditor();
    this.imagesChanged.emit([...this.images]);
  }

  // Emitido por el editor al establecer como portada
  async onCoverSet(imageId: number) {
    await this.setPrimary(imageId);
    this.closeEditor();
  }

  // ── Upload ────────────────────────────────────────────
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
      image.id     = result.imageId;
      image.status = 'done';
      delete image.file;
      if (image.cover && this.images.filter(i => i.cover).length === 1 && image.id) {
        await this.apis.setPrimaryImage(this.stockId, image.id).toPromise();
      }
    } catch {
      image.status = 'error';
    }
    this.imagesChanged.emit(this.images);
  }

  retryUpload(image: ImageItem) {
    const index = this.images.indexOf(image);
    if (index !== -1) this.uploadImage(index);
  }

  async setPrimary(imageId: number) {
    if (!this.stockId || this.stockId === 'temp') {
      this.images.forEach(img => img.cover = img.id === imageId);
      this.imagesChanged.emit(this.images);
      return;
    }
    try {
      await this.apis.setPrimaryImage(this.stockId, imageId).toPromise();
      this.images.forEach(img => img.cover = img.id === imageId);
      this.imagesChanged.emit(this.images);
    } catch { alert('Error al marcar imagen como principal'); }
  }

  // ── Helpers ───────────────────────────────────────────
  getImageUrl(imageId: number): string {
    const digits = imageId.toString().split('');
    return `${environment.imgProductsUrl}/${digits.join('/')}/${imageId}.jpg`;
  }

  private base64ToFile(base64: string, filename: string): File {
    const [header, data] = base64.includes(',') ? base64.split(',') : ['data:image/jpeg;base64', base64];
    const mime  = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(data);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  }
}