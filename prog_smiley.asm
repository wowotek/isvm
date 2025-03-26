# =-=-=-=-= Architecture =-=-=-=-=
# 16-bit Machine
# Registers:
#   - ACC: Accumulator
#   - BAK: Backup
#   - GPR: General Purpose Register
#   - STC: Stack Counter (length of the stack)
#   - PC: Program Counter


# =-=-=-=-= Program to multiply two numbers =-=-=-=-=

INIT:
	MOV		0x00		ACC
	SAV
	MOV		0x00		GPR
	JMP		RESET_DISPLAY

START:
	MOV		0x00		ACC
	SAV
	MOV		0x00		GPR
DISPLAY:
	ADD		1				    # screen coordinate
	MOV		ACC			DSP
	MOV		0xff		DSP	    # red
	MOV		0x0a		DSP	    # green
	MOV		0x22		DSP	    # blue
	JMP		DISPLAY

RESET_DISPLAY:
	MOV		0x0			DSP
	ADD		1
	SAV
	SUB		4
	JEZ		START
	SWP
	SAV
	JMP		RESET_DISPLAY