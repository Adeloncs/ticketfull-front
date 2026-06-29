import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carregamento reutilizável. */
@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 py-10 text-gray-500">
      <span
        class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand"
        aria-hidden="true"
      ></span>
      <span class="text-sm">{{ label() }}</span>
    </div>
  `,
})
export class SpinnerComponent {
  readonly label = input('Carregando...');
}
