import { describe, it, expect } from 'vitest';
import { normalizeOperationId, extractVersionFromDocsUrl } from '../../../src/utils/operation-id.js';

describe('normalizeOperationId', () => {
  it('converts dot notation to snake_case with scramble_ prefix', () => {
    expect(normalizeOperationId('users.index')).toBe('scramble_users_index');
    expect(normalizeOperationId('users.store')).toBe('scramble_users_store');
    expect(normalizeOperationId('users.show')).toBe('scramble_users_show');
    expect(normalizeOperationId('users.update')).toBe('scramble_users_update');
    expect(normalizeOperationId('users.destroy')).toBe('scramble_users_destroy');
  });

  it('converts camelCase to snake_case', () => {
    expect(normalizeOperationId('posts.publishedPosts')).toBe('scramble_posts_published_posts');
    expect(normalizeOperationId('users.updateProfile')).toBe('scramble_users_update_profile');
  });

  it('handles path separators', () => {
    expect(normalizeOperationId('api/v1/users.store')).toBe('scramble_api_v1_users_store');
  });

  it('applies version prefix when provided', () => {
    expect(normalizeOperationId('users.index', 'v2')).toBe('scramble_v2_users_index');
  });

  it('normalizes multiple underscores', () => {
    const result = normalizeOperationId('api..users.index');
    expect(result).not.toContain('__');
  });
});

describe('extractVersionFromDocsUrl', () => {
  it('extracts version from versioned URL', () => {
    expect(extractVersionFromDocsUrl('/docs/v2/api.json')).toBe('v2');
    expect(extractVersionFromDocsUrl('https://api.example.com/docs/v2/api.json')).toBe('v2');
  });

  it('returns undefined for default URL', () => {
    expect(extractVersionFromDocsUrl('/docs/api.json')).toBeUndefined();
    expect(extractVersionFromDocsUrl('https://api.example.com/docs/api.json')).toBeUndefined();
  });
});
