/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { concat, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/public';
import {
  observabilityApplicationsID,
  observabilityApplicationsPluginOrder,
  observabilityApplicationsTitle,
  observabilityEventsID,
  observabilityEventsPluginOrder,
  observabilityEventsTitle,
  observabilityID,
  observabilityTracesTitle,
  observabilityMetricsID,
  observabilityMetricsPluginOrder,
  observabilityMetricsTitle,
  observabilityNotebookID,
  observabilityNotebookPluginOrder,
  observabilityNotebookTitle,
  observabilityPluginOrder,
  observabilityTitle,
  observabilityTracesID,
  observabilityTracesPluginOrder,
} from '../common/constants/shared';
import PPLService from './services/requests/ppl';
import DSLService from './services/requests/dsl';
import TimestampUtils from './services/timestamp/timestamp';
import SavedObjects from './services/saved_objects/event_analytics/saved_objects';
import { AppPluginStartDependencies, ObservabilitySetup, ObservabilityStart } from './types';
import { convertLegacyAppAnalyticsUrl } from './components/application_analytics/helpers/legacy_route_helpers';
import { uiSettingsService } from '../common/utils';
import { QueryManager } from '../common/query_manager';
import { DashboardSetup } from '../../../src/plugins/dashboard/public';

export class ObservabilityPlugin implements Plugin<ObservabilitySetup, ObservabilityStart> {
  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup, { dashboard }: { dashboard: DashboardSetup }): ObservabilitySetup {
    uiSettingsService.init(core.uiSettings, core.notifications);

    const appMountWithStartPage = (startPage?: string) => async (params: AppMountParameters) => {
      const { Observability } = await import('./components/index');
      const [coreStart, depsStart] = await core.getStartServices();
      const pplService = new PPLService(coreStart.http);
      const dslService = new DSLService(coreStart.http);
      const savedObjects = new SavedObjects(coreStart.http);
      const timestampUtils = new TimestampUtils(dslService, pplService);
      const qm = new QueryManager();

      return Observability(
        coreStart,
        depsStart as AppPluginStartDependencies,
        params,
        pplService,
        dslService,
        savedObjects,
        timestampUtils,
        qm,
        startPage
      );
    };

    // redirect legacy notebooks URL to current URL under observability
    if (window.location.pathname.includes('application_analytics')) {
      window.location.assign(convertLegacyAppAnalyticsUrl(window.location));
    }

    core.application.register({
      id: observabilityApplicationsID,
      title: observabilityApplicationsTitle,
      category: DEFAULT_APP_CATEGORIES.observability,
      order: observabilityApplicationsPluginOrder,
      mount: appMountWithStartPage('/application_analytics'),
    });

    core.application.register({
      id: observabilityEventsID,
      title: observabilityEventsTitle,
      category: DEFAULT_APP_CATEGORIES.observability,
      order: observabilityEventsPluginOrder,
      mount: appMountWithStartPage('/event_analytics'),
    });

    core.application.register({
      id: observabilityMetricsID,
      title: observabilityMetricsTitle,
      category: DEFAULT_APP_CATEGORIES.observability,
      order: observabilityMetricsPluginOrder,
      mount: appMountWithStartPage('/metrics_analytics'),
    });

    core.application.register({
      id: observabilityTracesID,
      title: observabilityTracesTitle,
      category: DEFAULT_APP_CATEGORIES.observability,
      order: observabilityTracesPluginOrder,
      mount: appMountWithStartPage('/trace_analytics'),
    });

    core.application.register({
      id: observabilityNotebookID,
      title: observabilityNotebookTitle,
      category: DEFAULT_APP_CATEGORIES.observability,
      order: observabilityNotebookPluginOrder,
      mount: appMountWithStartPage('/notebooks'),
    });

    core.application.register({
      id: observabilityID,
      title: observabilityTitle,
      category: DEFAULT_APP_CATEGORIES.plugins,
      order: observabilityPluginOrder,
      mount: appMountWithStartPage(),
    });

    // Return methods that should be available to other plugins
    return {};
  }
  public start(core: CoreStart): ObservabilityStart {
    return {};
  }
  public stop() {}
}
