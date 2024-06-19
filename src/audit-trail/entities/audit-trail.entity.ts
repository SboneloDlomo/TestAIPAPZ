import { ApiProperty } from '@nestjs/swagger';
import { AUDIT_TRAIL_ACTION } from '../../enums/enum';
import { v4 as uuidv4 } from 'uuid';
class Change {
  @ApiProperty({
    example: 'postalAddressCode',
    required: true,
    description: `The name of the field that was changed.`,
  })
  fieldName: string;

  @ApiProperty({
    example: '2161',
    required: true,
    description: `The value of the field before it was changed.`,
  })
  previousValue: string;

  @ApiProperty({
    example: '2188',
    required: true,
    description: `The value of the field after the change was applied.`,
  })
  changedToValue: string;
}
export class AuditTrail {
  @ApiProperty({
    example: '49c94d31-68bd-4275-89cf-0b7d3a8a1290',
    required: true,
    description: `A unique identifier assigned by the KYC system that identifies this audit trail log internally.`,
  })
  id: string;

  @ApiProperty({
    example: '453f919c-f18a-4b90-ac3e-a8c8de4822c4',
    required: true,
    description: `A unique identifier assigned by the KYC system that identifies the customer that this audit trail log was created for.`,
  })
  customerId: string;

  @ApiProperty({
    example: '5ed22776-c3c3-45e7-ad00-60dc02c16721',
    required: true,
    description: `A unique identifier assigned by the KYC system that identifies the organisation that this audit trail log was created for.`,
  })
  organisationId: string;

  @ApiProperty({
    example: 1705047285000,
    required: true,
    description:
      'The UTC timestamp at the time that this audit trail log was first created.',
  })
  dateCreated: number;

  @ApiProperty({
    example: 'John Smith',
    required: true,
    description: `The name of the user, or email address, or user ID, etc. used to track who requested the changes listed in this audit trail log. This must be passed by the calling service, and it is their responsibility to ensure this value is readable and trackable.`,
  })
  createdBy: string;

  @ApiProperty({
    example: AUDIT_TRAIL_ACTION.CUSTOMER_UPDATED,
    required: true,
    enum: AUDIT_TRAIL_ACTION,
    description: `The description of the action taken that triggered the creation of this audit trail log.`,
  })
  action: AUDIT_TRAIL_ACTION;

  @ApiProperty({
    example: [
      {
        previousValue: '2161',
        changedToValue: '2120',
        fieldName: 'postalAddressCode',
      },
      {
        previousValue: '2161',
        changedToValue: '2160',
        fieldName: 'physicalAddressCode',
      },
    ],
    required: true,
    description: `An array of the changes (if any) that were made during the processing of the action.`,
  })
  changes: Change[];

  constructor(
    customerId: string,
    organisationId: string,
    createdBy: string,
    action: AUDIT_TRAIL_ACTION,
    preChangeObject: any,
    postChangeObject: any,
  ) {
    this.id = uuidv4();
    this.customerId = customerId;
    this.organisationId = organisationId;
    this.dateCreated = new Date().getTime();
    this.createdBy = createdBy;
    this.action = action;
    this.changes = this.getFieldValueChanges(preChangeObject, postChangeObject);
  }

  private getFieldValueChanges(preChangeObject: any, postChangeObject: any) {
    const changes = [];
    const preObj = JSON.parse(
      JSON.stringify(preChangeObject ? preChangeObject : {}),
    );
    const postObj = JSON.parse(
      JSON.stringify(postChangeObject ? postChangeObject : {}),
    );
    for (const key in postObj) {
      const change = new Change();
      change.fieldName = key;
      change.changedToValue = JSON.stringify(postObj[key]).toString();
      if (preObj[key] !== undefined) {
        change.previousValue = JSON.stringify(preObj[key]).toString();
      } else {
        change.previousValue = '';
      }
      if (change.previousValue != change.changedToValue) {
        changes.push(change);
      }
    }
    return changes;
  }
}
