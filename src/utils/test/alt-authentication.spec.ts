import { Test, TestingModule } from '@nestjs/testing';
import { AlternateAuthenticationService } from '../alt-authentication';
import { ConfigService } from '@nestjs/config';

describe('Alternate Authentication Service', () => {
  let service: AlternateAuthenticationService;
  let mockConfigServiceGet;

  beforeEach(async () => {
    mockConfigServiceGet = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlternateAuthenticationService,
        {
          provide: ConfigService,
          useValue: { get: mockConfigServiceGet },
        },
      ],
    }).compile();
    service = module.get<AlternateAuthenticationService>(
      AlternateAuthenticationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return undefined when headers are missing', async () => {
    // GIVEN
    const headers = {};
    // WHEN
    const result = await service.altAuth(headers);
    // THEN
    expect(result).toBe(undefined);
  });

  it('should return undefined when headers are present and organisation not found', async () => {
    // GIVEN
    const auth =
      'Basic ' +
      Buffer.from(
        '301fd70c-e164-4d7e-89ae-6a73a4c136c2' +
          ':' +
          'c671b19b-4a50-4745-921a-46012bfc49c9',
      ).toString('base64');
    const headers = {
      authorization: auth,
    };
    mockConfigServiceGet.mockReturnValue([
      {
        id: 'bbf24484-ed74-4ad6-b2e8-8357e866629f',
        apiKey: '7d654fa9-0908-43a5-858d-ce2c94b40424',
      },
    ]);
    // WHEN
    const result = await service.altAuth(headers);
    // THEN
    expect(result).toBe(undefined);
  });

  it('should return undefined when headers are present, organisation is found, but API key does not match', async () => {
    // GIVEN
    const auth =
      'Basic ' +
      Buffer.from(
        'bbf24484-ed74-4ad6-b2e8-8357e866629f' +
          ':' +
          'c671b19b-4a50-4745-921a-46012bfc49c9',
      ).toString('base64');
    const headers = {
      authorization: auth,
    };

    mockConfigServiceGet.mockReturnValue([
      {
        id: 'bbf24484-ed74-4ad6-b2e8-8357e866629f',
        apiKey: '7d654fa9-0908-43a5-858d-ce2c94b40424',
      },
    ]);
    // WHEN
    const result = await service.altAuth(headers);
    // THEN
    expect(result).toBe(undefined);
  });

  it('should return organisationId when headers are present, organisation is found, and API key matches', async () => {
    // GIVEN
    const auth =
      'Basic ' +
      Buffer.from(
        'bbf24484-ed74-4ad6-b2e8-8357e866629f' +
          ':' +
          '7d654fa9-0908-43a5-858d-ce2c94b40424',
      ).toString('base64');
    const headers = {
      authorization: auth,
    };

    mockConfigServiceGet.mockReturnValue([
      {
        id: 'bbf24484-ed74-4ad6-b2e8-8357e866629f',
        apiKey: '7d654fa9-0908-43a5-858d-ce2c94b40424',
      },
    ]);

    // WHEN
    const result = await service.altAuth(headers);

    // THEN
    expect(result).toEqual('bbf24484-ed74-4ad6-b2e8-8357e866629f');
  });
});
