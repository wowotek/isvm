function DEBUG_INST(...args) {
    if (false)
        console.log(...args);
}

class EventDriver {
    event_handlers = [];
    constructor(default_handlers=[]) {
        this.event_handlers = default_handlers;
    }
    
    addHandler(handler) {
        this.event_handlers.push(handler);
    }

    fireEvent(event) {
        for (let handler of this.event_handlers) {
            handler(event);
        }
    }
};

function limitToUnsigned16Bit(value) {
    // return ((value % 65536) + 65536) % 65536;
    return value
}

function limitToSigned16Bit(value) {
    // const unsigned = ((value % 65536) + 65536) % 65536;
    // return unsigned > 32767 ? unsigned - 65536 : unsigned;
    return value
}

class Register extends EventDriver {
    differentiator = "REGISTER";
    name = null;
    #value = 0;
    constructor(name, value=0, default_handlers=[]) {
        super(default_handlers);
        this.name = name;
        this.#value = limitToSigned16Bit(value);
    }

    set value(new_value) {
        this.#value = limitToSigned16Bit(new_value);
        this.fireEvent(new_value);
    }

    get value() {
        return this.#value;
    }
};

class RegisterDSP extends Register {
    differentiator = "REGISTER";
    #sequence = [];
    #display_handler = (c) => {
        console.log("DISPLAY:", c)
    };
    constructor(name, value = 0, default_handlers = []) {
        super(name, value, default_handlers);
    }

    set displayHandler(handler) {
        this.#display_handler = handler;
    }

    #parseSequence() {
        let coordinate = this.#sequence[0];
        let r = this.#sequence[1];
        let g = this.#sequence[2];
        let b = this.#sequence[3];

        // Normalize r, g, b to the range of 0 to 255
        r = Math.min(255, Math.max(0, limitToUnsigned16Bit(r) % 256));
        g = Math.min(255, Math.max(0, limitToUnsigned16Bit(g) % 256));
        b = Math.min(255, Math.max(0, limitToUnsigned16Bit(b) % 256));

        this.#display_handler({ coordinate, r, g, b });
    }

    set value(new_value) {
        super.value = new_value;
        this.#sequence.push(new_value);

        if (this.#sequence.length >= 4) {
            this.#parseSequence();
            this.#sequence = [];
        }
    }

    get value() {
        return super.value;
    }
}

class Literal {
    differentiator = "LITERAL";
    #value = null;
    constructor(value) {
        this.#value = limitToSigned16Bit(value);
    }

    set value(new_value) {
        // loop with maximum of 16 bit
        new_value = limitToSigned16Bit(new_value);
        this.#value = new_value;
    }

    get value() {
        // limit to 16 bit
        return this.#value;
    }
};

class Label {
    differentiator = "LABEL";
    value = null;
    name = ""
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
};

class Stack{
    stack = [];
    push_event_driver = new EventDriver();
    pop_event_driver = new EventDriver();

    constructor(default_stack = []){
        this.stack = default_stack;
    }

    push(value){
        this.stack.push(value);
        this.push_event_driver.fireEvent(value);
    }

    pop(){
        const value = this.stack.pop();
        this.pop_event_driver.fireEvent(value);
        return value;
    }

    all() {
        return this.stack.map(x => x);
    }

    get length() {
        return this.stack.length;
    }
};

const REGISTERS = {
    ACC: new Register("ACC", 0),     // Accumulator           ACCESS  /READ   /WRITE
    BAK: new Register("BAK", 0),     // Backup          INACCESSIBLE  /NO     /NO
    GPR: new Register("GPR", 0),     // General Purpose       ACCESS  /READ   /WRITE
    DSP: new RegisterDSP("DSP", 0),  // Display               ACCESS  /READ   /WRITE
    STC: new Register("STC", 0),     // Stack Counter         ACCESS  /READ   /WRITE
    PRC: new Register("PRC", 0),     // Program Counter       ACCESS  /READ   /WRITE
};
const STACK = new Stack();
let PROGRAM = [];
let AFTER_EXEC_EVENT_HANDLER = () => {};
let STATE = "STOPPED";
let intervalRunnerId = null;


// =============================================
// ======= INSTRUCTIONS ========================
// =============================================
function NOP() {
    console.log(`NOP()`)
}
function MOV(src, dst) {
    if(dst.differentiator !== "REGISTER") {
        throw new Error(`MOV: Invalid destination type | HALTING...`);
    }
    
    if(dst.name === "BAK") {
        throw new Error(`MOV: BAK register is inaccessible | HALTING...`);
    }
    
    if (src.differentiator === "REGISTER") {
        DEBUG_INST(`MOV(${src.name}|${src.value}, ${src.name}|${dst.value})`)
        if (src.name === "BAK") {
            throw new Error(`MOV: BAK register is inaccessible | HALTING...`);
        }

        const srcValue = src.value;
        dst.value = srcValue;
    } else if (src.differentiator === "LITERAL") {
        DEBUG_INST(`MOV(${src.value}, ${dst.name}|${dst.value})`)
        const srcValue = src.value;
        dst.value = srcValue;
    } else {
        throw new Error(`MOV: Invalid source type | HALTING...`);
    }
}
function PUSH(src) {
    DEBUG_INST(`PUSH(${src.value})`);

    if (src.differentiator === "REGISTER") {
        STACK.push(src.value);
    }
    else if (src.differentiator === "LITERAL") {
        STACK.push(src.value);
    }
    else {
        throw new Error(`PUSH: Invalid source type | HALTING...`);
    }
}
function POP() {
    DEBUG_INST(`POP()`)
    const value = STACK.pop();
    if(value === undefined) {
        throw new Error(`POP: Stack is empty | HALTING...`);
    }

    REGISTERS.ACC.value = value;
}
function SWP() {
    DEBUG_INST(`SWP()`);
    const tempSrc = REGISTERS.ACC.value;
    const tempDst = REGISTERS.BAK.value;

    REGISTERS.ACC.value = tempDst;
    REGISTERS.BAK.value = tempSrc;
}
function SAV() {
    DEBUG_INST(`SAV()`);
    REGISTERS.BAK.value = REGISTERS.ACC.value;
}
function ADD(src) {
    DEBUG_INST(`ADD(${src.value})`);
    if (src.differentiator === "LABEL") {
        throw new Error(`ADD: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value + src.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function SUB(src) {
    DEBUG_INST(`SUB(${src.value})`);
    if (src.differentiator === "LABEL") {
        throw new Error(`SUB: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value - src.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function NEG() {
    DEBUG_INST(`NEG()`);
    REGISTERS.ACC.value = limitToSigned16Bit(-REGISTERS.ACC.value);
}
function NOT() {
    DEBUG_INST(`NEG()`);
    REGISTERS.ACC.value = limitToSigned16Bit(~REGISTERS.ACC.value);
}
function AND(SRC) {
    DEBUG_INST(`AND(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`AND: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value & SRC.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function OR(SRC) {
    DEBUG_INST(`OR(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`OR: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value | SRC.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function XOR(SRC) {
    DEBUG_INST(`XOR(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`XOR: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value ^ SRC.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function NAND(SRC) {
    DEBUG_INST(`NAND(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`NAND: Invalid source type | HALTING...`);
    }

    const result = ~(REGISTERS.ACC.value & SRC.value);
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function NOR(SRC) {
    DEBUG_INST(`NOR(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`NOR: Invalid source type | HALTING...`);
    }

    const result = ~(REGISTERS.ACC.value | SRC.value);
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function XNOR(SRC) {
    DEBUG_INST(`XNOR(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`XNOR: Invalid source type | HALTING...`);
    }

    const result = ~(REGISTERS.ACC.value ^ SRC.value);
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function SHR(SRC) {
    DEBUG_INST(`SHR(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`SHR: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value >> SRC.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function SHL(SRC) {
    DEBUG_INST(`SHL(${SRC.value})`);
    if (SRC.differentiator === "LABEL") {
        throw new Error(`SHL: Invalid source type | HALTING...`);
    }

    const result = REGISTERS.ACC.value << SRC.value;
    REGISTERS.ACC.value = limitToSigned16Bit(result);
}
function JMP(label) {
    DEBUG_INST(`JMP(${label.name}|${label.value})`);
    // find the lineNumber
    REGISTERS.PRC.value = label.value;
}
function JEZ(label) {
    DEBUG_INST(`JEZ(${label.value})`);
    if (REGISTERS.ACC.value === 0) {
        REGISTERS.PRC.value = label.value;
    }
}
function JNZ(label) {
    DEBUG_INST(`JNZ(${label.value})`);
    if (REGISTERS.ACC.value !== 0) {
        REGISTERS.PRC.value = label.value;
    }
}
function JGZ(label) {
    DEBUG_INST(`JGZ(${label.value})`);
    if (REGISTERS.ACC.value > 0) {
        REGISTERS.PRC.value = label.value;
    }
}
function JLZ(label) {
    DEBUG_INST(`JLZ(${label.value})`);
    if (REGISTERS.ACC.value < 0) {
        REGISTERS.PRC.value = label.value;
    }
}
function JRO(offset) {
    DEBUG_INST(`JRO(${offset.value})`);
    // limit to program length
    // if its negative, go back
    // if its positive, go forward
    // if its too much, roll to the first program
    REGISTERS.PRC.value = (REGISTERS.PRC.value + offset.value) % PROGRAM.length;
}
function HALT() {
    DEBUG_INST(`HALT()`);
    VM_stop();
}

function __LABEL__() {

}


// =============================================
// ======= Cycle ===============================
// =============================================
function __prepare(machineCode) {
    // Reset registers
    REGISTERS.ACC.value = 0;
    REGISTERS.BAK.value = 0;
    REGISTERS.GPR.value = 0;
    REGISTERS.STC.value = 0;
    REGISTERS.PRC.value = 0;
    STACK.stack = [];

    // Load Program
    PROGRAM = machineCode;
}

function _exec_execute() {
    while (REGISTERS.PRC.value < PROGRAM.length) {
        let program = PROGRAM[REGISTERS.PRC.value];
        if (program && program.instruction) {
            program.instruction(...program.args);
            REGISTERS.PRC.value++;
            return;
        }
        REGISTERS.PRC.value++;
    }
    throw new Error("No valid instruction found in the program.");
}

function VM_stop() {
    console.log("Stopping VM");
    if(STATE === "STOPPED") {
        console.error("VM is already stopped");
        return;
    }
    
    STATE = "STOPPED";
    clearInterval(intervalRunnerId);
    console.log("VM Stopped");
}

function VM_continue() {
    if(STATE === "RUNNING") {
        console.error("VM is already running");
        return;
    }

    STATE = "RUNNING";
    intervalRunnerId = setInterval(() => {
        if(REGISTERS.PRC.value >= PROGRAM.length) {
            return VM_stop();
        }
        
        try {
            _exec_execute();
            AFTER_EXEC_EVENT_HANDLER();
        } catch (e) {
            VM_stop();
            console.error(e);
            console.error("HALTING...")
        }
    }, 1);

//     while(true) {
//         if(REGISTERS.PRC.value >= PROGRAM.length) {
//             return stop();
//         }
//         try {
//             _exec_execute();
//         } catch (e) {
//             console.error(e);
//             console.error("HALTING...")
//             VM_stop();
//         }
//     }
// }
}

function VM_start(machineCode) {
    console.log("Starting VM");
    __prepare(machineCode);
    VM_continue();
}

function VM_reset() {
    console.log("Resetting VM");
    VM_stop();
    __prepare([]);
}



// =============================================
// ======= COMPILER ============================
// =============================================
const INSTRUCTION_NAMES = [
    "NOP",
    "MOV",
    "PUSH",
    "POP",
    "SWP",
    "SAV",
    "ADD",
    "SUB",
    "NEG",
    "JMP",
    "JEZ",
    "JNZ",
    "JGZ",
    "JLZ",
    "JRO",
    "HALT",
];

const INSTRUCTIONS = {
    "NOP": NOP,
    "MOV": MOV,
    "PUSH": PUSH,
    "POP": POP,
    "SWP": SWP,
    "SAV": SAV,
    "ADD": ADD,
    "SUB": SUB,
    "NEG": NEG,
    "JMP": JMP,
    "JEZ": JEZ,
    "JNZ": JNZ,
    "JGZ": JGZ,
    "JLZ": JLZ,
    "JRO": JRO,
    "HALT": HALT,
    "__LABEL__": __LABEL__
};

const REGISTER_NAMES = [
    "ACC",
    "BAK",
    "GPR",
    "DSP",
    "STC",
    "PRC",
]
function assembleSource(text) {
    const tokenized = __tokenize(text);
    const {commands, labels} = __parse(tokenized);
    const machineCode = __parseArgs(commands, labels);
    return machineCode;
}

function __tokenize(text) {
    const t = text
        .split('\n') // Split into lines
        .map((line, index) => ({
            lineNumber: index,
            tokens: line.split('#')[0].trim().split(/\s+/).map(token => token.toUpperCase())
        }));
    return t;
}

function __parse(tokens) {
    const commands = [];
    const labels = {};

    tokens.forEach(({ lineNumber, tokens }) => {
        if (tokens.length <= 0) {
            commands.push({ lineNumber, instruction: null, args: [] });
            return;
        };
        if (tokens[0].endsWith(':')) {
            // Store label position
            labels[tokens[0].slice(0, -1)] = lineNumber;
            commands.push({ lineNumber, instruction: INSTRUCTIONS["__LABEL__"], args: [] });
            return;
        }
        
        const instruction = INSTRUCTIONS[tokens[0]] || null;
        const args = tokens.slice(1);
        commands.push({ lineNumber, instruction, args });
    });

    return { commands, labels };
}

function __parseArgs(commands, labels) {
    return commands.map(command => {
        const parsedArgs = command.args.map(arg => {
            if (/^0x[0-9A-F]+$/i.test(arg)) {
                return new Literal(parseInt(arg, 16)); // Convert hex to decimal
            } else if (/^-?\d+$/.test(arg)) {
                return new Literal(parseInt(arg, 10)); // Convert decimal number
            } else if(labels.hasOwnProperty(arg)) {
                return new Label(arg, labels[arg]);
            } if(REGISTER_NAMES.includes(arg)) {
                if(arg === "BAK") {
                    throw new Error(`COMPILATION ERROR:\n   Invalid token: ${arg} in line: ${command.lineNumber}\n   BAK register is inaccessible`);
                }
                return REGISTERS[arg]; // Keep as string (register or label)
            } else {
                throw new Error(`COMPILATION ERROR:\n   Invalid token: ${arg} in line: ${command.lineNumber}`);
            }
        });
        
        return {
            lineNumber: command.lineNumber,
            instruction: command.instruction,
            args: parsedArgs
        };
    });
}