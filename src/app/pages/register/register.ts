import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private state = inject(ManagerState);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Lista de prefijos solicitados
  phoneAreas = ['412', '422', '424', '414', '416', '426'];

  registerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    area: ['412', [Validators.required]],
    phoneNum: ['', [Validators.required, Validators.pattern(/^[0-9]{7}$/)]], // Exactamente 7 dígitos
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator }); // Validación de coincidencia

  // Validador personalizado para las contraseñas
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.registerForm.value;
    
    const requestData = {
      realname: `${raw.firstName} ${raw.lastName}`,
      phone: `${raw.area}${raw.phoneNum}`, // Concatenamos prefijo + número
      email: raw.email!,
      password: raw.password!,
      guest_id: this.state.guestIdSignal() || undefined
    };

    this.state.executeRegister(requestData).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error en el registro');
        this.isLoading.set(false);
      }
    });
  }
}