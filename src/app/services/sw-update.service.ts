// src/app/services/sw-update.service.ts
import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {

  private readonly swUpdate = inject(SwUpdate);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.handleVersionReady();
    this.handleUnrecoverable();
  }

  private handleVersionReady(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent =>
          event.type === 'VERSION_READY'
        )
      )
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => this.forceReload());
      });
  }

  private handleUnrecoverable(): void {
    this.swUpdate.unrecoverable.subscribe(() => this.forceReload());
  }


  private forceReload(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('_sw', Date.now().toString());
    window.location.replace(url.toString());
  }
}