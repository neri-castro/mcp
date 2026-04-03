import { z } from 'zod';

export const webhookToolSchemas = {
  taiga_webhook_list: {
    description: 'Lista todos los webhooks configurados en un proyecto.',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_webhook_create: {
    description: 'Crea un webhook para recibir notificaciones de eventos en una URL externa (Slack, Teams, custom endpoint, etc.).',
    inputSchema: z.object({
      project_id: z.number(),
      name: z.string().min(1).describe('Nombre descriptivo del webhook'),
      url: z.string().url().describe('URL del endpoint receptor'),
      key: z.string().min(1).describe('Clave secreta HMAC para validar la firma de los payloads'),
      enabled: z.boolean().optional().default(true),
    }),
  },

  taiga_webhook_edit: {
    description: 'Edita los datos de un webhook existente.',
    inputSchema: z.object({
      webhook_id: z.number(),
      name: z.string().optional(),
      url: z.string().url().optional(),
      key: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  },

  taiga_webhook_delete: {
    description: 'Elimina un webhook del proyecto.',
    inputSchema: z.object({ webhook_id: z.number() }),
  },

  taiga_webhook_test: {
    description: 'Envía un payload de prueba al endpoint del webhook para verificar conectividad.',
    inputSchema: z.object({ webhook_id: z.number() }),
  },

  taiga_webhook_logs: {
    description: 'Obtiene los logs de envíos del webhook (éxitos y fallos).',
    inputSchema: z.object({ webhook_id: z.number() }),
  },

  taiga_webhook_resend: {
    description: 'Reenvía un request fallido del webhook usando el ID del log.',
    inputSchema: z.object({ log_id: z.number() }),
  },
};
