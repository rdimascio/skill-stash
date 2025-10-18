/**
 * Author Types
 * Matches the `authors` table schema
 */

export interface Author {
  id: string;
  username: string;
  email?: string;
  githubUrl?: string;
  website?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthorInput {
  id: string;
  username: string;
  email?: string;
  githubUrl?: string;
  website?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateAuthorInput {
  email?: string;
  githubUrl?: string;
  website?: string;
  bio?: string;
  avatarUrl?: string;
}
