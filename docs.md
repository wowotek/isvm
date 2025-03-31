# Intelligence System Virtual Machine

This is a playground of assembly language Inspired by TIS-100 minimalistic Architecture

## 0. Table Of Contents
> TODO: write table of content

## 1. Registers
### 1.0. ACC | Accumulator
The main registers for all operations

#### Examples
```asm
MOV     ACC     GPR     # Copy Values from ACC to GPR
PUSH    ACC             # Copy Values from ACC and Push it to stack memory
POP                     # Take value from stack memory and put it to ACC
SWP                     # Swap the value of ACC <> BAK
```

### 1.1. BAK | Backup
Usually for storing temporary values

> **Warning:** Directly Inaccessible, can only be accessed via **`SWP`** instruction
#### Examples
```asm
SWP     # Swap the value of ACC <> BAK, store the value of ACC to BAK, while
        # simultaneously send the initial value of BAK to ACC

SAV     # Copy the value from ACC to BAK
```

### 1.2. GPR | General Purpose Register
Self-described, can be accessed like `ACC` but will not change except wanted to

#### Examples
```asm
MOV     ACC     GPR     # Copy Values from ACC to GPR
MOV     GPR     ACC     # Copy Values from GPR to ACC
PUSH    GPR             # Copy Values from GPR and Push it to stack memory
```

### 1.3. DSP | Display Interface
Interface to interact with display device, can be manipulated like `ACC`

#### Examples
```asm
# Assume this is the first time we are manipulating DSP register
MOV     0x00ff      DSP     # 1st Value: coordinate 255 from the top left of the display
MOV     0x00ff      DSP     # 2nd Value: Red value
MOV     0x00ff      DSP     # 3nd Value: Green value
MOV     0x0000      DSP     # 4th Value: Blue value

# this 4 sequence of writing to DSP means:
#   show Yellow pixel -- since RGB is (255, 255, 0) -- at column 255, row 0 of the display
```

### 1.4. STC | Stack Counter
Represent how many elements currently exist in the Stack Memory, cannot be manipulated
can only be read

#### Examples
```asm
MOV     STC     ACC     # Copy Values from STC to ACC
```

### 1.5. PRC
Represent which line of program are currently being executed, cannot be manipulated can only be read

#### Examples
```asm
MOV     PRC     ACC     # Copy Values from STC to ACC
```

## 2. Labels


## 3. Instruction Set
### 3.0. NOP
No Operation, literally does nothing, usually for pad a single instruction

### 3.1. MOV
Register Manipulation, copy data from one place to another
```asm
MOV     <SRC>       <DST>
```
- `SRC`: the source of data to copy from, will not change after operation
- `DST`: the destination, the data copied from `SRC` will be stored here

### 3.2. PUSH
Copy a value from one place to stack memory
```asm
PUSH    <SRC>
```
- `SRC`: the source of data to copy from and push into the stack

### 3.3. POP
Getting a value and remove it from stack to `ACC`
```asm
PUSH
```

### 3.4. SWP
Swap value of `ACC` and `BAK`
```asm
SWP
```

### 3.5. SAV
Saving value from `ACC` to `BAK`
```asm
SAV
```

### 3.6. ADD
Add value from Source to `ACC`
```asm
ADD     <SRC>
```
This means
`ACC = ACC + SRC`

### 3.7. SUB
Subtract value from Source to `ACC`
```asm
SUB     <SRC>
```
This means
`ACC = ACC - SRC`

### 3.8. NEG
Negate value of `ACC`
```asm
NEG     <SRC>
```
This means
`ACC = -ACC` or `ACC = ACC * -1`

### 3.9. NOT
Invert ACC
```asm
NOT
```
This means
`ACC = ~ACC`

### 3.10. AND
Logical And between `SRC` and `ACC`
```asm
AND     <SRC>
```
This means
`ACC = SRC & ACC`

### 3.11. OR
Logical Or between `SRC` and `ACC`
```asm
OR     <SRC>
```
This means
`ACC = SRC | ACC`

### 3.12. XOR
Logical Exclusive-Or between `SRC` and `ACC`
```asm
XOR     <SRC>
```
This means
`ACC = SRC ^ ACC`

### 3.13. NAND
Logical Not-And between `SRC` and `ACC`
```asm
NAND     <SRC>
```
This means
`ACC = ~(SRC & ACC)`

### 3.14. NOR
Logical Not-Or between `SRC` and `ACC`
```asm
NOR     <SRC>
```
This means
`ACC = ~(SRC | ACC)`

### 3.15. XNOR
Logical Not-Exclusive-Or between `SRC` and `ACC`
```asm
XNOR     <SRC>
```
This means
`ACC = ~(SRC ^ ACC)`

### 3.16. SHR
Logical Shift-Right `ACC` with `SRC` amount
```asm
SHR     <SRC>
```
This means
`ACC = ACC >> SRC`

### 3.17. SHL
Logical Shift-Left `ACC` with `SRC` amount
```asm
SHL     <SRC>
```
This means
`ACC = SRC << ACC`

### 3.18. JMP
Jump to a label unconditionally
```asm
JMP     <LABEL>
```

### 3.19. JEZ
Jump to a label if `ACC` is Zero
```asm
JEZ     <LABEL>
```

### 3.20. JNZ
Jump to a label if `ACC` is Not Zero
```asm
JNZ     <LABEL>
```

### 3.21. JGZ
Jump to a label if `ACC` is Greater than Zero
```asm
JGZ     <LABEL>
```

### 3.22. JLZ
Jump to a label if `ACC` is Less than Zero
```asm
JLZ     <LABEL>
```

### 3.23. JRO
Jump to an instruction with and OFFSET
```asm
JRO     <OFFSET>
```

### 3.24. HALT
Halt the program, stop executing
```asm
HALT
```

## 3. Stack Memory
- have maximum address of `0xFFFF`, and the stack pointer is `0x0000`
- `0x0000` is the top of the stack, and `0xFFFF` is the bottom of the stack
- `0x0000` is the first element of the stack, and `0xFFFF` is the last element of the stack
- `PUSH` operation will put the value to the top of the stack
- `POP` operation will put the value from the top of the stack to `ACC`
- `STC` register will show how many elements currently exist in the stack memory

## 4. Display
To interact with the display, you can use the `DSP` register, which is a special register that can be manipulated like `ACC`. The display is a 256x256 pixel display, and each pixel can be manipulated by writing to the `DSP` register.

however, the display is not a 2D array, but a 1D array of starting from `0x0000` through `0xFFFF`.
> `0x0000` is the top left corner of the display, and `0xFFFF` is the bottom right corner of the display

therefore, to write to display you need to write 4 times to the `DSP` register, which is:
- 1st Value: coordinate from the top left of the display
- 2nd Value: Red value
- 3nd Value: Green value
- 4th Value: Blue value

every 4 sequence of writing to `DSP` means the display will parse the input and show the pixel accordingly.
with this kind of limitation, colloquially it is required to clean the sequences first before writing to the display, so that the display will not show the previous value.

this is some of the examples of how to clean up sequences:
```asm
_CLEAN_DSP:
        JMP     _CLEAN_DSP_1

_CLEAN_DSP_4:
        # Assume 4 sequence is written to DSP before this
        MOV     0x0000      DSP     # 1st Value: coordinate 0 from the top left of the display
        MOV     0x0000      DSP     # 2nd Value: Red value
        MOV     0x0000      DSP     # 3nd Value: Green value
        MOV     0x0000      DSP     # 4th Value: Blue value

_CLEAN_DSP_3:
        # Assume 3 sequence is written to DSP before this
        MOV     0x0000      DSP     # 4th Value: Blue value
        JMP     _CLEAN_DSP_4

_CLEAN_DSP_2:
        # Assume 2 sequence is written to DSP before this
        MOV     0x0000      DSP     # 3rd Value: Green value
        MOV     0x0000      DSP     # 4th Value: Blue value
        JMP     _CLEAN_DSP_3

_CLEAN_DSP_1:
        # Assume 1 sequence is written to DSP before this
        MOV     0x0000      DSP     # 2nd Value: Red value
        MOV     0x0000      DSP     # 3rd Value: Green value
        MOV     0x0000      DSP     # 4th Value: Blue value
        JMP     _CLEAN_DSP_2
```

