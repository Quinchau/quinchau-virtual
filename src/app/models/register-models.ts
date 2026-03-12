/**
 * Lo que enviamos desde el formulario de Angular hacia Node.js
 */
export interface RegisterRequest {
  phone: string;
  password: string;
  realname: string;
  email?: string;
  guest_id?: string; // <-- El ID de la sesión de invitado
}

/**
 * El objeto de usuario que retorna Node.js
 */
export interface NodeUser {
  id: string;   // Es el phone/userid
  name: string; // realname
  access: number;
}

/**
 * La respuesta completa que entrega tu API de Node.js
 */
export interface RegisterResponse {
  status: 'Success' | 'Error';
  message: string;
  auth_token?: string; // El JWT de 30 días
  user?: NodeUser;
  details?: string;    // Para errores de base de datos
}