// src/dto/pr/PullRequestDto.ts

export interface CreatePullRequestDto {
  title: string;
  head: string;
  base: string;
  body?: string;
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  draft?: boolean;
}

export interface UpdatePullRequestDto {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  assignees?: string[];
  labels?: number[];
  milestone?: number;
  allow_maintainer_edit?: boolean;
}

export interface MergePullRequestDto {
  Do: 'merge' | 'rebase' | 'rebase-merge' | 'squash' | 'fast-forward-only';
  merge_message_field?: string;
  merge_commit_id?: string;
  delete_branch_after_merge?: boolean;
  force_merge?: boolean;
  head_commit_id?: string;
  merge_when_checks_succeed?: boolean;
}

export interface CreateReviewDto {
  event?: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' | 'PENDING';
  body?: string;
  commit_id?: string;
  comments?: ReviewCommentDto[];
}

export interface ReviewCommentDto {
  path: string;
  body: string;
  position?: number;
  old_position?: number;
  diff_hunk?: string;
  new_position?: number;
}

export interface SubmitReviewDto {
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;
}

export interface DismissReviewDto {
  message: string;
  prReviewId?: number;
}

export interface RequestedReviewersDto {
  reviewers?: string[];
  team_reviewers?: string[];
}
