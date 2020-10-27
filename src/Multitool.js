/**
 * React hook function of tool
 * @callback ToolHook
 * @param {*[]} params - props extracted according to inProps declaration of tool
 * @param {Object.<string, *>} [customParams] - parameters, defined on tool, that can be redefined by user
 * @returns {*[]}
 */

/**
 * @typedef Tool
 * @property {string} [name] - tool name
 * @property {number} priority - tools will be sorted according to priority before usage
 * @property {string[]} [inProps] - list of incoming prop names; Tool will receive props in specified order
 * @property {string[]} [cleanProps] - list of prop names to remove; Props will be removed just before adding outProps
 * @property {string[]} [outProps] - names of props that will be returned by tool; Tool must return props in the specified order
 * @property {ToolHook} useTool - React hook function
 * @property {Object.<string, *>} [customParams] - custom parameters to pass to tool hook, can be re-defined by user
 */

/**
 * creates an object composed of the enumerable properties of object that are not omitted.
 * @param {Object.<string, *>} obj - the source object for processing
 * @param {[string]} omitList - the property names to omit
 * @returns {Object.<string, *>} - resulting new object without omitted properties
 */
const omit = (obj={}, omitList=[])=>Object.fromEntries(Object.entries(obj).filter(_=>!omitList.includes(_[0])))

/**
 * tool reducer and runner
 * @param {Object} props - properties from previous tool or from multitool
 * @param {Tool} tool - tool to use
 * @returns {Object} - properties for next tool or multitool applicants
 */
const useToolActivator = (props, tool) => {
  const { inProps = [], cleanProps = [], outProps = [], useTool, customParams } = tool;
  const toolParams = inProps.map(prop => props[prop]);
  const outValues = useTool(toolParams, customParams) || [];
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
 * @param {Tool[]} tools - list of tools
 * @param {string} [multitoolName]
 * @returns {function(*):*} - Multitool hook
 */
export function createMultitoolHook(tools, multitoolName) {
  tools = tools.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const useMultitool = props => tools.reduce(useToolActivator, props);
  multitoolName && (useMultitool.displayName = multitoolName);
  return useMultitool;
}

/**
 * Creates Multitool wrapper component
 * @param {Tool[]} tools - list of tools
 * @param {string} [multitoolName] - optional display name for created Multitool component
 * @returns {React.FunctionComponent} - Multitool component
 */
export function createMultitool(tools, multitoolName) {
  const useMultitool = createMultitoolHook(tools, multitoolName);
  const Multitool = ({ children, ...props }) => children(useMultitool(props));
  multitoolName && (Multitool.displayName = multitoolName);
  return Multitool;
}

export default createMultitool;

/**
 * Renames specified prop, applies specified configuration properties and returns new tool;
 * Use aliases if property name changed or there is name conflicts with another tool;
 * Use config to change priority, name of tool or any other configuration parameter.
 * Note, that you should keep number and order of in/outProps if you change them manually.
 * @param {Tool} tool
 * @param params
 * @param {Object.<string, string>} [params.propAliases] - map of original prop name to alias name;
 * @param {Object.<string, *>} [params.config] - properties of tool to override
 * @param {Object.<string, *>} [params.customParams] - custom parameters to override (will be merged with tool.customParams)
 * @returns {Tool} - new tool with renamed props / changed properties
 */
export const customizeTool = (tool, { propAliases = {}, config = {}, customParams } = {}) => {
  const rename = props => props?.map(p => propAliases[p] || p) ?? [];

  return {
    ...tool,
    inProps: rename(tool.inProps, propAliases),
    cleanProps: rename(tool.cleanProps, propAliases),
    outProps: rename(tool.outProps, propAliases),
    ...config,
    customParams:
      tool.customParams && customParams ? { ...tool.customParams, ...customParams } : tool.customParams,
  };
};
