// setup file
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;

configure({ adapter: new Adapter() });
require("jest-fetch-mock").enableMocks();

global.console = {
    log: jest.fn(), // console.log are ignored in tests
    //log: console.log,

    // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
    error: console.error,
    warn: console.warn,
    info: jest.fn(),
    debug: jest.fn(),
};
