import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  })
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router); 
  public loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
  if (this.loginForm.invalid) return;

  const credentials = this.loginForm.value;

  this.authService.login(credentials).subscribe({
    next: () => {
      this.router.navigate(['/home']); // o la ruta que prefieras
    },
    error: (err) => {
      console.error('Error al iniciar sesión:', err);
      // podrías mostrar un mensaje al usuario aquí
    }
  });
}

}