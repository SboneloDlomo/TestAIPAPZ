import { LivenessSessionStatus } from '@aws-sdk/client-rekognition';
import { ApiProperty } from '@nestjs/swagger';

export class LivenessResultDto {
  @ApiProperty({
    example: 'aa421b25-b46d-4943-91b2-dce729dd9095_CUST-001-1234',
    required: true,
    description: `This is a unique identifier for this liveness session.`,
  })
  sessionId: string;

  @ApiProperty({
    example: LivenessSessionStatus.FAILED,
    required: false,
    description: `The current status of this liveness session.`,
  })
  status?: LivenessSessionStatus;

  @ApiProperty({
    example: 45.548956,
    required: false,
    description: `The confidence score, between 0 and 100 percent, indicating how confident the system is that this session recorded a living person.`,
  })
  confidence?: number;
}
