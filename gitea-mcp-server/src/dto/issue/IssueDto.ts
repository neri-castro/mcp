// src/dto/issue/IssueDto.ts

export interface CreateIssueDto {
  title: string;
  body?: string;
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  due_date?: string; // ISO 8601
  closed?: boolean;
  ref?: string;
}

export interface UpdateIssueDto {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  assignees?: string[];
  milestone?: number;
  due_date?: string;
  ref?: string;
  unset_due_date?: boolean;
}

export interface CreateCommentDto {
  body: string;
}

export interface UpdateCommentDto {
  body: string;
}

export interface CreateLabelDto {
  name: string;
  color: string;
  description?: string;
  exclusive?: boolean;
}

export interface UpdateLabelDto {
  name?: string;
  color?: string;
  description?: string;
  exclusive?: boolean;
}

export interface IssueLabelsDto {
  labels: number[];
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  due_on?: string; // ISO 8601
  state?: 'open' | 'closed';
}

export interface UpdateMilestoneDto {
  title?: string;
  description?: string;
  due_on?: string;
  state?: 'open' | 'closed';
}

export interface CreateTimeDto {
  time: number; // segundos
  created?: string; // ISO 8601
  user_name?: string;
}

export interface IssueReactionDto {
  content: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes';
}

export interface LockIssueDto {
  reason?: 'off-topic' | 'too-heated' | 'resolved' | 'spam';
}
