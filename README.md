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
    //...
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
    //...
}
```

## Create Custom Tool

Let's create Tool for previous example

```javascript
import React from 'react';
import { searchUtil } from 'src/utils';

// define Tool Hook
const useSearchableTable = (inProps) => {
  // extract incoming props according to inProps definition of the Tool
  const [items, searchParams = {}] = inProps;

  // internal state can be used as well as state received via props
  const [searchValue, setSearchValue] = React.useState();

  // filter and memoize table entries, using current search value
  const filteredItems = React.useMemo(
    () => items.filter(item => searchUtil(item, searchParams, searchValue)),
    [items, searchParams, searchValue]
  );

  // memoize search parameters
  const searchProps = React.useMemo(
    () => {searchValue, setSearchValue},
    [searchValue]
  );

  // return new props according to outProps definition of the Tool
  return [filteredItems, searchProps];
};

// define Tool
export const searchTableTool = {
  // optionally declare name - can be used for debugging
  name: 'SearchableTable',
  // define priority for the tool according to which it will be activated;
  // Tools with the same priority will be activated in random order;
  // can be used any number, default 0
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
};

```


## LICENSE

MIT
