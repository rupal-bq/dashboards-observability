/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { concat, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import ReactDOM from 'react-dom';
import React from 'react';
import {
  AppCategory,
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
  observabilityTracesTitle,
  observabilityMetricsID,
  observabilityMetricsPluginOrder,
  observabilityMetricsTitle,
  observabilityNotebookID,
  observabilityNotebookPluginOrder,
  observabilityNotebookTitle,
  observabilityTracesID,
  observabilityTracesPluginOrder,
  observabilityPanelsID,
  observabilityPanelsTitle,
  observabilityPanelsPluginOrder,
  observabilityLogsID,
  observabilityLogsTitle,
  observabilityLogsPluginOrder,
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

export const OBSERVABILITY_APP_CATEGORIES: Record<string, AppCategory> = Object.freeze({
  observability: {
    id: 'observability',
    label: i18n.translate('core.ui.observabilityNavList.label', {
      defaultMessage: 'Observability',
    }),
    order: 3000,
  },
});

export class ObservabilityPlugin implements Plugin<ObservabilitySetup, ObservabilityStart> {
  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup, { dashboard }: { dashboard: DashboardSetup }): ObservabilitySetup {
    uiSettingsService.init(core.uiSettings, core.notifications);

    const appMountWithStartPage = (componentName) => async (params: AppMountParameters) => {
      const [coreStart, depsStart] = await core.getStartServices();
      const pplService = new PPLService(coreStart.http);
      const dslService = new DSLService(coreStart.http);
      const savedObjects = new SavedObjects(coreStart.http);
      const timestampUtils = new TimestampUtils(dslService, pplService);
      const qm = new QueryManager();

      const TheComponent = React.lazy(() => import(`./components/${componentName}`));

      const DynamicRenderer = (props: any) => {
        const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);

        // Dynamically import the component when the app mounts
        React.useEffect(() => {
          import(`./components/${componentName}`).then((module) => {
            setComponent(module.default);
          });
        }, []);

        // Render the component when it has loaded
        return Component ? <Component {...props} /> : null;
      };

      return () => {
        ReactDOM.render(
          <TheComponent
          /* coreStart={CoreStartProp}
            //depsStart={DepsStart}
            pplService={pplService}
            dslService={dslService}
            savedObjects={savedObjects}
            timestampUtils={timestampUtils}
            queryManager={queryManager}
            observabilit*/
          />,
          AppMountParametersProp.element
        );

        return () => ReactDOM.unmountComponentAtNode(AppMountParametersProp.element);
      };
    };

    // redirect legacy notebooks URL to current URL under observability
    if (window.location.pathname.includes('application_analytics')) {
      window.location.assign(convertLegacyAppAnalyticsUrl(window.location));
    }

    core.application.register({
      id: observabilityApplicationsID,
      title: observabilityApplicationsTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityApplicationsPluginOrder,
      mount: appMountWithStartPage('/application_analytics'),
    });

    core.application.register({
      id: observabilityLogsID,
      title: observabilityLogsTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityLogsPluginOrder,
      mount: appMountWithStartPage('event_analytics'),
    });

    core.application.register({
      id: observabilityMetricsID,
      title: observabilityMetricsTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityMetricsPluginOrder,
      mount: appMountWithStartPage('/metrics_analytics'),
    });

    core.application.register({
      id: observabilityTracesID,
      title: observabilityTracesTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityTracesPluginOrder,
      mount: appMountWithStartPage('/trace_analytics'),
    });

    core.application.register({
      id: observabilityNotebookID,
      title: observabilityNotebookTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityNotebookPluginOrder,
      mount: appMountWithStartPage('/notebooks'),
    });

    core.application.register({
      id: observabilityPanelsID,
      title: observabilityPanelsTitle,
      category: OBSERVABILITY_APP_CATEGORIES.observability,
      order: observabilityPanelsPluginOrder,
      mount: appMountWithStartPage('/operational_panels'),
    });

    // Return methods that should be available to other plugins
    return {};
  }
  public start(core: CoreStart): ObservabilityStart {
    return {};
  }
  public stop() {}
}
