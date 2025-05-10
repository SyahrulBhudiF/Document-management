import { Logger as DrizzleLogger } from 'drizzle-orm';
import { Logger as NestLogger } from '@nestjs/common';

const logger = new NestLogger('Drizzle');

export const drizzleLogger: DrizzleLogger = {
  logQuery(query: string, params: unknown[]) {
    const formattedQuery = query.replace(/\s+/g, ' ').trim();

    const formattedParams = params.map((param) => {
      if (typeof param === 'string') {
        return param.replace(/^"(.*)"$/, '$1');
      }
      return param;
    });

    const paramCount = (query.match(/\$\d+/g) || []).length;

    const groupedParams: unknown[][] = [];
    for (let i = 0; i < formattedParams.length; i += paramCount) {
      groupedParams.push(formattedParams.slice(i, i + paramCount));
    }

    const logMessage = `
========== Database Query ==========
Query:
  ${formattedQuery}

Parameters:
${groupedParams
  .map((params, index) => `  Row ${index + 1}: ${JSON.stringify(params)}`)
  .join('\n')}
====================================
    `.trim();

    logger.debug(logMessage);
  },
};
