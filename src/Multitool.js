/**
 * React hook function of plugin
 * @callback PluginHook
 * @param {*[]} params - props extracted according to inProps declaration of plugin
 * @param {Object.<string, *>} [customParams] - parameters, defined on plugin, that can be redefined by user
 * @returns {*[]}
 */

/**
 * @typedef Plugin
 * @property {string} [name] - plugin name
 * @property {number} priority - plugins will be sorted according to priority before usage
 * @property {string[]} [inProps] - list of incoming prop names; Plugin will receive props in specified order
 * @property {string[]} [cleanProps] - list of prop names to remove; Props will be removed just before adding outProps
 * @property {string[]} [outProps] - names of props that will be returned by plugin; Plugin must return props in the specified order
 * @property {PluginHook} usePlugin - React hook function
 * @property {Object.<string, *>} [customParams] - custom parameters to pass to plugin hook, can be re-defined by user
 */

/**
 * creates an object composed of the enumerable properties of object that are not omitted.
 * @param {Object.<string, *>} obj - the source object for processing
 * @param {[string]} omitList - the property names to omit
 * @returns {Object.<string, *>} - resulting new object without omitted properties
 */
const omit = (obj={}, omitList=[])=>Object.fromEntries(Object.entries(obj).filter(_=>!omitList.includes(_[0])))

/**
 * plugin reducer and runner
 * @param {Object} props - properties from previous plugin or from multitool
 * @param {Plugin} plugin - plugin to use
 * @returns {Object} - properties for next plugin or multitool applicants
 */
const useProcessPlugin = (props, plugin) => {
  const { inProps = [], cleanProps = [], outProps = [], usePlugin, customParams } = plugin;
  const pluginParams = inProps.map(prop => props[prop]);
  const outValues = usePlugin(pluginParams, customParams) || [];
  const resultProps = omit(props, cleanProps);
  outProps.forEach((prop, i) => {
    if (prop && outValues[i] !== undefined) {
      resultProps[prop] = outValues[i];
    }
  });
  return resultProps;
};

/**
 * Creates multitool hook
 * @param {Plugin[]} plugins - list of plugins
 * @param {string} [multitoolName]
 * @returns {function(*):*} - Multitool hook
 */
export function createMultitoolHook(plugins, multitoolName) {
  plugins = plugins.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const useMultitool = props => plugins.reduce(useProcessPlugin, props);
  multitoolName && (useMultitool.displayName = multitoolName);
  return useMultitool;
}

/**
 * Creates Multitool wrapper component
 * @param {Plugin[]} plugins - list of plugins
 * @param {string} [multitoolName] - optional display name for created Multitool component
 * @returns {React.FunctionComponent} - Multitool component
 */
export function createMultitool(plugins, multitoolName) {
  const useMultitool = createMultitoolHook(plugins, multitoolName);
  const Multitool = ({ children, ...props }) => children(useMultitool(props));
  multitoolName && (Multitool.displayName = multitoolName);
  return Multitool;
}

export default createMultitool;

/**
 * Renames specified prop, applies specified configuration properties and returns new plugin;
 * Use aliases if property name changed or there is name conflicts with another plugin;
 * Use config to change priority, name of plugin or any other configuration parameter.
 * Note, that you should keep number and order of in/outProps if you change them manually.
 * @param {Plugin} plugin
 * @param params
 * @param {Object.<string, string>} [params.propAliases] - map of original prop name to alias name;
 * @param {Object.<string, *>} [params.config] - properties of plugin to override
 * @param {Object.<string, *>} [params.customParams] - custom parameters to override (will be merged with plugin.customParams)
 * @returns {Plugin} - new plugin with renamed props / changed properties
 */
export const customizePlugin = (plugin, { propAliases = {}, config = {}, customParams } = {}) => {
  const rename = props => props?.map(p => propAliases[p] || p) ?? [];

  return {
    ...plugin,
    inProps: rename(plugin.inProps, propAliases),
    cleanProps: rename(plugin.cleanProps, propAliases),
    outProps: rename(plugin.outProps, propAliases),
    ...config,
    customParams:
      plugin.customParams && customParams ? { ...plugin.customParams, ...customParams } : plugin.customParams,
  };
};
