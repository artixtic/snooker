import { IsString, IsArray, ValidateNested, IsOptional, IsDateString, Allow } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncOperationDto {
  @IsString()
  opId: string;

  @IsString()
  entity: string;

  @IsString()
  action: string;

  // payload can be any type (object, array, primitive, etc.)
  // Using @Allow() to whitelist it without validation
  @Allow()
  payload: any;

  @IsDateString()
  clientUpdatedAt: string;

  @IsString()
  clientId: string;
}

export class SyncPushRequest {
  @IsString()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}

export interface ConflictResponse {
  opId: string;
  entity: string;
  action: string;
  conflictType: 'timestamp' | 'version' | 'state';
  clientData: any;
  serverData: any;
  message: string;
}

export interface SyncPushResponse {
  processed: number;
  createdServerIds: Record<string, string>;
  conflicts: ConflictResponse[];
  errors: Array<{ opId: string; error: string }>;
}

export interface EntityChange {
  entity: string;
  id: string;
  action: string;
  data: any;
  updatedAt: string;
  deleted?: boolean;
}

export interface SyncPullResponse {
  changes: EntityChange[];
  lastSyncTime: string;
  hasMore: boolean;
}

