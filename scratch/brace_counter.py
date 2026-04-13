import sys

def count_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    braces = 0
    parens = 0
    cur_line = 1
    
    for char in content:
        if char == '{': braces += 1
        if char == '}': braces -= 1
        if char == '(': parens += 1
        if char == ')': parens -= 1
        
        if braces < 0:
            print(f"Extra closing brace at char {brackets}?") # typo in my thought
        if parens < 0:
            pass
            
    print(f"Braces: {braces}")
    print(f"Parens: {parens}")

if __name__ == "__main__":
    count_braces(sys.argv[1])
