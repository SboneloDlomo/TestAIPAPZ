import { fetchOrganisations } from '../utils/fetch-organisations';

export default async () => {
  const organisations = await fetchOrganisations();
  return { organisations: organisations };
};
