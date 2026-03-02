// Full Stack Developer Roadmap
// JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, Docker, System Design, Rust, Python

export interface Topic {
  name: string;
  description: string;
  concepts: string[];
  code?: string;
}

export interface Module {
  id: string;
  name: string;
  icon: string;
  description: string;
  estimatedHours: number;
  topics: Topic[];
  prerequisites?: string[];
}

export interface Phase {
  id: string;
  name: string;
  icon: string;
  description: string;
  modules: Module[];
}

export interface SkillRoadmap {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  phases: Phase[];
}

// ============================================================
// JAVASCRIPT ROADMAP
// ============================================================
export const JAVASCRIPT_ROADMAP: Phase[] = [
  {
    id: 'js-fundamentals',
    name: 'Phase 1: Fundamentals',
    icon: '🌱',
    description: 'The foundation. Master these or everything else crumbles.',
    modules: [
      {
        id: 'js-variables',
        name: 'Variables & Types',
        icon: '📦',
        description: 'Understanding how JavaScript stores and categorizes data.',
        estimatedHours: 2,
        topics: [
          {
            name: 'Variable Declarations',
            description: 'var, let, and const - when to use each and why var is legacy.',
            concepts: ['let vs const vs var', 'block scope', 'temporal dead zone', 'hoisting'],
            code: `let name = "Mirlind";
const PI = 3.14159;
// var is function-scoped (old way)
// let/const are block-scoped (modern way)`
          },
          {
            name: 'Primitive Types',
            description: 'The building blocks of JavaScript data.',
            concepts: ['string', 'number', 'boolean', 'null', 'undefined', 'symbol', 'bigint'],
            code: `typeof "hello";     // "string"
typeof 42;          // "number"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof null;        // "object" (bug!)
typeof Symbol();    // "symbol"`
          },
          {
            name: 'Reference Types',
            description: 'Objects, arrays, and functions - stored by reference.',
            concepts: ['objects', 'arrays', 'functions', 'pass by reference', 'pass by value'],
            code: `const obj = { name: "Mirlind" };
const arr = [1, 2, 3];
// Both are reference types
const obj2 = obj; // Same reference!`
          }
        ]
      },
      {
        id: 'js-control-flow',
        name: 'Operators & Control Flow',
        icon: '🔀',
        description: 'Making decisions and performing calculations.',
        estimatedHours: 2,
        topics: [
          {
            name: 'Comparison Operators',
            description: 'Checking equality and relationships.',
            concepts: ['== vs ===', '!= vs !==', 'truthy/falsy values', 'type coercion'],
            code: `5 == "5";     // true (coercion)
5 === "5";    // false (strict)

// Always use === (strict equality)
// Falsy: 0, "", null, undefined, NaN, false`
          },
          {
            name: 'Conditional Statements',
            description: 'if, else if, else, switch, ternary.',
            concepts: ['if/else', 'switch', 'ternary operator', 'short-circuit evaluation'],
            code: `if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}

// Ternary
const status = age >= 18 ? "Adult" : "Minor";`
          },
          {
            name: 'Loops',
            description: 'Repeating actions efficiently.',
            concepts: ['for', 'while', 'do while', 'break', 'continue', 'for...of', 'for...in'],
            code: `// Standard for loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// for...of (arrays)
for (const item of array) {
  console.log(item);
}`
          }
        ]
      },
      {
        id: 'js-functions',
        name: 'Functions Basics',
        icon: '⚙️',
        description: 'The heart of JavaScript - reusable blocks of code.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Function Declarations vs Expressions',
            description: 'Different ways to define functions.',
            concepts: ['function declaration', 'function expression', 'hoisting differences', 'anonymous functions'],
            code: `// Declaration (hoisted)
function greet(name) {
  return "Hello " + name;
}

// Expression (not hoisted)
const greet = function(name) {
  return "Hello " + name;
};`
          },
          {
            name: 'Arrow Functions',
            description: 'Modern concise function syntax.',
            concepts: ['arrow syntax', 'implicit return', 'this binding', 'when NOT to use'],
            code: `// Arrow function
const add = (a, b) => a + b;

// Single parameter (no parentheses needed)
const square = x => x * x;

// Block body
const greet = name => {
  const message = "Hello " + name;
  return message;
};`
          },
          {
            name: 'Parameters & Arguments',
            description: 'Passing data into functions.',
            concepts: ['default parameters', 'rest parameters', 'arguments object', 'destructuring parameters'],
            code: `// Default parameters
function greet(name = "Guest") {
  return "Hello " + name;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b);
}`
          }
        ]
      }
    ]
  },
  {
    id: 'js-core',
    name: 'Phase 2: Core Concepts',
    icon: '🎯',
    description: 'The deeper mechanics that separate juniors from seniors.',
    modules: [
      {
        id: 'js-scope',
        name: 'Scope & Closures',
        icon: '🔒',
        description: 'Understanding variable accessibility and the magic of closures.',
        estimatedHours: 4,
        prerequisites: ['js-functions'],
        topics: [
          {
            name: 'Lexical Scope',
            description: 'Where variables are accessible based on where they are defined.',
            concepts: ['global scope', 'function scope', 'block scope', 'lexical environment', 'scope chain'],
            code: `const global = "I am everywhere";

function outer() {
  const outerVar = "I am in outer";
  
  function inner() {
    const innerVar = "I am in inner";
    console.log(global);    // ✓ accessible
    console.log(outerVar);  // ✓ accessible (closure!)
    console.log(innerVar);  // ✓ accessible
  }
}`
          },
          {
            name: 'Closures',
            description: 'Functions remembering their birth environment.',
            concepts: ['closure definition', 'data privacy', 'factory functions', 'module pattern'],
            code: `// Closure example
function createCounter() {
  let count = 0;  // Private variable
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
console.log(counter.getCount()); // 2`
          },
          {
            name: 'Hoisting',
            description: 'Variables and functions being moved to the top.',
            concepts: ['variable hoisting', 'function hoisting', 'TDZ (temporal dead zone)', 'best practices'],
            code: `// var is hoisted (initialized as undefined)
console.log(x); // undefined
var x = 5;

// let/const are hoisted but not initialized (TDZ)
console.log(y); // ReferenceError!
let y = 5;

// Functions are fully hoisted
greet(); // Works!
function greet() { return "Hi"; }`
          }
        ]
      },
      {
        id: 'js-this',
        name: 'this & Context',
        icon: '👤',
        description: 'Understanding the mysterious "this" keyword.',
        estimatedHours: 3,
        prerequisites: ['js-functions'],
        topics: [
          {
            name: 'How this is Determined',
            description: 'The 4 rules of this binding.',
            concepts: ['default binding', 'implicit binding', 'explicit binding', 'new binding', 'this precedence'],
            code: `// 1. Default: window (strict: undefined)
function greet() { console.log(this); }
greet(); // window

// 2. Implicit: object method
const user = {
  name: "Mirlind",
  greet() { console.log(this.name); }
};
user.greet(); // "Mirlind"

// 3. Explicit: call, apply, bind
greet.call(user); // this = user

// 4. New: constructor function
new MyClass();`
          },
          {
            name: 'call, apply, bind',
            description: 'Explicitly controlling this.',
            concepts: ['Function.prototype.call', 'Function.prototype.apply', 'Function.prototype.bind', 'borrowing methods'],
            code: `const user = { name: "Mirlind" };

function greet(greeting) {
  console.log(greeting + ", " + this.name);
}

// call - comma separated args
greet.call(user, "Hello");

// apply - array of args
greet.apply(user, ["Hi"]);

// bind - returns new function
const boundGreet = greet.bind(user);
boundGreet("Hey");`
          },
          {
            name: 'Arrow Functions & this',
            description: 'Arrow functions do NOT have their own this.',
            concepts: ['lexical this', 'when to use arrows', 'when NOT to use arrows', 'common pitfalls'],
            code: `const user = {
  name: "Mirlind",
  
  // Regular function - its own this
  regularGreet: function() {
    console.log(this.name); // "Mirlind"
  },
  
  // Arrow function - inherits this
  arrowGreet: () => {
    console.log(this.name); // undefined (inherits from outer scope)
  }
};`
          }
        ]
      },
      {
        id: 'js-async',
        name: 'Asynchronous JavaScript',
        icon: '⏳',
        description: 'Handling operations that take time.',
        estimatedHours: 5,
        prerequisites: ['js-functions'],
        topics: [
          {
            name: 'Callbacks',
            description: 'The original async pattern.',
            concepts: ['callback functions', 'callback hell', 'error handling', 'async patterns'],
            code: `// Callback pattern
function fetchData(callback) {
  setTimeout(() => {
    callback(null, { id: 1, name: "Mirlind" });
  }, 1000);
}

fetchData((err, data) => {
  if (err) console.error(err);
  else console.log(data);
});`
          },
          {
            name: 'Promises',
            description: 'A cleaner way to handle async operations.',
            concepts: ['Promise states', '.then()', '.catch()', '.finally()', 'Promise.all()', 'Promise.race()'],
            code: `// Creating a Promise
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ id: 1, name: "Mirlind" });
    }, 1000);
  });
};

// Using Promises
fetchData()
  .then(data => console.log(data))
  .catch(err => console.error(err));`
          },
          {
            name: 'Async/Await',
            description: 'Syntactic sugar for Promises - looks synchronous.',
            concepts: ['async keyword', 'await keyword', 'try/catch with async', 'parallel vs sequential'],
            code: `// Async function
async function getUser() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
  }
}

// Even cleaner arrow syntax
const getUser = async () => {
  const data = await fetch('/api/user').then(r => r.json());
  return data;
};`
          }
        ]
      }
    ]
  },
  {
    id: 'js-advanced',
    name: 'Phase 3: Advanced',
    icon: '🚀',
    description: 'The techniques that make you a JavaScript expert.',
    modules: [
      {
        id: 'js-prototypes',
        name: 'Prototypes & Inheritance',
        icon: '🧬',
        description: 'How JavaScript objects inherit from each other.',
        estimatedHours: 4,
        prerequisites: ['js-this'],
        topics: [
          {
            name: 'Prototype Chain',
            description: 'The inheritance mechanism of JavaScript.',
            concepts: ['[[Prototype]]', '__proto__', 'Object.prototype', 'prototype chain lookup'],
            code: `const animal = { eats: true };
const rabbit = { jumps: true };

// Set prototype
Object.setPrototypeOf(rabbit, animal);

console.log(rabbit.eats); // true (inherited from animal)`
          },
          {
            name: 'Constructor Functions',
            description: 'The old way to create object blueprints.',
            concepts: ['new keyword', 'this in constructors', 'prototype property', 'instanceof'],
            code: `function User(name) {
  this.name = name;
}

User.prototype.greet = function() {
  return "Hello, " + this.name;
};

const user = new User("Mirlind");
console.log(user.greet());`
          },
          {
            name: 'ES6 Classes',
            description: 'Syntactic sugar over prototypes.',
            concepts: ['class keyword', 'constructor', 'extends', 'super', 'getters/setters', 'static methods'],
            code: `class User {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return \`Hello, \${this.name}\`;
  }
  
  static createGuest() {
    return new User("Guest");
  }
}

class Admin extends User {
  constructor(name, role) {
    super(name);
    this.role = role;
  }
}`
          }
        ]
      },
      {
        id: 'js-es6',
        name: 'ES6+ Features',
        icon: '✨',
        description: 'Modern JavaScript that makes code cleaner.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Destructuring',
            description: 'Extract values from objects and arrays cleanly.',
            concepts: ['object destructuring', 'array destructuring', 'nested destructuring', 'default values'],
            code: `// Object destructuring
const { name, age = 25 } = user;

// Array destructuring
const [first, second, ...rest] = array;

// Nested destructuring
const { address: { city } } = user;

// Renaming
const { name: fullName } = user;`
          },
          {
            name: 'Spread & Rest Operators',
            description: 'Expand or collect values with three dots.',
            concepts: ['spread syntax', 'rest parameters', 'array spread', 'object spread', 'immutability'],
            code: `// Spread arrays
const combined = [...arr1, ...arr2];

// Spread objects (shallow copy)
const userCopy = { ...user, age: 26 };

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b);
}

// Array immutability
const newArray = [...oldArray, newItem];`
          },
          {
            name: 'Modules',
            description: 'Organizing code into reusable pieces.',
            concepts: ['import', 'export', 'default exports', 'named exports', 'import * as'],
            code: `// Named exports
export const PI = 3.14159;
export function add(a, b) { return a + b; }

// Default export
export default class Calculator { }

// Importing
import Calculator, { PI, add } from './math.js';
import * as math from './math.js';`
          }
        ]
      }
    ]
  }
];

// ============================================================
// TYPESCRIPT ROADMAP
// ============================================================
export const TYPESCRIPT_ROADMAP: Phase[] = [
  {
    id: 'ts-basics',
    name: 'Phase 1: TypeScript Basics',
    icon: '📘',
    description: 'Adding types to JavaScript for safer code.',
    modules: [
      {
        id: 'ts-types',
        name: 'Basic Types',
        icon: '🏷️',
        description: 'The fundamental TypeScript types.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Primitive Types',
            description: 'string, number, boolean, and more.',
            concepts: ['string', 'number', 'boolean', 'null', 'undefined', 'any', 'unknown', 'never'],
            code: `let name: string = "Mirlind";
let age: number = 25;
let isActive: boolean = true;

// Avoid any, prefer unknown
let something: unknown = fetchData();

// Never (functions that never return)
function throwError(): never {
  throw new Error("Error!");
}`
          },
          {
            name: 'Arrays & Tuples',
            description: 'Typed collections and fixed-length arrays.',
            concepts: ['array types', 'tuples', 'readonly arrays', 'array methods'],
            code: `// Array types
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// Tuples (fixed length)
let person: [string, number] = ["Mirlind", 25];

// Readonly
const readonlyArray: readonly number[] = [1, 2, 3];`
          },
          {
            name: 'Type Inference',
            description: 'When TypeScript can figure out types automatically.',
            concepts: ['implicit types', 'type annotations', 'best practices'],
            code: `// TypeScript infers the type
let message = "Hello"; // inferred as string

// Explicit annotation (when needed)
function greet(name: string): string {
  return \`Hello, \${name}\`;
}`
          }
        ]
      },
      {
        id: 'ts-functions',
        name: 'Functions & Objects',
        icon: '⚙️',
        description: 'Typing functions and object structures.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Function Types',
            description: 'Defining function signatures.',
            concepts: ['parameter types', 'return types', 'optional parameters', 'default parameters', 'function overloads'],
            code: `// Function with types
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;

// Optional parameter
function greet(name: string, greeting?: string): string {
  return \`\${greeting || "Hello"}, \${name}\`;
}`
          },
          {
            name: 'Object Types',
            description: 'Defining the shape of objects.',
            concepts: ['type aliases', 'interfaces', 'optional properties', 'readonly properties', 'nested objects'],
            code: `// Interface
interface User {
  id: number;
  name: string;
  email?: string; // optional
  readonly createdAt: Date;
}

// Type alias
type Point = {
  x: number;
  y: number;
};

const user: User = {
  id: 1,
  name: "Mirlind",
  createdAt: new Date()
};`
          },
          {
            name: 'Union & Intersection Types',
            description: 'Combining types in flexible ways.',
            concepts: ['union types (|)', 'intersection types (&)', 'literal types', 'type guards'],
            code: `// Union type (either/or)
type Status = "pending" | "success" | "error";
type ID = string | number;

// Intersection type (both/and)
type Employee = Person & { employeeId: number };

// Type guard
function processId(id: string | number) {
  if (typeof id === "string") {
    // id is string here
  } else {
    // id is number here
  }
}`
          }
        ]
      }
    ]
  },
  {
    id: 'ts-advanced',
    name: 'Phase 2: Advanced TypeScript',
    icon: '🎯',
    description: 'Powerful type system features for complex applications.',
    modules: [
      {
        id: 'ts-generics',
        name: 'Generics',
        icon: '🔧',
        description: 'Reusable components that work with multiple types.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Generic Basics',
            description: 'Creating type-safe reusable code.',
            concepts: ['generic functions', 'generic interfaces', 'generic classes', 'type constraints'],
            code: `// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic with constraint
function lengthOf<T extends { length: number }>(arg: T): number {
  return arg.length;
}

// Generic interface
interface Container<T> {
  value: T;
  getValue(): T;
}`
          },
          {
            name: 'Utility Types',
            description: 'Built-in types for common transformations.',
            concepts: ['Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Record', 'Exclude', 'Extract'],
            code: `interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Make all properties optional
type PartialUser = Partial<User>;

// Pick specific properties
type UserPreview = Pick<User, "id" | "name">;

// Omit specific properties
type UserWithoutEmail = Omit<User, "email">;

// Record type
const users: Record<number, User> = {};`
          },
          {
            name: 'Advanced Patterns',
            description: 'Mapped types, conditional types, and more.',
            concepts: ['mapped types', 'conditional types', 'infer keyword', 'template literal types'],
            code: `// Mapped type
 type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Conditional type
type NonNullable<T> = T extends null | undefined ? never : T;

// Template literal type
type EventName<T extends string> = \`on\${Capitalize<T>}\`;`
          }
        ]
      }
    ]
  }
];

// ============================================================
// REACT ROADMAP
// ============================================================
export const REACT_ROADMAP: Phase[] = [
  {
    id: 'react-fundamentals',
    name: 'Phase 1: React Fundamentals',
    icon: '⚛️',
    description: 'Building UI with components.',
    modules: [
      {
        id: 'react-components',
        name: 'Components & JSX',
        icon: '🧩',
        description: 'The building blocks of React applications.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Functional Components',
            description: 'Modern React uses functions, not classes.',
            concepts: ['function components', 'JSX syntax', 'component composition', 'props destructuring'],
            code: `// Function component
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

// Arrow function component
const Button = ({ onClick, children }: ButtonProps) => (
  <button onClick={onClick}>{children}</button>
);`
          },
          {
            name: 'JSX Deep Dive',
            description: 'JavaScript XML - the syntax extension.',
            concepts: ['JSX expressions', 'conditional rendering', 'list rendering', 'fragments'],
            code: `// Conditional rendering
{isLoggedIn ? <Dashboard /> : <Login />}

// List rendering
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// Fragment
<>
  <Header />
  <Main />
</>`
          },
          {
            name: 'Props',
            description: 'Passing data between components.',
            concepts: ['props object', 'default props', 'children prop', 'prop drilling awareness'],
            code: `// Props with TypeScript
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ title, children, className }: CardProps) {
  return (
    <div className={className}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}`
          }
        ]
      },
      {
        id: 'react-hooks',
        name: 'React Hooks',
        icon: '🪝',
        description: 'Managing state and side effects in functional components.',
        estimatedHours: 5,
        topics: [
          {
            name: 'useState',
            description: 'Adding state to components.',
            concepts: ['state initialization', 'updating state', 'functional updates', 'state with objects/arrays'],
            code: `const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// Update state
setCount(count + 1);

// Functional update (when new state depends on old)
setCount(prev => prev + 1);

// Update object (immutability)
setUser(prev => prev ? { ...prev, name: "New" } : null);`
          },
          {
            name: 'useEffect',
            description: 'Handling side effects.',
            concepts: ['effect function', 'cleanup function', 'dependency array', 'common patterns'],
            code: `// Run on every render
useEffect(() => {
  console.log('Every render');
});

// Run once (mount)
useEffect(() => {
  fetchData();
}, []);

// Run when dependencies change
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);

// Cleanup
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);`
          },
          {
            name: 'Other Essential Hooks',
            description: 'More built-in hooks for common scenarios.',
            concepts: ['useContext', 'useRef', 'useMemo', 'useCallback', 'custom hooks'],
            code: `// useRef (DOM access & persistent values)
const inputRef = useRef<HTMLInputElement>(null);
const renderCount = useRef(0);

// useMemo (expensive computations)
const expensiveValue = useMemo(() => 
  computeExpensiveValue(a, b), [a, b]
);

// useCallback (function memoization)
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Custom hook
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  });
  // ... implementation
  return [value, setValue] as const;
}`
          }
        ]
      }
    ]
  },
  {
    id: 'react-advanced',
    name: 'Phase 2: Advanced React',
    icon: '🚀',
    description: 'Performance, patterns, and real-world architecture.',
    modules: [
      {
        id: 'react-patterns',
        name: 'React Patterns',
        icon: '🏗️',
        description: 'Common architectural patterns in React.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Component Patterns',
            description: 'Reusable component architectures.',
            concepts: ['compound components', 'render props', 'HOCs', 'controlled vs uncontrolled'],
            code: `// Compound Components
<Select>
  <Select.Option value="1">Option 1</Select.Option>
  <Select.Option value="2">Option 2</Select.Option>
</Select>

// Controlled component pattern
function Input({ value, onChange }: InputProps) {
  return <input value={value} onChange={onChange} />;
}`
          },
          {
            name: 'State Management',
            description: 'Managing application-wide state.',
            concepts: ['lifting state up', 'Context API', 'Redux basics', 'Zustand', 'state normalization'],
            code: `// Context API
const ThemeContext = createContext<Theme>("light");

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <ThemeContext.Provider value={theme}>
      <Main />
    </ThemeContext.Provider>
  );
}

// useContext hook
const theme = useContext(ThemeContext);`
          },
          {
            name: 'Performance Optimization',
            description: 'Making React apps fast.',
            concepts: ['React.memo', 'useMemo', 'useCallback', 'code splitting', 'lazy loading'],
            code: `// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);

// Lazy loading
const Dashboard = lazy(() => import('./Dashboard'));

// Suspense for loading states
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>`
          }
        ]
      }
    ]
  }
];

// ============================================================
// NODE.JS ROADMAP
// ============================================================
export const NODEJS_ROADMAP: Phase[] = [
  {
    id: 'node-basics',
    name: 'Phase 1: Node.js Fundamentals',
    icon: '🟢',
    description: 'JavaScript on the server.',
    modules: [
      {
        id: 'node-intro',
        name: 'Node.js Basics',
        icon: '📦',
        description: 'Understanding the runtime environment.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Node.js Runtime',
            description: 'How Node.js works differently than browsers.',
            concepts: ['event loop', 'non-blocking I/O', 'modules', 'global object', 'process object'],
            code: `// CommonJS modules
const fs = require('fs');

// ES modules (modern)
import fs from 'fs';

// Process info
console.log(process.argv); // command line arguments
console.log(process.env.NODE_ENV); // environment variables

// File system (async)
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});`
          },
          {
            name: 'npm & Package Management',
            description: 'Managing dependencies.',
            concepts: ['package.json', 'npm install', 'dependencies vs devDependencies', 'scripts', 'versioning'],
            code: `// package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`
          },
          {
            name: 'File System & Path',
            description: 'Working with files and directories.',
            concepts: ['fs module', 'path module', 'async vs sync', 'streams', 'buffers'],
            code: `import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Async file operations
const data = await readFile('input.txt', 'utf8');
await writeFile('output.txt', data);

// Path utilities
const fullPath = path.join(__dirname, 'data', 'file.txt');
const ext = path.extname(fullPath); // .txt`
          }
        ]
      },
      {
        id: 'node-express',
        name: 'Express.js',
        icon: '🚂',
        description: 'The most popular Node.js framework.',
        estimatedHours: 5,
        topics: [
          {
            name: 'Express Basics',
            description: 'Building web servers with Express.',
            concepts: ['app instance', 'routes', 'middleware', 'request/response', 'error handling'],
            code: `import express from 'express';
const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
  const { name } = req.body;
  // Create user...
  res.status(201).json({ id: 1, name });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`
          },
          {
            name: 'Middleware Deep Dive',
            description: 'The heart of Express.',
            concepts: ['app-level middleware', 'router-level middleware', 'error middleware', 'third-party middleware', 'custom middleware'],
            code: `// Custom middleware
const logger = (req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // Pass to next middleware
};

app.use(logger);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});`
          },
          {
            name: 'Authentication & Security',
            description: 'Protecting your API.',
            concepts: ['JWT', 'bcrypt', 'cors', 'helmet', 'rate limiting', 'input validation'],
            code: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Hash password
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Generate JWT
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
};

// Middleware to protect routes
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};`
          }
        ]
      }
    ]
  },
  {
    id: 'node-advanced',
    name: 'Phase 2: Advanced Node.js',
    icon: '⚡',
    description: 'Production-ready backend development.',
    modules: [
      {
        id: 'node-database',
        name: 'Database Integration',
        icon: '🗄️',
        description: 'Connecting to PostgreSQL and other databases.',
        estimatedHours: 4,
        topics: [
          {
            name: 'PostgreSQL with pg',
            description: 'Working with PostgreSQL from Node.js.',
            concepts: ['pg library', 'connection pooling', 'parameterized queries', 'transactions'],
            code: `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Query with parameters (SQL injection safe)
const getUser = async (id: number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

// Transaction
const transferMoney = async (from: number, to: number, amount: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, from]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, to]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};`
          },
          {
            name: 'ORMs (Prisma)',
            description: 'Object-Relational Mapping for type-safe database access.',
            concepts: ['Prisma setup', 'schema definition', 'CRUD operations', 'relations', 'migrations'],
            code: `// schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

// Using Prisma Client
const user = await prisma.user.create({
  data: {
    email: 'mirlind@example.com',
    name: 'Mirlind',
  },
});

const usersWithPosts = await prisma.user.findMany({
  include: { posts: true },
});`
          }
        ]
      }
    ]
  }
];

// ============================================================
// POSTGRESQL ROADMAP
// ============================================================
export const POSTGRESQL_ROADMAP: Phase[] = [
  {
    id: 'postgres-basics',
    name: 'Phase 1: SQL Fundamentals',
    icon: '🐘',
    description: 'The world\'s most advanced open source relational database.',
    modules: [
      {
        id: 'sql-basics',
        name: 'SQL Basics',
        icon: '📝',
        description: 'Structured Query Language fundamentals.',
        estimatedHours: 4,
        topics: [
          {
            name: 'CRUD Operations',
            description: 'Create, Read, Update, Delete.',
            concepts: ['INSERT', 'SELECT', 'UPDATE', 'DELETE', 'WHERE clause'],
            code: `-- Create
INSERT INTO users (name, email) 
VALUES ('Mirlind', 'mirlind@example.com');

-- Read
SELECT * FROM users WHERE age > 18;
SELECT name, email FROM users ORDER BY name ASC;

-- Update
UPDATE users 
SET name = 'Mirlind Updated' 
WHERE id = 1;

-- Delete
DELETE FROM users WHERE id = 1;`
          },
          {
            name: 'Data Types & Constraints',
            description: 'Defining table structure.',
            concepts: ['INTEGER', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TIMESTAMP', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'UNIQUE'],
            code: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER CHECK (age >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);`
          },
          {
            name: 'Joins & Relationships',
            description: 'Connecting data across tables.',
            concepts: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'self join'],
            code: `-- Inner join (only matching records)
SELECT users.name, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;

-- Left join (all users, even without posts)
SELECT users.name, posts.title
FROM users
LEFT JOIN posts ON users.id = posts.user_id;

-- Multiple joins
SELECT u.name, p.title, c.content
FROM users u
JOIN posts p ON u.id = p.user_id
JOIN comments c ON p.id = c.post_id;`
          }
        ]
      },
      {
        id: 'sql-advanced',
        name: 'Advanced SQL',
        icon: '🔍',
        description: 'Powerful querying techniques.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Aggregation & Grouping',
            description: 'Summarizing data.',
            concepts: ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP BY', 'HAVING'],
            code: `-- Count users
SELECT COUNT(*) FROM users;

-- Group by status
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status;

-- With having (filter groups)
SELECT user_id, COUNT(*) as post_count
FROM posts
GROUP BY user_id
HAVING COUNT(*) > 5;`
          },
          {
            name: 'Indexes & Performance',
            description: 'Making queries faster.',
            concepts: ['CREATE INDEX', 'B-tree indexes', 'composite indexes', 'EXPLAIN ANALYZE', 'query optimization'],
            code: `-- Create index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_posts_user_created 
ON posts(user_id, created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';`
          },
          {
            name: 'Transactions',
            description: 'ACID compliance and data integrity.',
            concepts: ['BEGIN', 'COMMIT', 'ROLLBACK', 'ACID properties', 'isolation levels', 'deadlocks'],
            code: `-- Transaction
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If both succeed
COMMIT;

-- If something fails
-- ROLLBACK;`
          }
        ]
      }
    ]
  }
];

// ============================================================
// GIT ROADMAP
// ============================================================
export const GIT_ROADMAP: Phase[] = [
  {
    id: 'git-basics',
    name: 'Phase 1: Git Fundamentals',
    icon: '🌿',
    description: 'Version control for your code.',
    modules: [
      {
        id: 'git-core',
        name: 'Git Core Concepts',
        icon: '📦',
        description: 'Understanding how Git works.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Git Basics',
            description: 'The essential commands every developer needs.',
            concepts: ['init', 'clone', 'add', 'commit', 'status', 'log', 'diff'],
            code: `# Initialize repository
git init

# Clone existing repository
git clone https://github.com/user/repo.git

# Check status
git status

# Stage changes
git add filename.txt      # specific file
git add .                 # all changes

# Commit changes
git commit -m "Add new feature"

# View history
git log --oneline
git log --graph --decorate`
          },
          {
            name: 'Branching & Merging',
            description: 'Parallel development made easy.',
            concepts: ['branch', 'checkout', 'switch', 'merge', 'merge conflicts', 'fast-forward'],
            code: `# Create and switch to new branch
git checkout -b feature-branch
# or
git switch -c feature-branch

# List branches
git branch

# Switch branches
git switch main

# Merge branch into current
git merge feature-branch

# Delete branch
git branch -d feature-branch  # merged
git branch -D feature-branch  # force delete`
          },
          {
            name: 'Remote Repositories',
            description: 'Collaborating with others.',
            concepts: ['remote', 'push', 'pull', 'fetch', 'origin', 'upstream'],
            code: `# View remotes
git remote -v

# Add remote
git remote add origin https://github.com/user/repo.git

# Push to remote
git push origin main
git push -u origin feature-branch  # set upstream

# Pull changes
git pull origin main

# Fetch without merging
git fetch origin`
          }
        ]
      },
      {
        id: 'git-advanced',
        name: 'Advanced Git',
        icon: '⚡',
        description: 'Power user techniques.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Rewriting History',
            description: 'Fixing mistakes and cleaning commits.',
            concepts: ['amend', 'rebase', 'interactive rebase', 'cherry-pick', 'reset', 'revert'],
            code: `# Amend last commit
git commit --amend -m "New message"

# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Squash commits
git reset --soft HEAD~3
git commit -m "Combine 3 commits"

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Revert commit (create new commit)
git revert commit_hash`
          },
          {
            name: 'Stashing & Cleanup',
            description: 'Managing work in progress.',
            concepts: ['stash', 'stash pop', 'stash list', 'clean', 'reflog'],
            code: `# Stash changes
git stash
git stash push -m "WIP: feature"

# List stashes
git stash list

# Apply stash
git stash pop    # apply and remove
git stash apply  # apply but keep

# Recover lost commits
git reflog`
          }
        ]
      }
    ]
  }
];

// ============================================================
// DOCKER ROADMAP
// ============================================================
export const DOCKER_ROADMAP: Phase[] = [
  {
    id: 'docker-basics',
    name: 'Phase 1: Containerization',
    icon: '🐳',
    description: 'Package once, run anywhere.',
    modules: [
      {
        id: 'docker-core',
        name: 'Docker Fundamentals',
        icon: '📦',
        description: 'Understanding containers.',
        estimatedHours: 3,
        topics: [
          {
            name: 'Docker Basics',
            description: 'Core concepts and commands.',
            concepts: ['images', 'containers', 'Dockerfile', 'docker run', 'docker build', 'docker ps'],
            code: `# Build image
docker build -t myapp:1.0 .

# Run container
docker run -p 3000:3000 myapp:1.0

# Run in background
docker run -d -p 3000:3000 --name myapp myapp:1.0

# List containers
docker ps
docker ps -a  # including stopped

# Stop/Start
docker stop myapp
docker start myapp`
          },
          {
            name: 'Dockerfile',
            description: 'Building container images.',
            concepts: ['FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'CMD', 'multi-stage builds'],
            code: `# Multi-stage build (optimized)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]`
          },
          {
            name: 'Docker Compose',
            description: 'Managing multi-container applications.',
            concepts: ['docker-compose.yml', 'services', 'volumes', 'networks', 'environment variables'],
            code: `# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/mydb
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`
          }
        ]
      }
    ]
  }
];

// ============================================================
// SYSTEM DESIGN ROADMAP
// ============================================================
export const SYSTEM_DESIGN_ROADMAP: Phase[] = [
  {
    id: 'system-basics',
    name: 'Phase 1: System Design Fundamentals',
    icon: '🏗️',
    description: 'Building scalable systems.',
    modules: [
      {
        id: 'scalability',
        name: 'Scalability Concepts',
        icon: '📈',
        description: 'Making systems handle growth.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Horizontal vs Vertical Scaling',
            description: 'Different approaches to scaling.',
            concepts: ['vertical scaling', 'horizontal scaling', 'load balancing', 'auto-scaling'],
            code: `// Load balancer configuration (conceptual)
upstream backend {
  server backend1.example.com;
  server backend2.example.com;
  server backend3.example.com;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
  }
}`
          },
          {
            name: 'Caching Strategies',
            description: 'Improving performance with caching.',
            concepts: ['CDN', 'Redis', 'cache invalidation', 'cache aside', 'write-through', 'TTL'],
            code: `// Redis caching example (Node.js)
import Redis from 'ioredis';
const redis = new Redis();

const getUser = async (id: string) => {
  // Check cache first
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const user = await db.users.findById(id);
  
  // Store in cache (TTL: 1 hour)
  await redis.setex(\`user:\${id}\`, 3600, JSON.stringify(user));
  
  return user;
};`
          },
          {
            name: 'Database Scaling',
            description: 'Handling database growth.',
            concepts: ['database replication', 'read replicas', 'sharding', 'CAP theorem', 'eventual consistency'],
            code: `-- Read replica setup (PostgreSQL)
-- Primary database configuration
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB

-- Application: separate read/write
const writeToPrimary = (data) => primaryDb.query(...);
const readFromReplica = (query) => replicaDb.query(...);`
          }
        ]
      },
      {
        id: 'microservices',
        name: 'Microservices Architecture',
        icon: '🧩',
        description: 'Breaking down monoliths.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Microservices Patterns',
            description: 'Designing distributed systems.',
            concepts: ['service boundaries', 'API gateway', 'service discovery', 'circuit breaker', 'event-driven'],
            code: `// API Gateway pattern
// Routes requests to appropriate services

// Auth Service: /auth/**
// User Service: /users/**
// Order Service: /orders/**

// Event-driven communication
// Order Service publishes: order.created
// Email Service subscribes and sends confirmation`
          },
          {
            name: 'Message Queues',
            description: 'Asynchronous communication.',
            concepts: ['RabbitMQ', 'Kafka', 'SQS', 'pub/sub', 'message durability'],
            code: `// Producer
const sendEmail = async (data) => {
  await channel.sendToQueue('email_queue', 
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
};

// Consumer
channel.consume('email_queue', async (msg) => {
  const data = JSON.parse(msg.content.toString());
  await sendEmailService(data);
  channel.ack(msg);
});`
          }
        ]
      }
    ]
  }
];

// ============================================================
// RUST ROADMAP
// ============================================================
export const RUST_ROADMAP: Phase[] = [
  {
    id: 'rust-basics',
    name: 'Phase 1: Rust Fundamentals',
    icon: '🦀',
    description: 'Systems programming with safety guarantees.',
    modules: [
      {
        id: 'rust-core',
        name: 'Rust Core Concepts',
        icon: '⚙️',
        description: 'Ownership, borrowing, and lifetimes.',
        estimatedHours: 5,
        topics: [
          {
            name: 'Ownership',
            description: 'Rust\'s unique memory management.',
            concepts: ['ownership rules', 'move semantics', 'copy trait', 'drop trait'],
            code: `fn main() {
  let s1 = String::from("hello");
  let s2 = s1; // s1 is MOVED to s2
  
  // println!("{}", s1); // ERROR! s1 no longer valid
  println!("{}", s2); // OK
  
  // For primitive types (Copy trait)
  let x = 5;
  let y = x; // COPY, not move
  println!("{} {}", x, y); // Both OK
}`
          },
          {
            name: 'Borrowing & References',
            description: 'Accessing data without taking ownership.',
            concepts: ['references', 'mutable references', 'dangling references', 'reference rules'],
            code: `fn main() {
  let s = String::from("hello");
  
  // Immutable borrow
  let len = calculate_length(&s);
  println!("'{}' length: {}", s, len); // s still valid
  
  // Mutable borrow
  let mut s = String::from("hello");
  change(&mut s);
}

fn calculate_length(s: &String) -> usize {
  s.len()
}

fn change(s: &mut String) {
  s.push_str(", world");
}`
          },
          {
            name: 'Structs & Enums',
            description: 'Custom data types.',
            concepts: ['structs', 'tuple structs', 'unit structs', 'enums', 'Option', 'Result', 'match'],
            code: `struct User {
  username: String,
  email: String,
  sign_in_count: u64,
  active: bool,
}

enum Message {
  Quit,
  Move { x: i32, y: i32 },
  Write(String),
  ChangeColor(i32, i32, i32),
}

// Option<T> for nullable values
let some_number = Some(5);
let absent_number: Option<i32> = None;

// Result<T, E> for error handling
let result: Result<i32, &str> = Ok(42);`
          }
        ]
      }
    ]
  }
];

// ============================================================
// PYTHON ROADMAP
// ============================================================
export const PYTHON_ROADMAP: Phase[] = [
  {
    id: 'python-basics',
    name: 'Phase 1: Python Fundamentals',
    icon: '🐍',
    description: 'Versatile language for scripting and data.',
    modules: [
      {
        id: 'python-core',
        name: 'Python Basics',
        icon: '📦',
        description: 'Python syntax and core features.',
        estimatedHours: 4,
        topics: [
          {
            name: 'Python Syntax',
            description: 'Clean, readable code.',
            concepts: ['variables', 'data types', 'indentation', 'dynamic typing', 'type hints'],
            code: `# Variables (no declaration needed)
name = "Mirlind"
age = 25
is_active = True

# Type hints (Python 3.5+)
def greet(name: str) -> str:
    return f"Hello, {name}"

# Lists
tasks = ["Learn Python", "Build App", "Get Job"]
tasks.append("Celebrate")

# Dictionaries
user = {
    "name": "Mirlind",
    "age": 25,
    "skills": ["Python", "JavaScript"]
}`
          },
          {
            name: 'Control Flow',
            description: 'Conditionals and loops.',
            concepts: ['if/elif/else', 'for loops', 'while loops', 'list comprehensions', 'generators'],
            code: `# If statement
if age < 13:
    print("Child")
elif age < 20:
    print("Teenager")
else:
    print("Adult")

# List comprehension
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# For loop
for task in tasks:
    print(f"Doing: {task}")

# Generator (memory efficient)
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b`
          },
          {
            name: 'Functions & Classes',
            description: 'Organizing Python code.',
            concepts: ['def', 'lambda', 'classes', 'inheritance', 'dunder methods', 'decorators'],
            code: `# Function
def calculate_area(length: float, width: float) -> float:
    return length * width

# Lambda
square = lambda x: x ** 2

# Class
class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age
    
    def greet(self) -> str:
        return f"Hi, I'm {self.name}"

# Inheritance
class Employee(Person):
    def __init__(self, name: str, age: int, salary: float):
        super().__init__(name, age)
        self.salary = salary`
          }
        ]
      }
    ]
  }
];

// ============================================================
// ALL SKILLS COMBINED
// ============================================================
export const ALL_SKILLS: SkillRoadmap[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: '💛',
    color: '#f7df1e',
    description: 'The language of the web. Essential for frontend and backend development.',
    phases: JAVASCRIPT_ROADMAP
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🔷',
    color: '#3178c6',
    description: 'Typed JavaScript. Catches errors at compile time, not runtime.',
    phases: TYPESCRIPT_ROADMAP
  },
  {
    id: 'react',
    name: 'React',
    icon: '⚛️',
    color: '#61dafb',
    description: 'The most popular frontend library. Component-based UI development.',
    phases: REACT_ROADMAP
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    icon: '🟢',
    color: '#339933',
    description: 'JavaScript on the server. Build scalable backend applications.',
    phases: NODEJS_ROADMAP
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: '🐘',
    color: '#336791',
    description: 'Advanced open-source relational database. ACID compliant and reliable.',
    phases: POSTGRESQL_ROADMAP
  },
  {
    id: 'git',
    name: 'Git',
    icon: '🌿',
    color: '#f05032',
    description: 'Version control. Track changes and collaborate with other developers.',
    phases: GIT_ROADMAP
  },
  {
    id: 'docker',
    name: 'Docker',
    icon: '🐳',
    color: '#2496ed',
    description: 'Containerization. Package applications with all dependencies.',
    phases: DOCKER_ROADMAP
  },
  {
    id: 'system-design',
    name: 'System Design',
    icon: '🏗️',
    color: '#00d4aa',
    description: 'Design scalable, reliable systems. Essential for senior roles.',
    phases: SYSTEM_DESIGN_ROADMAP
  },
  {
    id: 'rust',
    name: 'Rust',
    icon: '🦀',
    color: '#dea584',
    description: 'Systems programming with memory safety. Blazing fast performance.',
    phases: RUST_ROADMAP
  },
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    color: '#3776ab',
    description: 'Versatile language for scripting, data science, and automation.',
    phases: PYTHON_ROADMAP
  }
];

// ============================================================
// PROGRESS TRACKING
// ============================================================

const STORAGE_KEY = 'mirlind-roadmap-progress';

export interface RoadmapProgress {
  completedModules: string[];
  completedTopics: string[];
  hoursSpent: Record<string, number>; // moduleId -> hours
  notes: Record<string, string>; // moduleId -> notes
}

export function getRoadmapProgress(): RoadmapProgress {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    completedModules: [],
    completedTopics: [],
    hoursSpent: {},
    notes: {}
  };
}

export function completeModule(moduleId: string): void {
  const progress = getRoadmapProgress();
  if (!progress.completedModules.includes(moduleId)) {
    progress.completedModules.push(moduleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export function uncompleteModule(moduleId: string): void {
  const progress = getRoadmapProgress();
  progress.completedModules = progress.completedModules.filter(id => id !== moduleId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function completeTopic(topicName: string): void {
  const progress = getRoadmapProgress();
  if (!progress.completedTopics.includes(topicName)) {
    progress.completedTopics.push(topicName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export function setModuleHours(moduleId: string, hours: number): void {
  const progress = getRoadmapProgress();
  progress.hoursSpent[moduleId] = hours;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function setModuleNotes(moduleId: string, notes: string): void {
  const progress = getRoadmapProgress();
  progress.notes[moduleId] = notes;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Calculate total progress across all skills
export function calculateTotalProgress(): { 
  totalModules: number; 
  completedModules: number; 
  percentage: number;
  totalHours: number;
} {
  const progress = getRoadmapProgress();
  let totalModules = 0;
  
  ALL_SKILLS.forEach(skill => {
    skill.phases.forEach(phase => {
      totalModules += phase.modules.length;
    });
  });
  
  const completedModules = progress.completedModules.length;
  const percentage = Math.round((completedModules / totalModules) * 100);
  
  const totalHours = Object.values(progress.hoursSpent).reduce((sum, hours) => sum + hours, 0);
  
  return {
    totalModules,
    completedModules,
    percentage,
    totalHours
  };
}

// Get progress for a specific skill
export function getSkillProgress(skillId: string): {
  totalModules: number;
  completedModules: number;
  percentage: number;
} {
  const progress = getRoadmapProgress();
  const skill = ALL_SKILLS.find(s => s.id === skillId);
  
  if (!skill) return { totalModules: 0, completedModules: 0, percentage: 0 };
  
  let totalModules = 0;
  const skillModuleIds: string[] = [];
  
  skill.phases.forEach(phase => {
    phase.modules.forEach(module => {
      totalModules++;
      skillModuleIds.push(module.id);
    });
  });
  
  const completedModules = progress.completedModules.filter(id => 
    skillModuleIds.includes(id)
  ).length;
  
  return {
    totalModules,
    completedModules,
    percentage: Math.round((completedModules / totalModules) * 100)
  };
}
