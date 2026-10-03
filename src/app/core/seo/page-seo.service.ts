import { Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) this.set('NavStreet', 'Home listings, education and real estate services on NavStreet.');
    });
  }

  set(title: string, description: string, noIndex = false): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: noIndex ? 'noindex, follow' : 'index, follow' });
  }
}
