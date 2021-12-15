import argparse
from PIL import Image
    
def save_as_gif(args):
    with Image.open(args.filename) as icon:
        icon.save(args.filename[:-3] + "gif")

def mult_color(args):
    def filter(x):
        if x == 0: return 0
        if x == 255: return 255
        return x * args.factor
    
    with Image.open(args.filename).convert("RGB") as icon:
        icon = icon.point(filter)
        if args.save: icon.save(args.filename)
        else: icon.show()

def increase_color(args):
    def filter(x):
        if x == 0: return 0
        if x == 255: return 255
        return x + int((x/255.0)*args.factor)
    
    with Image.open(args.filename).convert("RGB") as icon:
        icon = icon.point(filter)
        if args.save: icon.save(args.filename)
        else: icon.show()

def change_channel(img, mode, ch, lut):
    bands = list(img.split())
    bands[ch] = bands[ch].point(lut)
    img = Image.merge(mode, bands)
    return img

def change_hue(args):
    with Image.open(args.filename).convert("RGB").convert("HSV") as icon:
        icon = change_channel(icon, "HSV", 0, lambda x: x + int(args.factor) % 255)
        if args.save: icon.save(args.filename)
        else: icon.show()

def change_sat(args):
    with Image.open(args.filename).convert("RGB").convert("HSV") as icon:
        icon = change_channel(icon, "HSV", 1, lambda x: x + int(args.factor))
        if args.save: icon.save(args.filename)
        else: icon.show()

def change_val(args):
    with Image.open(args.filename).convert("RGB").convert("HSV") as icon:
        icon = change_channel(icon, "HSV", 2, lambda x: x + int(args.factor))
        if args.save: icon.save(args.filename)
        else: icon.show()

def main():
    functions = {
        "gif": save_as_gif,
        "col-m": mult_color,
        "col-i": increase_color,
        "hue": change_hue,
        "sat": change_sat,
        "val": change_val,
    }
    
    parser = argparse.ArgumentParser(description="Process icons.")
    parser.add_argument("filename", type=str)
    parser.add_argument("mode", choices=list(functions.keys()))
    parser.add_argument("factor", type=float)
    parser.add_argument("--save", action="store_true")
    args = parser.parse_args()
    
    functions[args.mode](args)
    
if __name__ == "__main__": main()