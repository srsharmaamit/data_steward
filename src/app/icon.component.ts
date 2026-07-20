import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icons';

@Component({
  selector: 'i-lucide',
  standalone: true,
  template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    style="width:100%;height:100%" [innerHTML]="html"></svg>`,
  host: { '[class]': '"inline-block shrink-0 " + (name === "loader" ? "icon-spin " : "") + klass' },
  styles: [':host{line-height:0}']
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);
  name = '';
  klass = 'h-4 w-4';
  html: SafeHtml = '';

  @Input('name') set setName(n: string) {
    this.name = n;
    this.html = this.sanitizer.bypassSecurityTrustHtml(ICONS[n] ?? '');
  }
  @Input('class') set setClass(c: string) { this.klass = c || 'h-4 w-4'; }
}
