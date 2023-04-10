/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { observabilityApplicationsID } from '../../../../common/constants/shared';

export const convertLegacyAppAnalyticsUrl = (location: Location) => {
  const pathname = location.pathname.replace('application_analytics', observabilityApplicationsID);
  const hash = `#/notebooks${location.hash.replace(/^#/, '')}${
    location.hash.includes('?') ? location.search.replace(/^\?/, '&') : location.search
  }`;
  return pathname + hash;
};
