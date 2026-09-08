import {
  type ActResult,
  localBrowser,
  type Page,
  Stagehand,
  type StagehandBrowser,
} from '@browserbasehq/stagehand';
import { mkdir } from 'node:fs/promises';
import { z } from 'zod';
import { env } from '../config/env.js';
import { lmStudio } from './lm-studio-client.js';
import type { Workflow } from './workflow.schema.js';

const flatJsonValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const flatJsonObjectSchema = z.record(z.string(), flatJsonValueSchema);

function requireSuccessfulAction(label: string, result: ActResult): void {
  if (!result.data.success || result.data.actions.length === 0) {
    throw new Error(
      `${label} failed: ${result.data.message || 'Stagehand executed no action'}. `
      + `Result: ${JSON.stringify(result.data)}`,
    );
  }
}

export async function executeWorkflowSteps(
  workflow: Workflow,
  page: Page,
  stagehand: Stagehand,
): Promise<unknown> {
  let result: unknown;
  let hasResult = false;

  for (const step of workflow.steps) {
    console.log(`Running step: ${'label' in step ? step.label : step.type}`);

    switch (step.type) {
      case 'goto':
        await page.goto(step.url);
        break;
      case 'gotoIfUrlMissing':
        if (!(await page.url()).includes(step.urlFragment)) await page.goto(step.url);
        break;
      case 'waitFor': {
        const found = await page.waitForSelector(step.selector, { timeout: step.timeoutMs });
        if (!found) throw new Error(`${step.label} did not load within ${step.timeoutMs}ms`);
        break;
      }
      case 'waitUntilHidden': {
        const locator = page.locator(step.selector);
        while (await locator.count() > 0 && await locator.isVisible()) {
          await page.waitForTimeout(step.pollMs);
        }
        break;
      }
      case 'act': {
        const action = await stagehand.act(step.instruction, {
          page,
          ...(step.scopeSelector ? { locator: page.locator(step.scopeSelector) } : {}),
        });
        requireSuccessfulAction(step.label, action);
        break;
      }
      case 'extractText': {
        const extract = stagehand.extract.bind(stagehand) as unknown as (
          instruction: string,
          schema: unknown,
          options: unknown,
        ) => Promise<{ data: unknown }>;
        const options = {
          page,
          timeout: step.timeoutMs,
          ...(step.selector ? { locator: page.locator(step.selector) } : {}),
        };
        if (step.resultType === 'text' && step.resultShape === 'single') {
          result = (await extract(step.instruction, z.string(), options)).data;
        } else if (step.resultType === 'text') {
          result = (await extract(step.instruction, z.array(z.string()), options)).data;
        } else if (step.resultType === 'url' && step.resultShape === 'single') {
          result = (await extract(step.instruction, z.string().url(), options)).data;
        } else if (step.resultType === 'url') {
          result = (await extract(step.instruction, z.array(z.string().url()), options)).data;
        } else if (step.resultShape === 'single') {
          result = (await extract(step.instruction, flatJsonObjectSchema, options)).data;
        } else {
          result = (await extract(step.instruction, z.array(flatJsonObjectSchema), options)).data;
        }
        hasResult = true;
        break;
      }
    }
  }

  return hasResult ? result : 'Workflow completed successfully';
}

type ProjectSession = {
  stopRequested: boolean;
  browser?: StagehandBrowser;
  stagehand?: Stagehand;
  closePromise?: Promise<void>;
};

const activeSessions = new Map<string, ProjectSession>();

export class SessionAlreadyActiveError extends Error {
  constructor(projectId: string) {
    super(`Project ${projectId} already has an active browser session`);
    this.name = 'SessionAlreadyActiveError';
  }
}

export class WorkflowStoppedError extends Error {
  constructor() {
    super('Workflow execution was stopped');
    this.name = 'WorkflowStoppedError';
  }
}

async function closeSessionResources(session: ProjectSession): Promise<void> {
  if (session.closePromise) return session.closePromise;
  if (!session.stagehand && !session.browser) return;

  session.closePromise = (async () => {
    try {
      await session.stagehand?.close();
    } finally {
      await session.browser?.close();
    }
  })();

  try {
    await session.closePromise;
  } catch (error) {
    console.error('Failed to close browser session', error);
  }
}

export function hasActiveSession(projectId: string): boolean {
  return activeSessions.has(projectId);
}

export async function stopWorkflow(projectId: string): Promise<boolean> {
  const session = activeSessions.get(projectId);
  if (!session) return false;

  session.stopRequested = true;
  await closeSessionResources(session);
  return true;
}

export async function executeWorkflow(projectId: string, workflow: Workflow): Promise<unknown> {
  if (activeSessions.has(projectId)) throw new SessionAlreadyActiveError(projectId);

  const session: ProjectSession = { stopRequested: false };
  activeSessions.set(projectId, session);

  try {
    await mkdir(env.chromeProfilePath, { recursive: true });
    const browser = await localBrowser.launch({
      headless: false,
      userDataDir: env.chromeProfilePath,
    });
    session.browser = browser;
    if (session.stopRequested) throw new WorkflowStoppedError();

    const stagehand = await Stagehand.create({
      browser,
      model: lmStudio,
      selfHeal: true,
      logging: {
        level: 'info',
        onLog: (message) => console.log(message),
      },
    });
    session.stagehand = stagehand;
    if (session.stopRequested) throw new WorkflowStoppedError();

    const [page] = await browser.context.pages();
    if (!page) throw new Error('The local browser did not create an initial page');
    return await executeWorkflowSteps(workflow, page, stagehand);
  } catch (error) {
    if (session.stopRequested && !(error instanceof WorkflowStoppedError)) {
      throw new WorkflowStoppedError();
    }
    throw error;
  } finally {
    await closeSessionResources(session);
    if (activeSessions.get(projectId) === session) activeSessions.delete(projectId);
  }
}
