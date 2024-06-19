import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuditTrail } from './entities/audit-trail.entity';
import { AUDIT_TRAIL_ACTION } from '../enums/enum';
import { dynamoDBClient } from '../database/dynamoDBClient';
import { PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const tableName = process.env.AUDIT_TABLE_NAME;
@Injectable()
export class AuditTrailService {
  constructor(@Inject(Logger) private readonly logger = Logger) {}

  async create(
    customerId: string,
    organisationId: string,
    createdBy: string,
    action: AUDIT_TRAIL_ACTION,
    preChangeObject: object,
    postChangeObject: object,
  ) {
    if (!organisationId || !customerId) {
      this.logger.error(
        `Audit Trail: Error while creating audit trail entry: `,
        `organisationId and customerId must be defined.`,
      );
      return false;
    }
    try {
      const auditTrailEntry = new AuditTrail(
        customerId,
        organisationId,
        createdBy,
        action,
        preChangeObject,
        postChangeObject,
      );
      await dynamoDBClient.send(
        new PutCommand({
          TableName: tableName,
          Item: auditTrailEntry,
        }),
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Audit Trail: Error while creating audit trail entry: `,
        error.message,
      );
    }
  }

  async findAll(organisationId: string) {
    try {
      this.logger.debug(
        `Database: Attempting to find all audit trails in table (${tableName}) for organisation with id (${organisationId})...`,
      );
      const results = await dynamoDBClient.send(
        new ScanCommand({
          TableName: tableName,
        }),
      );

      const filteredItems = results?.Items?.filter(
        (transaction) => transaction.organisationId === organisationId,
      ).map((auditTrail: AuditTrail) => auditTrail);

      return filteredItems;
    } catch (error) {
      this.logger.error(
        `Database: Failed to find all audit trails in table (${tableName}) for organisation with id (${organisationId}).`,
        JSON.stringify(error),
      );
    }
  }

  async findOne(organisationId: string, id: string): Promise<AuditTrail> {
    const entity = Object.create(AuditTrail);

    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id, organisationId },
      }),
    );
    if (!result?.Item || result?.Item?.organisationId != organisationId) {
      return undefined;
    } else {
      Object.assign(entity, result?.Item);
      return entity;
    }
  }
}
