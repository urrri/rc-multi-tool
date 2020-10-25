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
import { aPlugin, bPlugin } from 'src/components/myPlugins';

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
import { aPlugin, bPlugin } from 'src/components/myPlugins';

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

## LICENSE

MIT
