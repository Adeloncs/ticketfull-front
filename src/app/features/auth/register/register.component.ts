import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

/** Tela de cadastro (auto-registro: cria sempre um CUSTOMER). */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 class="text-2xl font-bold text-gray-900">Criar conta</h1>
      <p class="mt-1 text-sm text-gray-500">Cadastre-se para comprar ingressos.</p>

      @if (success()) {
        <div class="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Conta criada com sucesso! Redirecionando para o login...
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            @if (isInvalid('email')) {
              <p class="mt-1 text-xs text-red-600">Informe um e-mail válido.</p>
            }
          </div>

          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            @if (isInvalid('password')) {
              <p class="mt-1 text-xs text-red-600">A senha deve ter ao menos 6 caracteres.</p>
            }
          </div>

          @if (error()) {
            <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {{ loading() ? 'Criando...' : 'Criar conta' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-gray-600">
          Já tem conta?
          <a routerLink="/auth/login" class="font-medium text-brand hover:underline">Entrar</a>
        </p>
      }
    </section>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isInvalid(control: 'email' | 'password'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 409
            ? 'Já existe uma conta com este e-mail.'
            : 'Não foi possível criar a conta. Tente novamente.',
        );
        this.loading.set(false);
      },
    });
  }
}
