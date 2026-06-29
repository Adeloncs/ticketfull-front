import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/** Cabeçalho global da aplicação, com estado de sessão. */
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

          @if (auth.isAuthenticated()) {
            @if (auth.hasAnyRole('ORGANIZER', 'ADMIN')) {
              <a routerLink="/organizer/events" class="hover:text-brand">Organizador</a>
            }
            <a routerLink="/dashboard/orders" class="hover:text-brand">Meus pedidos</a>
            <span class="hidden text-gray-400 sm:inline">{{ auth.userEmail() }}</span>
            <button (click)="logout()" class="hover:text-brand">Sair</button>
          } @else {
            <a routerLink="/auth/login" class="hover:text-brand">Entrar</a>
            <a
              routerLink="/auth/register"
              class="rounded-lg bg-brand px-3 py-1.5 text-white transition hover:bg-brand-dark"
            >
              Cadastrar
            </a>
          }
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/events']),
      error: () => this.router.navigate(['/events']),
    });
  }
}
