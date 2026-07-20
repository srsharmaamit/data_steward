import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, DEMO_ACCOUNTS } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="split">
    <aside class="story">
      <div class="brand"><span class="mark">DS</span> DataSteward <em>Hub</em></div>
      <h1>Every correction,<br>on the record.</h1>
      <p class="sub">The staging area between raw ingest and your governed lake.
         Review flagged records, fix them in place, and publish with a second pair of eyes —
         every change written to an immutable ledger.</p>
      <div class="ledger">
        <div class="row"><span class="fld">R-0005 · country</span><span><s>UK</s> <b class="arr">→</b> <b>GB</b></span></div>
        <div class="row"><span class="fld">R-0002 · email</span><span><s>&#64;exmaple.com</s> <b class="arr">→</b> <b>&#64;example.com</b></span></div>
        <div class="row"><span class="fld">R-0102 · riskRating</span><span><s>HIGH</s> <b class="arr">→</b> <b>MEDIUM</b></span></div>
      </div>
    </aside>

    <main class="pane">
      <form class="card" (ngSubmit)="submit()">
        <h2>Sign in</h2>
        <p class="hint">tenant-alpha-bank · session issued as a scoped JWT</p>

        <label for="em">Email</label>
        <input id="em" name="em" type="email" [(ngModel)]="email" autocomplete="username" placeholder="you&#64;alpha.bank">

        <label for="pw">Password</label>
        <input id="pw" name="pw" type="password" [(ngModel)]="password" autocomplete="current-password" placeholder="demo123">

        <p class="err" *ngIf="error">{{ error }}</p>

        <button class="btn primary go" type="submit">Sign in</button>

        <div class="demo">
          <span class="demo-title">Demo accounts — password <code>demo123</code></span>
          <button type="button" *ngFor="let a of accounts" (click)="fill(a.email)">
            <span class="nm">{{ a.name }}</span>
            <span class="tt">{{ a.title }}</span>
          </button>
        </div>
      </form>
    </main>
  </div>
  `,
  styles: [`
    .split { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
    .story { background: var(--ink); color: #E9EDEA; padding: 48px 52px; display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 600; font-size: 17px; }
    .brand em { font-style: normal; color: #9FB8AF; font-weight: 500; }
    .mark { background: var(--verdigris); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 13px; font-weight: 700; }
    h1 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 44px); line-height: 1.12; font-weight: 700; margin: 14vh 0 16px; }
    .sub { color: #A9B6BF; font-size: 14.5px; line-height: 1.6; max-width: 44ch; margin: 0 0 34px; }
    .ledger { font-family: var(--font-data); font-size: 12.5px; border-top: 1px solid #24313E; max-width: 420px; }
    .ledger .row { display: flex; justify-content: space-between; gap: 16px; padding: 9px 2px; border-bottom: 1px dashed #24313E; }
    .fld { color: #7D8C98; }
    .ledger s { color: #E06A74; text-decoration-color: #E06A74; }
    .ledger b { color: #2FB89A; font-weight: 600; }
    .ledger .arr { color: #7D8C98; font-weight: 400; }

    .pane { display: flex; align-items: center; justify-content: center; padding: 32px 20px; background: var(--surface); }
    .card { width: min(400px, 100%); }
    h2 { font-family: var(--font-display); font-size: 21px; margin: 0; color: var(--ink-soft); }
    .hint { font-size: 11.5px; color: var(--text-dim); margin: 6px 0 22px; font-family: var(--font-data); }
    label { display: block; font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
            color: var(--text-dim); font-family: var(--font-display); margin: 14px 0 5px; }
    input { width: 100%; border: 1px solid var(--line-strong); border-radius: 7px; padding: 10px 12px;
            font-size: 13.5px; background: var(--cell); color: var(--text); }
    input:focus { border-color: var(--verdigris); outline: none; }
    .err { color: var(--claret); font-size: 12.5px; margin: 12px 0 0; }
    .go { width: 100%; margin-top: 20px; padding: 11px; }
    .demo { margin-top: 26px; border-top: 1px dashed var(--line-strong); padding-top: 16px; display: flex; flex-direction: column; gap: 7px; }
    .demo-title { font-size: 11px; color: var(--text-dim); margin-bottom: 3px; }
    .demo-title code { font-family: var(--font-data); background: var(--verdigris-soft); color: var(--verdigris); border-radius: 4px; padding: 1px 5px; }
    .demo button { display: flex; justify-content: space-between; gap: 10px; text-align: left; background: var(--cell);
                   border: 1px solid var(--line); border-radius: 7px; padding: 9px 12px; color: var(--text); }
    .demo button:hover { border-color: var(--verdigris); }
    .nm { font-weight: 600; font-size: 12.5px; }
    .tt { font-size: 11px; color: var(--text-dim); }

    @media (max-width: 860px) {
      .split { grid-template-columns: 1fr; }
      .story { padding: 30px 24px; }
      h1 { margin-top: 20px; font-size: 28px; }
      .ledger { display: none; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  accounts = DEMO_ACCOUNTS;
  email = '';
  password = '';
  error: string | null = null;

  fill(email: string) { this.email = email; this.password = 'demo123'; }

  submit() {
    this.error = this.auth.login(this.email, this.password);
    if (!this.error) this.router.navigate(['/dashboard']);
  }
}
