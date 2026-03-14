import { Component, inject, signal } from '@angular/core';
import { Router } from 'express';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  styles: ``,
})

export class NotFound {
  private router = inject(Router);
  // Signal que captura la URL que causó el 404
  urlFallida = signal(this.router.url); 
}
