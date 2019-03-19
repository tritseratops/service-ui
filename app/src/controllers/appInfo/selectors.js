export const appInfoSelector = (state) => state.appInfo || {};
export const buildVersionSelector = (state) => {
  const appInfo = appInfoSelector(state);
  return appInfo.build ? appInfo.build.version : '';
};
const extensionsSelector = (state) => appInfoSelector(state).extensions || {};
const extensionConfigSelector = (state) => extensionsSelector(state).result || {};
const UATInfoSelector = (state) => appInfoSelector(state).UAT || {};
export const authExtensionsSelector = (state) => UATInfoSelector(state).auth_extensions || {};
export const instanceIdSelector = (state) =>
  extensionsSelector(state)['server.details.instance'] || '';
export const analyticsEnabledSelector = (state) =>
  !!extensionConfigSelector(state)['server.analytics.all'];
