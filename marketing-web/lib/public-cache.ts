import { cache } from 'react';

import { fetchPublicPage } from './public-api';

/** Single fetch per request for page body + generateMetadata. */
export const getPublicPage = cache(fetchPublicPage);
