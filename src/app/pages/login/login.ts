import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Misma lista de prefijos que en registro
  phoneAreas = ['412', '422', '424', '414', '416', '426'];

  loginForm = this.fb.group({
    area: ['412', [Validators.required]],
    phoneNum: ['', [Validators.required, Validators.pattern(/^[0-9]{7}$/)]], // Exactamente 7 dígitos
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    // Podrías precargar algo si es necesario
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.loginForm.value;
    
    // Construimos el teléfono igual que en registro
    const credentials = {
      phone: `${raw.area}${raw.phoneNum}`, // Concatenamos prefijo + número
      password: raw.password!
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al iniciar sesión. Verifica tus datos.');
        this.isLoading.set(false);
      }
    });
  }
}