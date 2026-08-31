import type { ClientLLM } from '@browserbasehq/stagehand';
import { env } from '../config/env.js';

type OpenAIResponse = {
  choices: Array<{
    finish_reason?: string;
    message: {
      content?: string | null;
      reasoning?: string | null;
      reasoning_content?: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function parseStructuredJson(text: string, completion: OpenAIResponse): unknown {
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!json) throw new Error(`LM Studio returned empty structured output: ${JSON.stringify(completion)}`);

  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    throw new Error(`LM Studio returned invalid JSON: ${json}`, { cause: error });
  }
}

export const lmStudio: ClientLLM = {
  async generate(params) {
    const messages = params.messages.map((message) => {
      const blocks = Array.isArray(message.content) ? message.content : [message.content];
      const toolResult = blocks.find((block) => block.type === 'tool_result');

      if (toolResult?.type === 'tool_result') {
        return {
          role: 'tool' as const,
          tool_call_id: toolResult.toolUseId,
          content: toolResult.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n'),
        };
      }

      const content: Array<Record<string, unknown>> = [];
      for (const block of blocks) {
        if (block.type === 'text') {
          content.push({ type: 'text', text: block.text });
        } else if (block.type === 'image') {
          content.push({
            type: 'image_url',
            image_url: { url: `data:${block.mimeType};base64,${block.data}` },
          });
        }
      }

      return { role: message.role, content };
    });

    const response = await fetch(env.lmStudioUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer lm-studio',
      },
      body: JSON.stringify({
        model: env.lmStudioModel,
        messages: params.systemPrompt
          ? [{ role: 'system', content: params.systemPrompt }, ...messages]
          : messages,
        temperature: params.temperature,
        stop: params.stopSequences,
        ...(params.responseFormat?.type === 'json_schema'
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: params.responseFormat.name,
                  description: params.responseFormat.description,
                  schema: params.responseFormat.schema,
                  strict: true,
                },
              },
            }
          : {}),
        ...('tools' in params && params.tools
          ? {
              tools: params.tools.map((tool) => ({
                type: 'function',
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.inputSchema,
                },
              })),
              tool_choice: params.toolChoice?.mode ?? 'auto',
            }
          : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio request failed (${response.status}): ${await response.text()}`);
    }

    const completion = await response.json() as OpenAIResponse;
    const choice = completion.choices[0];
    if (!choice) throw new Error('LM Studio returned no completion choices');

    const text = choice.message.content
      || choice.message.reasoning_content
      || choice.message.reasoning
      || '';
    const content: Array<Record<string, unknown>> = [
      ...(text ? [{ type: 'text' as const, text }] : []),
      ...(choice.message.tool_calls ?? []).map((toolCall) => ({
        type: 'tool_use' as const,
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
      })),
    ];
    const usage = completion.usage
      ? {
          inputTokens: completion.usage.prompt_tokens ?? 0,
          outputTokens: completion.usage.completion_tokens ?? 0,
          totalTokens: completion.usage.total_tokens ?? 0,
        }
      : undefined;

    if (params.responseFormat?.type === 'json_schema') {
      return {
        role: 'assistant',
        content,
        outputFormat: 'json_schema',
        structuredContent: parseStructuredJson(text, completion),
        stopReason: choice.finish_reason,
        usage,
      } as Awaited<ReturnType<ClientLLM['generate']>>;
    }

    return {
      role: 'assistant',
      content,
      outputFormat: 'text',
      stopReason: choice.finish_reason,
      usage,
    } as Awaited<ReturnType<ClientLLM['generate']>>;
  },
};
