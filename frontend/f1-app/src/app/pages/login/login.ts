import { Component, signal } from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Estado inicial: true = Login, false = Registro
  isLoginMode = signal<boolean>(true);

  toggleMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
  }

  onLogin() {
    // Lógica de Inicio de Sesión
  }

  onRegister() {
    // Lógica de Registro
  }
}
