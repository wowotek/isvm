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
	PUSH	0x05
	JMP		_CLEAN_DSP

START:
	MOV		0x2ff		ACC		# Start at 0x2ff coordinate
	SAV
	MOV		0x00		GPR

DISPLAY:
	ADD		1				    # screen coordinate
	MOV		ACC			DSP
	MOV		0xff		DSP	    # red
	MOV		0x0a		DSP	    # green
	MOV		0x22		DSP	    # blue
	JMP		DISPLAY

# =-=-=-=-= Program to clear the display =-=-=-=-=
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