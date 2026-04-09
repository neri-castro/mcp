import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { taigaHttpClient } from './http/TaigaHttpClient.js';
import { tokenManager } from './auth/TokenManager.js';
import { TaigaAPIError, OCCConflictError } from './http/TaigaHttpClient.js';

// --- Services ---
import { AuthService } from './auth/AuthService.js';
import { ProjectService } from './services/ProjectService.js';
import { EpicService } from './services/EpicService.js';
import { UserStoryService } from './services/UserStoryService.js';
import { TaskService } from './services/TaskService.js';
import { IssueService } from './services/IssueService.js';
import { SprintService } from './services/SprintService.js';
import { KanbanService } from './services/KanbanService.js';
import { WikiService } from './services/WikiService.js';
import { HistoryService } from './services/HistoryService.js';
import { WebhookService } from './services/WebhookService.js';
import { SearchService } from './services/SearchService.js';
import { UserService } from './services/UserService.js';
import { StatsService } from './services/StatsService.js';
import { CustomAttributeService } from './services/CustomAttributeService.js';
import { ImporterService } from './services/ImporterService.js';

// --- Repositories ---
import { ProjectRepository } from './repositories/ProjectRepository.js';
import { EpicRepository } from './repositories/EpicRepository.js';
import { UserStoryRepository } from './repositories/UserStoryRepository.js';
import { TaskRepository } from './repositories/TaskRepository.js';
import { IssueRepository } from './repositories/IssueRepository.js';
import { MilestoneRepository } from './repositories/MilestoneRepository.js';
import { StatusRepository } from './repositories/StatusRepository.js';
import { WikiRepository } from './repositories/WikiRepository.js';
import { HistoryRepository } from './repositories/HistoryRepository.js';
import { WebhookRepository } from './repositories/WebhookRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { CustomAttributeRepository } from './repositories/CustomAttributeRepository.js';
import { SearchRepository } from './repositories/SearchRepository.js';
import { TimelineRepository } from './repositories/TimelineRepository.js';
import { ImporterRepository } from './repositories/ImporterRepository.js';

// --- Tool Schemas ---
import { authToolSchemas } from './tools/auth.tools.js';
import { projectToolSchemas } from './tools/project.tools.js';
import { epicToolSchemas } from './tools/epic.tools.js';
import { userstoryToolSchemas } from './tools/userstory.tools.js';
import { taskToolSchemas } from './tools/task.tools.js';
import { issueToolSchemas } from './tools/issue.tools.js';
import { sprintToolSchemas } from './tools/sprint.tools.js';
import { kanbanToolSchemas } from './tools/kanban.tools.js';
import { wikiToolSchemas } from './tools/wiki.tools.js';
import { historyToolSchemas } from './tools/history.tools.js';
import { webhookToolSchemas } from './tools/webhook.tools.js';
import { searchToolSchemas } from './tools/search.tools.js';
import { userToolSchemas } from './tools/user.tools.js';
import { statsToolSchemas } from './tools/stats.tools.js';
import { customAttrToolSchemas } from './tools/custom_attr.tools.js';
import { importerToolSchemas } from './tools/importer.tools.js';

import { successResponse, errorResponse } from './dto/common/CommonDTOs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Dependency Injection (manual, sin contenedor)
// ─────────────────────────────────────────────────────────────────────────────

const projectRepo = new ProjectRepository(taigaHttpClient);
const epicRepo = new EpicRepository(taigaHttpClient);
const userStoryRepo = new UserStoryRepository(taigaHttpClient);
const taskRepo = new TaskRepository(taigaHttpClient);
const issueRepo = new IssueRepository(taigaHttpClient);
const milestoneRepo = new MilestoneRepository(taigaHttpClient);
const statusRepo = new StatusRepository(taigaHttpClient);
const wikiRepo = new WikiRepository(taigaHttpClient);
const historyRepo = new HistoryRepository(taigaHttpClient);
const webhookRepo = new WebhookRepository(taigaHttpClient);
const userRepo = new UserRepository(taigaHttpClient);
const customAttrRepo = new CustomAttributeRepository(taigaHttpClient);
const searchRepo = new SearchRepository(taigaHttpClient);
const timelineRepo = new TimelineRepository(taigaHttpClient);
const importerRepo = new ImporterRepository(taigaHttpClient);

const authService = new AuthService(taigaHttpClient, tokenManager);
const projectService = new ProjectService(projectRepo);
const epicService = new EpicService(epicRepo);
const userStoryService = new UserStoryService(userStoryRepo);
const taskService = new TaskService(taskRepo);
const issueService = new IssueService(issueRepo);
const sprintService = new SprintService(milestoneRepo, userStoryRepo);
const kanbanService = new KanbanService(statusRepo);
const wikiService = new WikiService(wikiRepo);
const historyService = new HistoryService(historyRepo);
const webhookService = new WebhookService(webhookRepo);
const searchService = new SearchService(searchRepo);
const userService = new UserService(userRepo);
const statsService = new StatsService(timelineRepo);
const customAttrService = new CustomAttributeService(customAttrRepo);
const importerService = new ImporterService(importerRepo);

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registry — todas las herramientas MCP
// ─────────────────────────────────────────────────────────────────────────────

const allToolSchemas = {
  ...authToolSchemas,
  ...projectToolSchemas,
  ...epicToolSchemas,
  ...userstoryToolSchemas,
  ...taskToolSchemas,
  ...issueToolSchemas,
  ...sprintToolSchemas,
  ...kanbanToolSchemas,
  ...wikiToolSchemas,
  ...historyToolSchemas,
  ...webhookToolSchemas,
  ...searchToolSchemas,
  ...userToolSchemas,
  ...statsToolSchemas,
  ...customAttrToolSchemas,
  ...importerToolSchemas,
};

function buildToolList(): Tool[] {
  return Object.entries(allToolSchemas).map(([name, schema]) => ({
    name,
    description: schema.description,
    inputSchema: zodToJsonSchema(schema.inputSchema) as Tool['inputSchema'],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Handler — ejecuta cada tool y retorna respuesta estructurada
// ─────────────────────────────────────────────────────────────────────────────

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    case 'taiga_auth_login':
      return authService.login(
        args.username as string | undefined,
        args.password as string | undefined,
        args.type as 'normal' | 'ldap' | undefined
      );

    case 'taiga_auth_refresh':
      return authService.refresh();

    case 'taiga_auth_me':
      return authService.me();

    // ── PROJECTS ──────────────────────────────────────────────────────────────
    case 'taiga_project_list':
      return projectService.list(args);

    case 'taiga_project_create':
      return projectService.create(args as unknown as Parameters<typeof projectService.create>[0]);

    case 'taiga_project_get':
      return projectService.get(args.project_id as number);

    case 'taiga_project_get_by_slug':
      return projectService.getBySlug(args.slug as string);

    case 'taiga_project_edit': {
      const { project_id, ...rest } = args;
      return projectService.edit(project_id as number, rest);
    }

    case 'taiga_project_delete':
      await projectService.delete(args.project_id as number);
      return { deleted: true };

    case 'taiga_project_stats':
      return projectService.getStats(args.project_id as number);

    case 'taiga_project_modules':
      return projectService.getModules(args.project_id as number);

    case 'taiga_project_create_tag':
      return projectService.createTag(
        args.project_id as number,
        args.tag as string,
        args.color as string
      );

    case 'taiga_project_duplicate':
      return projectService.duplicate(
        args.project_id as number,
        args.name as string,
        (args.users as number[]) ?? []
      );

    // ── EPICS ─────────────────────────────────────────────────────────────────
    case 'taiga_epic_list': {
      const { project_id, ...filters } = args;
      return epicService.list(project_id as number, filters);
    }

    case 'taiga_epic_create':
      return epicService.create({
        project: args.project_id as number,
        subject: args.subject as string,
        description: args.description as string | undefined,
        color: args.color as string | undefined,
        status: args.status_id as number | undefined,
        assigned_to: args.assigned_to as number | undefined,
        tags: args.tags as string[] | undefined,
        watchers: args.watchers as number[] | undefined,
        order: args.order as number | undefined,
      });

    case 'taiga_epic_get':
      return epicService.get(args.epic_id as number);

    case 'taiga_epic_get_by_ref':
      return epicService.getByRef(args.ref as number, args.project_id as number);

    case 'taiga_epic_edit': {
      const { epic_id, version, ...rest } = args;
      return epicService.edit(epic_id as number, { version: version as number, ...rest });
    }

    case 'taiga_epic_delete':
      await epicService.delete(args.epic_id as number);
      return { deleted: true };

    case 'taiga_epic_bulk_create':
      return epicService.bulkCreate(
        args.project_id as number,
        args.subjects as string[],
        args.status_id as number | undefined
      );

    case 'taiga_epic_link_userstory':
      return epicService.linkUserStory(args.epic_id as number, args.userstory_id as number);

    case 'taiga_epic_unlink_userstory':
      await epicService.unlinkUserStory(args.epic_id as number, args.userstory_id as number);
      return { unlinked: true };

    case 'taiga_epic_bulk_link_userstories':
      return epicService.bulkLinkUserStories(
        args.epic_id as number,
        args.userstory_ids as number[]
      );

    case 'taiga_epic_list_related_userstories':
      return epicService.listRelatedUserStories(args.epic_id as number);

    case 'taiga_epic_change_status':
      return epicService.changeStatus(args.epic_id as number, args.status_id as number);

    case 'taiga_epic_add_attachment':
      return { message: 'Adjuntos requieren acceso al filesystem del servidor MCP. Usa la API directamente con multipart/form-data.' };

    case 'taiga_epic_list_attachments':
      return epicService.listAttachments(args.epic_id as number);

    case 'taiga_epic_watch':
      await epicService.watch(args.epic_id as number);
      return { watching: true };

    case 'taiga_epic_filters_data':
      return epicService.getFiltersData(args.project_id as number);

    // ── USER STORIES ──────────────────────────────────────────────────────────
    case 'taiga_us_list': {
      const { project_id, ...filters } = args;
      return userStoryService.list(project_id as number, filters);
    }

    case 'taiga_us_create':
      return userStoryService.create({
        project: args.project_id as number,
        subject: args.subject as string,
        description: args.description as string | undefined,
        status: args.status as number | undefined,
        milestone: args.milestone as number | undefined,
        points: args.points as { role: number; points: number }[] | undefined,
        assigned_to: args.assigned_to as number | undefined,
        assigned_users: args.assigned_users as number[] | undefined,
        tags: args.tags as string[] | undefined,
        watchers: args.watchers as number[] | undefined,
        is_blocked: args.is_blocked as boolean | undefined,
        blocked_note: args.blocked_note as string | undefined,
        client_requirement: args.client_requirement as boolean | undefined,
        team_requirement: args.team_requirement as boolean | undefined,
      });

    case 'taiga_us_get':
      return userStoryService.get(args.us_id as number);

    case 'taiga_us_get_by_ref':
      return userStoryService.getByRef(args.ref as number, args.project_id as number);

    case 'taiga_us_edit': {
      const { us_id, version, ...rest } = args;
      return userStoryService.edit(us_id as number, { version: version as number, ...rest });
    }

    case 'taiga_us_delete':
      await userStoryService.delete(args.us_id as number);
      return { deleted: true };

    case 'taiga_us_bulk_create':
      return userStoryService.bulkCreate(
        args.project_id as number,
        args.subjects as string[],
        args.status_id as number | undefined
      );

    case 'taiga_us_change_status':
      return userStoryService.changeStatus(args.us_id as number, args.status_id as number);

    case 'taiga_us_assign_to_sprint':
      return userStoryService.assignToSprint(
        args.us_id as number,
        args.milestone_id as number | null
      );

    case 'taiga_us_move_to_kanban_column':
      await userStoryService.moveToKanbanColumn(
        args.project_id as number,
        args.us_ids as number[],
        args.status_id as number
      );
      return { moved: true };

    case 'taiga_us_bulk_update_order':
      await userStoryService.bulkUpdateOrder(
        args.project_id as number,
        args.order_data as { us_id: number; order: number }[],
        args.board as 'backlog' | 'kanban' | 'sprint',
        args.extra_id as number | undefined
      );
      return { reordered: true };

    case 'taiga_us_bulk_assign_sprint':
      await userStoryService.bulkAssignSprint(
        args.project_id as number,
        args.milestone_id as number,
        args.us_ids as number[]
      );
      return { assigned: true };

    case 'taiga_us_add_attachment':
      return { message: 'Adjuntos requieren acceso al filesystem. Usa la API directamente con multipart/form-data.' };

    case 'taiga_us_list_attachments':
      return userStoryService.listAttachments(args.us_id as number);

    case 'taiga_us_watch':
      await userStoryService.watch(args.us_id as number);
      return { watching: true };

    case 'taiga_us_vote':
      await userStoryService.vote(args.us_id as number);
      return { voted: true };

    // ── TASKS ─────────────────────────────────────────────────────────────────
    case 'taiga_task_list': {
      const { project_id, ...filters } = args;
      return taskService.list(project_id as number, filters);
    }

    case 'taiga_task_create':
      return taskService.create({
        project: args.project_id as number,
        subject: args.subject as string,
        description: args.description as string | undefined,
        user_story: args.us_id as number | undefined,
        milestone: args.milestone as number | undefined,
        status: args.status as number | undefined,
        assigned_to: args.assigned_to as number | undefined,
        tags: args.tags as string[] | undefined,
        watchers: args.watchers as number[] | undefined,
        is_iocaine: args.is_iocaine as boolean | undefined,
        due_date: args.due_date as string | undefined,
      });

    case 'taiga_task_get':
      return taskService.get(args.task_id as number);

    case 'taiga_task_get_by_ref':
      return taskService.getByRef(args.ref as number, args.project_id as number);

    case 'taiga_task_edit': {
      const { task_id, version, ...rest } = args;
      return taskService.edit(task_id as number, { version: version as number, ...rest });
    }

    case 'taiga_task_delete':
      await taskService.delete(args.task_id as number);
      return { deleted: true };

    case 'taiga_task_bulk_create':
      return taskService.bulkCreate(
        args.project_id as number,
        args.subjects as string[],
        args.us_id as number | undefined,
        args.milestone_id as number | undefined,
        args.status_id as number | undefined
      );

    case 'taiga_task_change_status':
      return taskService.changeStatus(args.task_id as number, args.status_id as number);

    case 'taiga_task_assign':
      return taskService.assign(args.task_id as number, args.user_id as number);

    case 'taiga_task_add_attachment':
      return { message: 'Adjuntos requieren acceso al filesystem. Usa la API directamente con multipart/form-data.' };

    case 'taiga_task_list_attachments':
      return taskService.listAttachments(args.task_id as number);

    case 'taiga_task_watch':
      await taskService.watch(args.task_id as number);
      return { watching: true };

    case 'taiga_task_vote':
      await taskService.vote(args.task_id as number);
      return { voted: true };

    case 'taiga_task_filters_data':
      return taskService.getFiltersData(args.project_id as number);

    // ── ISSUES ────────────────────────────────────────────────────────────────
    case 'taiga_issue_list': {
      const { project_id, ...filters } = args;
      return issueService.list(project_id as number, filters);
    }

    case 'taiga_issue_create':
      return issueService.create({
        project: args.project_id as number,
        subject: args.subject as string,
        description: args.description as string | undefined,
        type: args.type as number,
        status: args.status as number | undefined,
        priority: args.priority as number,
        severity: args.severity as number,
        milestone: args.milestone as number | undefined,
        assigned_to: args.assigned_to as number | undefined,
        tags: args.tags as string[] | undefined,
        watchers: args.watchers as number[] | undefined,
        due_date: args.due_date as string | undefined,
      });

    case 'taiga_issue_get':
      return issueService.get(args.issue_id as number);

    case 'taiga_issue_edit': {
      const { issue_id, version, ...rest } = args;
      return issueService.edit(issue_id as number, { version: version as number, ...rest } as Parameters<typeof issueService.edit>[1]);
    }

    case 'taiga_issue_delete':
      await issueService.delete(args.issue_id as number);
      return { deleted: true };

    case 'taiga_issue_change_status':
      return issueService.changeStatus(args.issue_id as number, args.status_id as number);

    case 'taiga_issue_change_priority':
      return issueService.changePriority(args.issue_id as number, args.priority_id as number);

    case 'taiga_issue_change_severity':
      return issueService.changeSeverity(args.issue_id as number, args.severity_id as number);

    case 'taiga_issue_assign':
      return issueService.assign(args.issue_id as number, args.user_id as number);

    case 'taiga_issue_promote_to_us':
      return issueService.promoteToUserStory(
        args.issue_id as number,
        args.project_id as number
      );

    case 'taiga_issue_add_attachment':
      return { message: 'Adjuntos requieren acceso al filesystem. Usa la API directamente con multipart/form-data.' };

    case 'taiga_issue_list_attachments':
      return issueService.listAttachments(args.issue_id as number);

    case 'taiga_issue_watch':
      await issueService.watch(args.issue_id as number);
      return { watching: true };

    case 'taiga_issue_vote':
      await issueService.vote(args.issue_id as number);
      return { voted: true };

    case 'taiga_issue_list_types':
      return issueService.listTypes(args.project_id as number);

    case 'taiga_issue_list_priorities':
      return issueService.listPriorities(args.project_id as number);

    case 'taiga_issue_list_severities':
      return issueService.listSeverities(args.project_id as number);

    case 'taiga_issue_filters_data':
      return issueService.getFiltersData(args.project_id as number);

    // ── SPRINTS ───────────────────────────────────────────────────────────────
    case 'taiga_sprint_list':
      return sprintService.list(
        args.project_id as number,
        args.closed as boolean | undefined
      );

    case 'taiga_sprint_create':
      return sprintService.create({
        project: args.project_id as number,
        name: args.name as string,
        estimated_start: args.estimated_start as string,
        estimated_finish: args.estimated_finish as string,
        disponibility: args.disponibility as number | undefined,
        order: args.order as number | undefined,
      });

    case 'taiga_sprint_get':
      return sprintService.get(args.sprint_id as number);

    case 'taiga_sprint_edit': {
      const { sprint_id, ...rest } = args;
      return sprintService.edit(sprint_id as number, rest);
    }

    case 'taiga_sprint_delete':
      await sprintService.delete(args.sprint_id as number);
      return { deleted: true };

    case 'taiga_sprint_stats':
      return sprintService.getStats(args.sprint_id as number);

    case 'taiga_sprint_add_userstory':
      return sprintService.addUserStory(args.sprint_id as number, args.us_id as number);

    case 'taiga_sprint_remove_userstory':
      return sprintService.removeUserStory(args.us_id as number);

    case 'taiga_sprint_bulk_add_userstories':
      await sprintService.bulkAddUserStories(
        args.sprint_id as number,
        args.us_ids as number[]
      );
      return { assigned: true };

    case 'taiga_sprint_watch':
      await sprintService.watch(args.sprint_id as number);
      return { watching: true };

    // ── KANBAN & STATUSES ─────────────────────────────────────────────────────
    case 'taiga_status_list_epic':
      return kanbanService.listStatuses(args.project_id as number, 'epic');

    case 'taiga_status_list_us':
      return kanbanService.listStatuses(args.project_id as number, 'userstory');

    case 'taiga_status_list_task':
      return kanbanService.listStatuses(args.project_id as number, 'task');

    case 'taiga_status_list_issue':
      return kanbanService.listStatuses(args.project_id as number, 'issue');

    case 'taiga_status_create':
      return kanbanService.createStatus(
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        {
          project: args.project_id as number,
          name: args.name as string,
          color: args.color as string | undefined,
          order: args.order as number | undefined,
          is_closed: args.is_closed as boolean | undefined,
          wip_limit: args.wip_limit as number | null | undefined,
        }
      );

    case 'taiga_status_edit': {
      const { status_id, entity_type, ...rest } = args;
      return kanbanService.editStatus(
        status_id as number,
        entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        rest
      );
    }

    case 'taiga_status_delete':
      await kanbanService.deleteStatus(
        args.status_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue'
      );
      return { deleted: true };

    case 'taiga_status_reorder':
      await kanbanService.reorderStatuses(
        args.project_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        args.statuses_order as { status_id: number; order: number }[]
      );
      return { reordered: true };

    case 'taiga_kanban_move_card':
      await kanbanService.moveCard(
        args.project_id as number,
        args.us_id as number,
        args.new_status_id as number,
        args.order as number | undefined
      );
      return { moved: true };

    case 'taiga_kanban_bulk_move':
      await kanbanService.bulkMoveCards(
        args.project_id as number,
        args.status_id as number,
        args.cards as { us_id: number; order: number }[]
      );
      return { moved: true };

    // ── CUSTOM ATTRIBUTES ─────────────────────────────────────────────────────
    case 'taiga_custom_attr_list':
      return customAttrService.list(
        args.project_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue'
      );

    case 'taiga_custom_attr_create':
      return customAttrService.create(
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        {
          project: args.project_id as number,
          name: args.name as string,
          description: args.description as string | undefined,
          type: args.type as 'text' | undefined,
          order: args.order as number | undefined,
        }
      );

    case 'taiga_custom_attr_edit': {
      const { attr_id, entity_type, ...rest } = args;
      return customAttrService.edit(
        attr_id as number,
        entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        rest
      );
    }

    case 'taiga_custom_attr_delete':
      await customAttrService.delete(
        args.attr_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue'
      );
      return { deleted: true };

    case 'taiga_custom_attr_get_values':
      return customAttrService.getValues(
        args.entity_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue'
      );

    case 'taiga_custom_attr_set_values':
      return customAttrService.setValues(
        args.entity_id as number,
        args.entity_type as 'epic' | 'userstory' | 'task' | 'issue',
        args.attributes_values as Record<string, unknown>,
        args.version as number
      );

    // ── WIKI ──────────────────────────────────────────────────────────────────
    case 'taiga_wiki_list':
      return wikiService.list(args.project_id as number);

    case 'taiga_wiki_create':
      return wikiService.create({
        project: args.project_id as number,
        slug: args.slug as string,
        content: args.content as string,
        watchers: args.watchers as number[] | undefined,
      });

    case 'taiga_wiki_get':
      return wikiService.get(args.wiki_id as number);

    case 'taiga_wiki_get_by_slug':
      return wikiService.getBySlug(args.slug as string, args.project_id as number);

    case 'taiga_wiki_edit':
      return wikiService.edit(args.wiki_id as number, {
        content: args.content as string,
        version: args.version as number,
        watchers: args.watchers as number[] | undefined,
      });

    case 'taiga_wiki_delete':
      await wikiService.delete(args.wiki_id as number);
      return { deleted: true };

    case 'taiga_wiki_link_create':
      return wikiService.createLink({
        project: args.project_id as number,
        title: args.title as string,
        href: args.href as string,
        order: args.order as number | undefined,
      });

    case 'taiga_wiki_link_delete':
      await wikiService.deleteLink(args.link_id as number);
      return { deleted: true };

    case 'taiga_wiki_watch':
      await wikiService.watch(args.wiki_id as number);
      return { watching: true };

    // ── HISTORY & COMMENTS ────────────────────────────────────────────────────
    case 'taiga_history_get':
      return historyService.getHistory(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number
      );

    case 'taiga_comment_add':
      return historyService.addComment(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number,
        args.comment as string,
        args.version as number
      );

    case 'taiga_comment_edit':
      return historyService.editComment(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number,
        args.comment_id as string,
        args.comment as string
      );

    case 'taiga_comment_delete':
      await historyService.deleteComment(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number,
        args.comment_id as string
      );
      return { deleted: true };

    case 'taiga_comment_restore':
      await historyService.restoreComment(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number,
        args.comment_id as string
      );
      return { restored: true };

    case 'taiga_comment_versions':
      return historyService.getCommentVersions(
        args.entity_type as 'userstory' | 'task' | 'issue' | 'wiki' | 'epic',
        args.entity_id as number,
        args.comment_id as string
      );

    // ── WEBHOOKS ──────────────────────────────────────────────────────────────
    case 'taiga_webhook_list':
      return webhookService.list(args.project_id as number);

    case 'taiga_webhook_create':
      return webhookService.create({
        project: args.project_id as number,
        name: args.name as string,
        url: args.url as string,
        key: args.key as string,
        enabled: args.enabled as boolean | undefined,
      });

    case 'taiga_webhook_edit': {
      const { webhook_id, ...rest } = args;
      return webhookService.edit(webhook_id as number, rest);
    }

    case 'taiga_webhook_delete':
      await webhookService.delete(args.webhook_id as number);
      return { deleted: true };

    case 'taiga_webhook_test':
      return webhookService.test(args.webhook_id as number);

    case 'taiga_webhook_logs':
      return webhookService.getLogs(args.webhook_id as number);

    case 'taiga_webhook_resend':
      return webhookService.resendLog(args.log_id as number);

    // ── SEARCH ────────────────────────────────────────────────────────────────
    case 'taiga_search':
      return searchService.search(args.project_id as number, args.query as string);

    // ── USERS & MEMBERSHIPS ───────────────────────────────────────────────────
    case 'taiga_user_me':
      return userService.me();

    case 'taiga_user_get':
      return userService.get(args.user_id as number);

    case 'taiga_user_list':
      return userService.list(args.project_id as number | undefined);

    case 'taiga_membership_list':
      return userService.listMemberships(args.project_id as number);

    case 'taiga_membership_invite':
      return userService.invite({
        project: args.project_id as number,
        role: args.role_id as number,
        username: args.username as string | undefined,
        email: args.email as string | undefined,
      });

    case 'taiga_membership_bulk_invite':
      return userService.bulkInvite({
        project: args.project_id as number,
        bulk_memberships: args.invitations as { role_id: number; username?: string; email?: string }[],
        invitation_extra_text: args.invitation_extra_text as string | undefined,
      });

    case 'taiga_membership_change_role':
      return userService.changeRole(args.membership_id as number, args.role_id as number);

    case 'taiga_membership_remove':
      await userService.removeMembership(args.membership_id as number);
      return { removed: true };

    case 'taiga_role_list':
      return userService.listRoles(args.project_id as number);

    case 'taiga_role_create':
      return userService.createRole({
        project: args.project_id as number,
        name: args.name as string,
        permissions: args.permissions as string[] | undefined,
        order: args.order as number | undefined,
        computable: args.computable as boolean | undefined,
      });

    case 'taiga_role_edit': {
      const { role_id, ...rest } = args;
      return userService.editRole(role_id as number, rest);
    }

    // ── TIMELINES & STATS ─────────────────────────────────────────────────────
    case 'taiga_timeline_project':
      return statsService.getProjectTimeline(
        args.project_id as number,
        args.page as number | undefined
      );

    case 'taiga_timeline_user':
      return statsService.getUserTimeline(
        args.user_id as number,
        args.page as number | undefined
      );

    case 'taiga_stats_project':
      return statsService.getProjectStats(args.project_id as number);

    case 'taiga_stats_issues':
      return statsService.getIssueStats(args.project_id as number);

    case 'taiga_stats_sprint':
      return statsService.getSprintStats(args.sprint_id as number);

    // ── IMPORTERS ─────────────────────────────────────────────────────────────
    case 'taiga_export_project':
      return importerService.exportProject(args.project_id as number);

    case 'taiga_import_project':
      return importerService.importProject(args.dump);

    case 'taiga_import_from_trello':
      return importerService.importFromTrello(args);

    case 'taiga_import_from_github':
      return importerService.importFromGitHub(args);

    case 'taiga_import_from_jira':
      return importerService.importFromJira(args);

    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error formatting — respuestas estructuradas para el LLM
// ─────────────────────────────────────────────────────────────────────────────

function formatError(error: unknown): unknown {
  if (error instanceof OCCConflictError) {
    return errorResponse('OCC_CONFLICT', 'El recurso fue modificado por otro usuario.', {
      hint: 'Obtén la versión actual con el tool _get correspondiente y reintenta.',
      details: error.data,
    });
  }
  if (error instanceof TaigaAPIError) {
    const data = error.data as Record<string, unknown> | null;
    const message =
      (data?.['_error_message'] as string) ??
      (data?.['detail'] as string) ??
      `Error HTTP ${error.statusCode}`;
    return errorResponse(`HTTP_${error.statusCode}`, message, { details: data });
  }
  if (error instanceof Error) {
    return errorResponse('INTERNAL_ERROR', error.message);
  }
  return errorResponse('UNKNOWN_ERROR', String(error));
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server bootstrap
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.info(
    { name: config.mcpServerName, version: config.mcpServerVersion },
    'Iniciando Taiga MCP Server'
  );

  // Autenticación inicial con las credenciales del entorno
  try {
    await authService.initialize();
    logger.info('Autenticación inicial exitosa');
  } catch (err) {
    logger.error({ err }, 'Error en autenticación inicial. El server continúa — usa taiga_auth_login para autenticar manualmente.');
  }

  const server = new Server(
    { name: config.mcpServerName, version: config.mcpServerVersion },
    { capabilities: { tools: {} } }
  );

  // ── List Tools ──────────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = buildToolList();
    logger.debug({ count: tools.length }, 'Tools listadas');
    return { tools };
  });

  // ── Call Tool ───────────────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = (rawArgs ?? {}) as Record<string, unknown>;

    logger.info({ tool: name }, 'Ejecutando tool');

    try {
      const schema = allToolSchemas[name as keyof typeof allToolSchemas];
      if (!schema) {
        throw new Error(`Tool desconocida: ${name}`);
      }

      // Validación de entrada con Zod
      const parsed = schema.inputSchema.parse(args);
      const result = await handleToolCall(name, parsed as Record<string, unknown>);

      logger.debug({ tool: name }, 'Tool ejecutada exitosamente');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(successResponse(result), null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error({ tool: name, error }, 'Error ejecutando tool');

      const formatted = formatError(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formatted, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // ── Transport ───────────────────────────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(
    { transport: 'stdio', tools: Object.keys(allToolSchemas).length },
    'Taiga MCP Server listo y escuchando'
  );
}

main().catch((err) => {
  logger.error({ err }, 'Error fatal en Taiga MCP Server');
  process.exit(1);
});
