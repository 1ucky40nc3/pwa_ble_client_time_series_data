import { expect } from "jsr:@std/expect";
import {add} from "../src/utils.js";

Deno.test("execute a basic test", () => {
    expect(add(1, 1)).toBe(2);
})