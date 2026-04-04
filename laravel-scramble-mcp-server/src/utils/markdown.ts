import type { OperationDTO, ParameterDTO } from '../openapi/dto/OpenApiDocumentDTO.js';

// ──────────────────────────────────────────────────────────────────
// Formatea descriptions de operations OpenAPI para el LLM
// El LLM necesita contexto claro para decidir qué tool invocar
// ──────────────────────────────────────────────────────────────────

export function buildToolDescription(
  operation: OperationDTO,
  method: string,
  path: string,
  hasAuth: boolean,
): string {
  const lines: string[] = [];

  if (operation.summary) {
    lines.push(operation.summary);
  }

  if (operation.description) {
    lines.push(operation.description);
  }

  lines.push('');
  lines.push(`Método: ${method.toUpperCase()} ${path}`);

  if (hasAuth) {
    lines.push('Autenticación requerida: Bearer JWT');
  } else {
    lines.push('Autenticación: No requerida (@unauthenticated)');
  }

  // Respuestas esperadas
  const successCodes = Object.keys(operation.responses).filter(
    (code) => parseInt(code) >= 200 && parseInt(code) < 300,
  );
  if (successCodes.length > 0) {
    lines.push(`Retorna HTTP: ${successCodes.join(', ')}`);
  }

  // Paginación detectada
  const hasPagination =
    operation.parameters?.some((p) => p.name === 'page' || p.name === 'per_page' || p.name === 'cursor') ?? false;
  if (hasPagination) {
    lines.push('Paginación: Soportada (data[], links, meta)');
  }

  if (operation.deprecated) {
    lines.push('⚠️ DEPRECATED: Este endpoint está marcado como obsoleto');
  }

  return lines.filter((l) => l !== undefined).join('\n');
}

export function formatParameterDescription(param: ParameterDTO): string {
  const parts: string[] = [`[${param.in}]`];

  if (param.required) parts.push('requerido');
  if (param.deprecated) parts.push('⚠️ deprecated');
  if (param.description) parts.push(param.description);
  if (param.example !== undefined) parts.push(`Ejemplo: ${JSON.stringify(param.example)}`);

  return parts.join(' — ');
}

export function buildErrorHint(statusCode: number, errorData: unknown): string {
  const hints: Record<number, string> = {
    400: 'Verificar parámetros enviados',
    401: 'Token expirado, se renovó automáticamente. Si persiste, usa scramble_auth_login',
    403: 'Usuario sin permisos para esta operación',
    404: 'El recurso no existe. Verifica el ID con el tool de listado',
    409: 'Conflicto de estado. Usa el campo version retornado para reintentar',
    422: `Campos inválidos: ${JSON.stringify((errorData as Record<string, unknown>)?.['errors'] ?? {})}`,
    429: 'Rate limit alcanzado, reintentando con backoff exponencial',
    500: 'Error interno del servidor Laravel',
  };

  return hints[statusCode] ?? `Error HTTP ${statusCode}`;
}
