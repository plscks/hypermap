import csv
import sys

if len(sys.argv) < 2:
    print(f"USAGE: python3 {sys.argv[0]} Plane")
    exit(-1)

plane = "_".join(sys.argv[1:]).replace(" ", "_")

tile_types = {}
tile_names = {}
split_tile_types = {}
parking_p = "\U0001f17f\ufe0f"

errorlist = []
corrections = {}
# errorlist = [(27, 31), (11, 32), (34, 22), (31, 23), (41, 17), (31, 39)]
# corrections = {
    # (41, 17): ("Choral Forest Transporter", "Transporter"),
    # (34, 22): ("Choral Forest Hydropower", "Power Plant"),
    # (31, 23): ("Merrior Hydropower", "Power Plant"),
    # (27, 31): ("Praxis Transporter", "Transporter"),
    # (11, 32): ("Great Plains Transporter", "Transporter"),
    # (31, 39): ("Praxis Hydropower", "Power Plant")
# }

with open(f"scripts/{plane}.tsv", mode="rt", encoding="utf8") as tsvfile:
    data = list(csv.reader(tsvfile, delimiter="\t"))
    for i in range(1, len(data)):
        for j in range(len(data[i])):
            if data[i][j] != "":
                full_tile = data[i][j]
                purged_tile = full_tile\
                    .split("(Vortex to")[0]\
                    .split(parking_p)[0]\
                    .split("PORTAL to")[0].strip()
                
                tile_name = ",".join(purged_tile.split(",")[:-1])
                tile_name = ")".join(tile_name.split("), "))
                tile_name = ")".join(tile_name.split(")")[1:]).strip()
                
                tile_type = purged_tile\
                    .split(",")[-1]\
                    .split("a ")[-1]\
                    .split("an ")[-1]\
                    .strip()
                
                if (j+1, i+1) in errorlist:
                    tile_name, tile_type = corrections[(j+1, i+1)]
                
                if tile_name != "": tile_names[(j+1, i+1)] = tile_name
                tile_types[(j+1, i+1)] = tile_type
                
                if tile_type not in split_tile_types: split_tile_types[tile_type] = {}
                split_tile_types[tile_type][(j+1, i+1)] = tile_type

T = "    "
open = "{"
close = "}"
print(f"{plane}: {open}")
print(f"{T}\"tile_names\": {open}")
for tile in tile_names:
    print(f"{T}{T}{tile}: \"{tile_names[tile]}\",")
print(f"{T}{close},")
print(f"{T}\"tile_types\": {open}")
for tile in tile_types:
    print(f"{T}{T}{tile}: \"{tile_types[tile]}\",")
print(f"{T}{close},")
print("}")
