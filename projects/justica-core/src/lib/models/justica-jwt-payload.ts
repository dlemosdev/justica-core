export interface JusticaJwtPayload {
  exp?: number;
  iat?: number;
  auth_time?: number;
  jti?: string;
  iss?: string;
  sub?: string;
  typ?: string;
  azp?: string;
  nonce?: string;
  session_state?: string;
  acr?: string;
  scope?: string;
  sid?: string;
  usuario: number, // Identificador do usuário
  nome: string, // Nome do usuário
  authorities: string[];
  local: number, // Identificador do local
  nomeLocal: string
  [chave: string]: unknown;
}
