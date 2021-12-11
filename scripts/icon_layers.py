import csv
from glob import iglob
from os.path import basename, splitext

from PIL import Image

icons = {}
for icon_file in iglob("scripts/tile_icons/*.gif"):
    icons[basename(splitext(icon_file)[0])] = Image.open(icon_file)
    
def add_icon(layer, coords, icon):
    if icon not in icons:
        print(f"\"{icon}\" not in icons", end="\t")
        return 0
    
    x, y = coords
    x0 = 5
    y0 = 0
    stride = 24
    layer.paste(icons[icon], (x0 + x*stride, y0 + y*stride))
    
    return 1

def icon_layer(plane, tile_data):
    base = Image.open(f"{plane}/Base.png")
    layer = Image.new("RGBA", base.size, "#00000000")
    base.close()
    
    for tile in tile_data.items():
        if not add_icon(layer, *tile):
            layer.close()
            return None
    
    return layer

if __name__ == "__main__":
    # skyscrapers_data = {
        # (39, 37): "skyscraper",
        # (43, 38): "skyscraper",
        # (11, 31): "control spire",
    # }
    # icon_layer("Cordillera", "Skyscrapers", skyscrapers_data, enabled_by_default=False)

    tiles = {}
    split_tiles = {}
    layer_names = set()
    plane = "Cordillera"

    with open(f"scripts/{plane}.tsv", mode="rt", encoding="utf8") as tsvfile:
        data = list(csv.reader(tsvfile, delimiter="\t"))
        for i in range(1, len(data)):
            for j in range(len(data[i])):
                if data[i][j] != "":
                    fulltile = data[i][j]
                    tiletype = data[i][j].split("(Vortex to")[0].split(",")[-1].split("a ")[-1].split("an ")[-1].split("🅿️")[0].split("PORTAL to")[0]
                    tiletype = tiletype.strip()
                    
                    tiles[(j+1, i+1)] = tiletype
                    
                    if tiletype not in split_tiles: split_tiles[tiletype] = {}
                    split_tiles[tiletype][(j+1, i+1)] = tiletype

    for tiletype in tiles.values():
        layer_names.add(tiletype)
    
    ## Add combined layers
    combined_layers = [
        ("Medical", "Pharmacy", "Hospital", "Drugstore", "Genetic Engineering Clinic", "Research Station"),
        ("Tools & Weapons", "Gun Store", "Sporting Goods Store", "Hardware Store", "Museum"),
        ("Emergency Stations", "Police Station", "Fire Station", "Ranger Station"),
        ("Industrial", "Factory", "Junkyard"),
        ("Convenience", "Corner Store", "Supermarket", "Gas Station"),
        ("Food", "Restaurant", "Bakery", "Coffee Shop"),
        ("Booze", "Bar", "Nightclub"),
        ("Temples", "Church", "Mosque", "Shrine", "Synagogue"),
        ("Education", "School", "University"),
        ("Residential & Offices", "House", "Apartment Building", "Office Building", "Dormitory", "Mansion", "Chateau", "Townhouse", "Castle", "Lodge"),
        ("Skyscrapers", "Skyscraper", "Control Spire"),
        # ("Greenery & Plantations", "Field", "Cropland", "Orchard", "Grassland", "Forest", "Park", "Apple Orchard", "Golf Course"),
        ("Mountains", "Mountain", "Mountain Summit"),
        ("Fashion", "Mall", "Shoe Shop", "Bazaar", "Costume Shop"),
        ("Burial", "Mausoleum", "Cemetery"),
        # ("Water", "Pond", "Lake"),
        ("Zoo", "Zoo", "Zoo Aviary"),
    ]
    for CL in combined_layers:
        for L in CL[1:]:
            layer_names.remove(L)
        layer_names.add(CL)
    
    layers = []
    for layer_name in layer_names:
        if isinstance(layer_name, tuple):
            layer_tiles = {}
            for tiletype in layer_name[1:]:
                layer_tiles.update(split_tiles[tiletype])
                
            layer = icon_layer(plane, layer_tiles)
            if layer is not None:
                layers.append(layer)
                layer.save(f"{plane}/{layer_name[0]}.png")
            else: print(f"Failed to create {layer_name[0]}")
            
        else:
            layer = icon_layer(plane, split_tiles[layer_name])
            if layer is not None:
                layers.append(layer)
                layer.save(f"{plane}/{layer_name}.png")
            else: print(f"Failed to create {layer_name}")
    
    composite = Image.open(f"{plane}/Base.png")
    for layer in layers:
        composite = Image.alpha_composite(composite, layer)
    composite.show()
    composite.save(f"{plane}/{plane}.png")
    composite.close()
    
    for layer in layers:
        layer.close()
    