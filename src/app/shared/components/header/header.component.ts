import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Cabeçalho global da aplicação. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a routerLink="/events" class="flex items-center gap-2 text-lg font-bold text-brand">
          🎟️ <span>Ticketfull</span>
        </a>
        <nav class="flex items-center gap-4 text-sm font-medium text-gray-600">
          <a routerLink="/events" class="hover:text-brand">Eventos</a>
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {}
