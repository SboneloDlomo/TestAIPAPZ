import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchOrganisations } from './fetch-organisations';

@Injectable()
export class AlternateAuthenticationService {
  constructor(private configService: ConfigService) {}

  async altAuth(headers: any): Promise<string> {
    // Authentication using basic auth:
    let foundId = undefined;
    if (headers.authorization) {
      const b64auth = (headers.authorization || '').split(' ')[1] || '';
      const [id, apiKey] = Buffer.from(b64auth, 'base64').toString().split(':');
      foundId = this.findOrg(id, apiKey);
      if (!foundId) {
        if (process.env.NODE_ENV === 'test') {
          return foundId;
        }
        // Refresh list of organisations and providers in case recent additions are missing:
        fetchOrganisations();
        foundId = this.findOrg(id, apiKey);
      }
    }
    return foundId;
  }
  findOrg(orgId: string, apiKey: string): string {
    const org = this.configService
      .get('organisations')
      .find(
        (o) => o.id === orgId && o.apiKey === apiKey && o.isDeleted !== true,
      );
    if (org) {
      return org.id;
    }
    return undefined;
  }
}
