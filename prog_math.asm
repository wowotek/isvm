# =-=-=-=-= Architecture =-=-=-=-=
# 16-bit Machine
# Registers:
#   - ACC: Accumulator
#   - BAK: Backup
#   - GPR: General Purpose Register
#   - STC: Stack Counter (length of the stack)
#   - PC: Program Counter


# =-=-=-=-= Program to multiply two numbers =-=-=-=-=
# Prepare 2 Arguments into Stack
PUSH        64
PUSH        8
JMP         MULTIPLY
	FINISH_MULTIPLY:
PUSH		333
PUSH		333
HALT


# =-=-=-=-= Multiply 2 value from Stack =-=-=-=-=
MULTIPLY:
	# Prepare:
	#   - Assume ACC and BAK is empty / random value in this context, since this subroutine can be called anytime
	MOV		0x00		ACC		# ACC = 0
	SAV							# Save ACC to BAK (0, 0)
	POP							# Pop the first argument into ACC (3, 0)
	SWP							# Swap from ACC <-> BAK (0, 3)
	POP							# Pop the second argument into ACC (5, 3)
	MOV		ACC			GPR		# GPR = 0
	SWP
	SUB 	1
	SWP

__MULTIPLY_LOOP:
	ADD		GPR
	SWP
	SUB		1
	JEZ		__MULTIPLY_END
	SWP
	JMP		__MULTIPLY_LOOP

__MULTIPLY_END:
	SWP
	SAV
	PUSH	ACC
	JMP		FINISH_MULTIPLY
