class EventDriver {
    event_handlers = [];
    constructor(default_handlers=[]) {
        this.event_handlers = default_handlers;
    }
    
    add_handler(handler) {
        this.event_handlers.push(handler);
    }

    fire_event(event) {
        for (let handler of this.event_handlers) {
            handler(event);
        }
    }
}

class Register extends EventDriver {
    value = 0;
    constructor(value=0) {
        this.value = value;
    }
}

class Stack{
    stack = [];
    push_event_driver = EventDriver();
    pop_event_driver = EventDriver();

    constructor(default_stack = []){
        this.stack = default_stack;
    }

    push(value){
        this.stack.push(value);
        this.push_event_driver.fire_event(value);
    }

    pop(){
        const value = this.stack.pop();
        this.pop_event_driver.fire_event(value);
        return value;
    }

    all() {
        return this.stack.map(x => x);
    }
}   


const REGISTERS = {
    ACC: Register(),     // Accumulator          ACCESS  /READ   /WRITE
    BAK: Register(),     // Backup          INACCESSIBLE /NO     /NO
    GPR: Register(),     // Accumulator          ACCESS  /READ   /WRITE
    STC: Register(),     // Accumulator          ACCESS  /READ   /WRITE
    PRC: Register(),     // Accumulator          ACCESS  /READ   /WRITE
}
const STACK = new Stack();

