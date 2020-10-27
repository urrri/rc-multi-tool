# React Component Multitool

component extender with tools

## Setup

```sh
npm install @urrri/rc-multi-tool
```

## Usage

as React Hook

```javascript
import { createMultitoolHook } from '@urrri/rc-multi-tool';
import { aTool, bTool } from 'src/myTools';

const useMyComponentMultitool = createMultitoolHook(
  [
    aTool,
    bTool,
  ],
  'MyComponentMultitool'
);

//...
const multitoolProcessedProps = useMyComponentMultitool(myComponentProps);
return <MyComponent {...multitoolProcessedProps}/>;
//...
```

as wrapping Component:

```javascript
import { createMultitool } from '@urrri/rc-multi-tool';
import { aTool, bTool } from 'src/myTools';

const MyComponentMultitool = createMultitool(
  [
    aTool,
    bTool,
  ],
  'MyComponentMultitool'
);

//...
return (
  <MyComponentMultitool {...myComponentProps}>
    {
      (multitoolProcessedProps) => <MyComponent {...multitoolProcessedProps}/>
    }
  </MyComponentMultitool>
)
//...
```

with Multiple Components

```javascript
import { createMultitoolHook } from '@urrri/rc-multi-tool';
import { searchTableTool, /*...*/ } from 'src/myTools';

const useTableMultitool = createMultitoolHook(
  [
    searchTableTool,
    //...
  ],
  'TableMultitool'
);

//...
import { Table, TableSearch } from 'src/components';

export function SearchableTable({items, ...otherProps}){
  // Note: extraction "items" from other props is just for sample
  const {
    searchProps, // props, prepared by search tool for Search component
    items,       // items, filtered by search tool for Table component
    ...otherTableProps
  } = useTableMultitool({items, ...otherProps});

  return (
    <>
      <TableSearch {...searchProps} />
      <Table items={items} {...otherTableProps} />;
    </>
  )
}

//...
  <SearchableTable items={/*...*/} /*other props*/ />
//...
```

## Create Custom Tool

Let's create Tool for previous example

```javascript
import React from 'react';
import { searchUtil } from 'src/utils';

// define Tool Hook
const useSearchableTable = (inProps, customParams) => {

  // extract incoming props according to the inProps definition of the Tool
  const [items, searchParams = {}] = inProps;

  // extract customParams according to the customParams definition of the Tool
  const { searchUtil } = customParams;

  // internal state can be used as well as state received via props
  const [searchValue, setSearchValue] = React.useState();

  // filter and memoize table entries, using current search value
  const filteredItems = React.useMemo(
    () => items.filter(item => searchUtil(item, searchValue, searchParams)),
    [items, searchParams, searchValue]
  );

  // prepare search parameters for using in TableSearch component
  const searchProps = {searchValue, setSearchValue};

  // return new props according to the outProps definition of the Tool
  return [filteredItems, searchProps];
};

// define Tool
export const searchTableTool = {

  // optionally declare name - can be used for debugging
  name: 'SearchableTable',

  // define priority for the tool according to which it will be placed in the activation queue;
  // Tools with the same priority will be activated in a random order;
  // any number can be used, default is 0;
  priority: 1000,

  // define prop names and order for incoming props (optional)
  inProps: ['items', 'searchParams'],

  // define prop names to remove from list of props
  // just after processing tool and before applying results (optional)
  cleanProps: ['searchParams'],

  // define prop names (and order) to apply Tool processing results to (optional);
  outProps: ['items', 'searchProps'],

  // apply Tool Hook;
  // calling hook this way allows better naming in React DevTool;
  useTool: (...p) => useSearchableTable(...p),

  // use customParams to pass customizable parameters to the Tool Hook
  customParams: { searchUtil }
};

```

## Customizing third party Tool

Sometimes you want to use a Tool with a component which prop names are slightly different from those used in the Tool.
E.g. you are using different component or there is a breaking naming change in the new version.

Sometimes a Tool must be activated in a different sequence with another Tool, which requires a change in the activation priority.
All that can be solved manually or by using Tool customizer.

Let's update our last example to use with a table, that
 - has a "dataSource" prop instead of "items",
 - requires special function for filtering items

and with another Tool, that
 - requires our Tool to change the priority to 500

```javascript
import { customizeTool, createMultitoolHook } from '@urrri/rc-multi-tool';
import { searchTableTool, anotherTool } from 'src/myTools';

// creates new Tool, based on original with customized parameters
const customSearchTableTool = customizeTool( searchTableTool, {

  propAliases: {
    // replaces all 'items' name entries with 'dataSource', keeps order
    items: 'dataSource'
  },

  config: {
    // overwrites config parameter directly
    priority: 500
  },

  customParams: {
    // shallow merges custom parameters
    searchUtil: /*custom implementation*/
  }
});

const useTableMultitool = createMultitoolHook(
  [
    customSearchTableTool,
    anotherTool
  ],
  'TableMultitool'
);

//...
import { Table, TableSearch } from 'src/components';

export function SearchableTable(props){
  const { searchProps, ...tableProps } = useTableMultitool(props);

  return (
    <>
      <TableSearch {...searchProps} />
      <Table {...tableProps} />;
    </>
  )
}

//...
  <SearchableTable dataSource={/*...*/} /*other props*/ />
//...
```

## LICENSE

MIT
