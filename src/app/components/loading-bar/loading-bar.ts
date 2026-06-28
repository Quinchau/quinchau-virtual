// src/app/components/loading-bar/loading-bar.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionStatus } from '../../services/connection-status';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-bar.html',
  })

export class LoadingBar {
  conn = inject(ConnectionStatus);

  constructor() {}
}