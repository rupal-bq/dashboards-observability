/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { QueryManager } from 'common/query_manager';
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { CoreStart } from '../../../../src/core/public';
import { observabilityID, observabilityTitle } from '../../common/constants/shared';
import { store } from '../framework/redux/store';
import { AppPluginStartDependencies } from '../types';
import { AppRoutesWrapper } from './routes_wrapper';

interface ObservabilityAppDeps {
  coreStart: CoreStart;
  depsStart: AppPluginStartDependencies;
  pplService: any;
  dslService: any;
  savedObjects: any;
  timestampUtils: any;
  queryManager: QueryManager;
  startPage?: string;
}

// for cypress to test redux store
if (window.Cypress) {
  window.store = store;
}

export const App = ({
  coreStart,
  depsStart,
  pplService,
  dslService,
  savedObjects,
  timestampUtils,
  queryManager,
  startPage,
}: ObservabilityAppDeps) => {
  const { chrome, http, notifications } = coreStart;
  const parentBreadcrumb = {
    text: observabilityTitle,
    href: `${observabilityID}#/`,
  };

  return (
    <Provider store={store}>
      <HashRouter>
        <AppRoutesWrapper
          coreStart={coreStart}
          depsStart={depsStart}
          pplService={pplService}
          dslService={dslService}
          savedObjects={savedObjects}
          timestampUtils={timestampUtils}
          queryManager={queryManager}
          startPage={startPage}
        />{' '}
      </HashRouter>
    </Provider>
  );
};
