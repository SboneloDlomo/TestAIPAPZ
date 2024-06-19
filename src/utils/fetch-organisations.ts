import axios from 'axios';
import { fetchSecrets } from './fetch-secrets';

export const fetchOrganisations = async () => {
  let secrets;
  try {
    // Get API connection details:
    secrets = await fetchSecrets();
  } catch (error) {
    console.error(
      'Error retrieving secrets from AWS secrets manager: ',
      JSON.stringify(error),
    );
    return [];
  }

  const urlLogin = `${secrets?.apzor?.login_url}`;
  let loginResult;
  try {
    // Login to Apzor API:
    const dataBodyLogin = {
      userName: secrets?.apzor?.username,
      password: secrets?.apzor?.password,
    };
    const optionsLogin = {
      headers: {},
    };
    loginResult = await axios.post(urlLogin, dataBodyLogin, optionsLogin);

    if (loginResult.status === 401) {
      console.error('Unauthorized', 401);
      return [];
    } else if (loginResult.status !== 200) {
      console.error('Internal server error', 500);
      return [];
    }
  } catch (error) {
    console.error(
      `Error authenticating at (${urlLogin}): `,
      JSON.stringify(error),
    );
    return [];
  }

  let urlGetOrgs;
  try {
    // Get Organisations:
    urlGetOrgs = `${secrets?.apzor?.org_url}`;
    const idToken = loginResult?.data?.AuthenticationResult?.IdToken;
    const bearerAuth = 'Bearer ' + idToken;
    const headers = {
      Authorization: bearerAuth,
    };

    const resultGetOrgs = await axios.get(urlGetOrgs, {
      headers: headers,
    });

    if (resultGetOrgs.status === 200) {
      return resultGetOrgs?.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error(
      `Error retrieving list of organisations from (${urlGetOrgs}): `,
      JSON.stringify(error),
    );
    return [];
  }
};
