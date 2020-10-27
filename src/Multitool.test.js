import React from 'react';
import { shallow } from 'enzyme';
import { createMultitool, customizeTool } from './Multitool';

const getProps = () => ({
  prop1: 'test_prop1',
  prop2: 'test_prop2',
  removableProp: 'test_removableProp',
  renamableProp: 'test_renamableProp',
  aliasProp: 'test_aliasProp',
  orderProp: [],
});

const tool1Result = 'tool1Result';
const tool2Result = 'tool2Result';

/**
 * @returns Tool
 */
const getTestTool1 = () => ({
  priority: 2000,
  name: 'TestTool1',
  inProps: ['orderProp', 'prop1', 'removableProp', 'renamableProp'],
  cleanProps: ['removableProp'],
  outProps: ['orderProp', tool1Result],
  useTool: jest.fn(([orderProp, ...props]) => [[...orderProp, 'Tool1'], props.join()]),
});

/**
 * @returns Tool
 */
const getTestTool2 = () => ({
  priority: 1000,
  name: 'TestTool2',
  inProps: ['orderProp', 'prop2', 'removableProp', 'renamableProp'],
  cleanProps: ['removableProp'],
  outProps: ['orderProp', tool2Result],
  useTool: jest.fn(([orderProp, ...props]) => [[...orderProp, 'Tool2'], props.join()]),
  customParams: { testCustomParam1: 'test_customParam1', testCustomParam2: 'test_customParam2' },
});

const multitoolName = 'test_multitool';

describe('Multitool', () => {
  it('works without tools', () => {
    const inProps = getProps();
    const Multitool = createMultitool([], multitoolName);
    const children = jest.fn();

    expect(Multitool.displayName).toBe(multitoolName);
    const wrapper = shallow(<Multitool {...inProps}>{children}</Multitool>);
    expect(wrapper).toMatchInlineSnapshot(`""`);
    expect(children.mock.calls[0][0]).toEqual(inProps);
  });

  it('passes, receives parameters to/from tool and removes props', () => {
    const inProps = getProps();
    const tool1 = getTestTool1();
    const tool2 = getTestTool2();
    const Multitool = createMultitool([tool2, tool1], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    const [, ...p1inProps] = tool1.useTool.mock.calls[0][0];
    const [, p1outProp] = tool1.useTool.mock.results[0].value;
    const [, ...p2inProps] = tool2.useTool.mock.calls[0][0];
    const [, p2outProp] = tool2.useTool.mock.results[0].value;
    const p2customParams = tool2.useTool.mock.calls[0][1];
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
    expect(p2customParams).toBe(tool2.customParams);

    // removable prop removed
    expect(p1inProps[1]).toBeDefined();
    expect(p2inProps[1]).toBeUndefined();

    // results applied to out props
    expect(outProps[tool1Result]).toEqual(p1outProp);
    expect(outProps[tool2Result]).toEqual(p2outProp);
    expect(outProps.removableProp).toBeUndefined();
  });

  it('allows aliasing prop names of parameters', () => {
    const inProps = getProps();
    const tool1 = getTestTool1();
    const tool2 = customizeTool(getTestTool2(), { propAliases: { renamableProp: 'aliasProp' } });
    const Multitool = createMultitool([tool1, tool2], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    const [, ...p1inProps] = tool1.useTool.mock.calls[0][0];
    const [, ...p2inProps] = tool2.useTool.mock.calls[0][0];

    expect(p1inProps[2]).toBe(inProps.renamableProp);
    expect(p2inProps[2]).toBe(inProps.aliasProp);
  });

  it('ensures tools priority', () => {
    const inProps = getProps();
    const tool1 = getTestTool1();
    const tool2 = getTestTool2();
    const Multitool = createMultitool([tool2, tool1], multitoolName);
    const children = jest.fn();

    shallow(<Multitool {...inProps}>{children}</Multitool>);
    expect(children.mock.calls[0][0].orderProp).toMatchInlineSnapshot(`
      Array [
        "Tool1",
        "Tool2",
      ]
    `);

    // change tool priority to change order
    const tool1x = customizeTool(tool1, { config: { priority: -10 } });
    const Multitool2 = createMultitool([tool2, tool1x], multitoolName);
    const children2 = jest.fn();

    shallow(<Multitool2 {...inProps}>{children2}</Multitool2>);
    expect(children2.mock.calls[0][0].orderProp).toMatchInlineSnapshot(`
      Array [
        "Tool2",
        "Tool1",
      ]
    `);
  });

  it('allows customizeTool', () => {
    const tool = customizeTool(getTestTool1(), {
      propAliases: {
        renamableProp: '__renamableProp__',
        removableProp: '__removableProp__',
        orderProp: '__orderProp__',
        dummyProp: 'dummyAlias',
      },
      config: { priority: 0, name: 'test_rename_tool', dummy: 'dummy_test' },
      customParams: { testCustomParam: 'test_customParam' }, // should not be added
    });
    expect(tool).toMatchInlineSnapshot(`
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
        "name": "test_rename_tool",
        "outProps": Array [
          "__orderProp__",
          "tool1Result",
        ],
        "priority": 0,
        "useTool": [MockFunction],
      }
    `);
  });

  it('allows customize customParams', () => {
    const tool = customizeTool(getTestTool2(), {
      customParams: { testCustomParam1: 'test_customParam1_changed', testCustomParam3: 'test_customParam3_new' },
    });
    expect(tool.customParams).toMatchInlineSnapshot(`
      Object {
        "testCustomParam1": "test_customParam1_changed",
        "testCustomParam2": "test_customParam2",
        "testCustomParam3": "test_customParam3_new",
      }
    `);
  });
});
