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
    PUSH        5               # Push 5 onto the stack
	PUSH        3               # Push 3 onto the stack


# Subroutine of Multiply 2 value from Stack
MULTIPLY:
	# Prepare:
	#   - Assume ACC and BAK is empty / random value in this context, since this subroutine can be called anytime
	POP							# Pop the first argument into ACC (3, 0)
	SWP							# Swap from ACC <-> BAK (0, 3)
	POP							# Pop the second argument into ACC (5, 3)

	# STATE:
	# ACC = 5
	# BAK = 3

	PUSH		ACC               # Push 0 onto the stack



END:
	PUSH        R3              # Push the result onto the stack