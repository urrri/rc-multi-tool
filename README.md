# React Component Multitool

component extender with plugins

## Setup

```sh
npm install @urrri/rc-multi-tool
```

## Usage

as React Hook

```javascript
import { createMultitoolHook } from '@urrri/rc-multi-tool';
import { aPlugin, bPlugin } from 'src/myPlugins';

const useMyComponentMultitool = createMultitoolHook(
  [
    aPlugin,
    bPlugin,
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
import { aPlugin, bPlugin } from 'src/myPlugins';

const MyComponentMultitool = createMultitool(
  [
    aPlugin,
    bPlugin,
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
import { searchTablePlugin, /*...*/ } from 'src/myPlugins';

const useTableMultitool = createMultitoolHook(
  [
    searchTablePlugin,
    //...
  ],
  'TableMultitool'
);

//...
import { Table, TableSearch } from 'src/components';
//...
const {
    searchProps, // props, prepared by search plugin for Search component
    items,       // items, filtered by search plugin for Table component
    ...otherTableProps
} = useTableMultitool({items, ...otherProps});

return (
    <>
        <TableSearch {...searchProps} />
        <Table items={items} {...otherTableProps} />;
    </>
)
//...
```



## LICENSE

MIT
