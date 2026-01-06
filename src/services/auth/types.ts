export interface ApiLoginResponse {
  status: string;
  message: string;
  token: string;
  token_Type: string;
  expires_At: string;
  idUsuario: number;
  idEmpleado: number | null;
  idRol: number;
  idEmpresa: number | null;
  apiKey: string;
}

export interface ApiDecodeTokenResponse {
  status: string;
  usuario: {
    idUsuario: string;
    login: string;
    email: string;
    idEmpleado: string;
    idRol: string;
    idEmpresa: string;
    apiKey: string;
  };
  expira: string;
}
