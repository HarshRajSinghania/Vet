// Registry of test runners. To support a new language's tests, write a file
// like the others here and add it to the list below.
import javascript from './javascript.js';
import python from './python.js';
import go from './go.js';
import rust from './rust.js';

export const testRunners = [javascript, python, go, rust];
