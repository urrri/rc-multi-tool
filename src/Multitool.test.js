import React from 'react';
import { shallow } from 'enzyme';
import { createMultitool, customizePlugin } from './Multitool';

const getProps = () => ({
  prop1: 'test_prop1',
  prop2: 'test_prop2',
  removableProp: 'test_removableProp',
  renamableProp: 'test_renamableProp',
  aliasProp: 'test_aliasProp',
  orderProp: [],
});

const plugin1Result = 'plugin1Result';
const plugin2Result = 'plugin2Result';

/**
 * @returns Plugin
 */
const getTestPlugin1 = () => ({
  priority: 2000,
  name: 'TestPlugin1',
  inProps: ['orderProp', 'prop1', 'removableProp', 'renamableProp'],
  cleanProps: ['removableProp'],
  outProps: ['orderProp', plugin1Result],
  usePlugin: jest.fn(([orderProp, ...props]) => [[...orderProp, 'Plugin1'], props.join()]),
});

/**
 * @returns Plugin
 */
const getTestPlugin2 = () => ({
  priority: 1000,
  name: 'TestPlugin2',
  inProps: ['orderProp', 'prop2', 'removableProp', 'renamableProp'],
  cleanProps: ['removableProp'],
  outProps: ['orderProp', plugin2Result],
  usePlugin: jest.fn(([orderProp, ...props]) => [[...orderProp, 'Plugin2'], props.join()]),
  customParams: { testCustomParam1: 'test_customParam1', testCustomParam2: 'test_customParam2' },
});

const multitoolName = 'test_multitool';

describe('Multitool', () => {
  it('works without plugins', () => {
    const inProps = getProps();
    const Multitool = createMultitool([], multitoolName);
    const children = jest.fn();

    expect(Multitool.displayName).toBe(multitoolName);
    const wrapper = shallow(<Multitool {...inProps}>{children}</Multitool>);
    expect(wrapper).toMatchInlineSnapshot(`""`);
    expect(children.mock.calls[0][0]).toEqual(inProps);
  });

  it('passes, receives parameters to/from plugin and removes props', () => {
    const inProps = getProps();
    const plugin1 = getTestPlugin1();
    const plugin2 = getTestPlugin2();
    const Multitool = createMultitool([plugin2, plugin1], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    const [, ...p1inProps] = plugin1.usePlugin.mock.calls[0][0];
    const [, p1outProp] = plugin1.usePlugin.mock.results[0].value;
    const [, ...p2inProps] = plugin2.usePlugin.mock.calls[0][0];
    const [, p2outProp] = plugin2.usePlugin.mock.results[0].value;
    const p2customParams = plugin2.usePlugin.mock.calls[0][1];
    const outProps = children.mock.calls[0][0];

    expect(p1inProps).toMatchInlineSnapshot(`
      Array [
        "test_prop1",
        "test_removableProp",
        "test_renamableProp",
      ]
    `);
    expect(p1outProp).toMatchInlineSnapshot(`"test_prop1,test_removableProp,test_renamableProp"`);
    expect(p2inProps).toMatchInlineSnapshot(`
      Array [
        "test_prop2",
        undefined,
        "test_renamableProp",
      ]
    `);
    expect(p2outProp).toMatchInlineSnapshot(`"test_prop2,,test_renamableProp"`);
    expect(p2customParams).toBe(plugin2.customParams);

    // removable prop removed
    expect(p1inProps[1]).toBeDefined();
    expect(p2inProps[1]).toBeUndefined();

    // results applied to out props
    expect(outProps[plugin1Result]).toEqual(p1outProp);
    expect(outProps[plugin2Result]).toEqual(p2outProp);
    expect(outProps.removableProp).toBeUndefined();
  });

  it('allows aliasing prop names of parameters', () => {
    const inProps = getProps();
    const plugin1 = getTestPlugin1();
    const plugin2 = customizePlugin(getTestPlugin2(), { propAliases: { renamableProp: 'aliasProp' } });
    const Multitool = createMultitool([plugin1, plugin2], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    const [, ...p1inProps] = plugin1.usePlugin.mock.calls[0][0];
    const [, ...p2inProps] = plugin2.usePlugin.mock.calls[0][0];

    expect(p1inProps[2]).toBe(inProps.renamableProp);
    expect(p2inProps[2]).toBe(inProps.aliasProp);
  });

  it('ensures plugins priority', () => {
    const inProps = getProps();
    const plugin1 = getTestPlugin1();
    const plugin2 = getTestPlugin2();
    const Multitool = createMultitool([plugin2, plugin1], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    expect(children.mock.calls[0][0].orderProp).toMatchInlineSnapshot(`
      Array [
        "Plugin1",
        "Plugin2",
      ]
    `);

    // change plugin priority to change order
    const plugin1x = customizePlugin(plugin1, { config: { priority: -10 } });
    const Multitool2 = createMultitool([plugin2, plugin1x], multitoolName);
    const children2 = jest.fn();

    shallow(<Multitool2 {...inProps}>{children2}</Multitool2>);
    expect(children2.mock.calls[0][0].orderProp).toMatchInlineSnapshot(`
      Array [
        "Plugin2",
        "Plugin1",
      ]
    `);
  });

  it('allows customizePlugin', () => {
    const plugin = customizePlugin(getTestPlugin1(), {
      propAliases: {
        renamableProp: '__renamableProp__',
        removableProp: '__removableProp__',
        orderProp: '__orderProp__',
        dummyProp: 'dummyAlias',
      },
      config: { priority: 0, name: 'test_rename_plugin', dummy: 'dummy_test' },
      customParams: { testCustomParam: 'test_customParam' }, // should not be added
    });
    expect(plugin).toMatchInlineSnapshot(`
      Object {
        "cleanProps": Array [
          "__removableProp__",
        ],
        "customParams": undefined,
        "dummy": "dummy_test",
        "inProps": Array [
          "__orderProp__",
          "prop1",
          "__removableProp__",
          "__renamableProp__",
        ],
        "name": "test_rename_plugin",
        "outProps": Array [
          "__orderProp__",
          "plugin1Result",
        ],
        "priority": 0,
        "usePlugin": [MockFunction],
      }
    `);
  });

  it('allows customize customParams', () => {
    const plugin = customizePlugin(getTestPlugin2(), {
      customParams: { testCustomParam1: 'test_customParam1_changed', testCustomParam3: 'test_customParam3_new' },
    });
    expect(plugin.customParams).toMatchInlineSnapshot(`
      Object {
        "testCustomParam1": "test_customParam1_changed",
        "testCustomParam2": "test_customParam2",
        "testCustomParam3": "test_customParam3_new",
      }
    `);
  });
});
