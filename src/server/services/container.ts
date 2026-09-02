/**
 * Seedha Properties - Dependency Injection & Service Container
 * Provides lightweight, constructor/factory-injectable services for testability and isolation.
 */

import { sql as defaultSql, timedQuery } from "@/server/db";
import {
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  type PresignUploadParams,
  type PresignedUploadResult,
} from "@/server/storage";
import {
  sendTransactionalEmail,
  type SendEmailOptions,
  type SendEmailResult,
} from "@/server/email";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  type AuthUser,
} from "@/server/auth";

export interface IDatabaseService {
  execute(
    queryName: string,
    queryFn: () => Promise<any>,
  ): Promise<{ data: any; durationMs: number }>;
}

export interface IStorageService {
  getUploadUrl(params: PresignUploadParams, ttl?: number): Promise<PresignedUploadResult>;
  getDownloadUrl(objectKey: string, ttl?: number): Promise<string>;
}

export interface IEmailService {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

export interface IAuthService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  signToken(user: AuthUser, expiresIn?: string): Promise<string>;
  verifyToken(token: string): Promise<AuthUser | null>;
}

// Default Implementations
export class DatabaseService implements IDatabaseService {
  async execute(queryName: string, queryFn: () => Promise<any>) {
    return timedQuery(queryName, queryFn);
  }
}

export class StorageService implements IStorageService {
  async getUploadUrl(params: PresignUploadParams, ttl: number = 300) {
    return createPresignedUploadUrl(params, ttl);
  }
  async getDownloadUrl(objectKey: string, ttl: number = 300) {
    return createPresignedDownloadUrl(objectKey, ttl);
  }
}

export class EmailService implements IEmailService {
  async send(options: SendEmailOptions) {
    return sendTransactionalEmail(options);
  }
}

export class AuthService implements IAuthService {
  async hash(password: string) {
    return hashPassword(password);
  }
  async verify(password: string, hash: string) {
    return verifyPassword(password, hash);
  }
  async signToken(user: AuthUser, expiresIn: string = "30d") {
    return generateToken(user, expiresIn);
  }
  async verifyToken(token: string) {
    return verifyToken(token);
  }
}

export interface AppDependencies {
  db: IDatabaseService;
  storage: IStorageService;
  email: IEmailService;
  auth: IAuthService;
}

export function createDefaultContainer(): AppDependencies {
  return {
    db: new DatabaseService(),
    storage: new StorageService(),
    email: new EmailService(),
    auth: new AuthService(),
  };
}

export let container: AppDependencies = createDefaultContainer();

export function setTestContainer(mockDeps: Partial<AppDependencies>): void {
  container = {
    ...createDefaultContainer(),
    ...mockDeps,
  };
}

export function resetContainer(): void {
  container = createDefaultContainer();
}
