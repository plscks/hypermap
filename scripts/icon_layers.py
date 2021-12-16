import csv
from dataclasses import dataclass
from glob import iglob
from os.path import basename, splitext

from PIL import Image, ImageDraw, ImageFont

@dataclass
class NexusMap:
    last_column       : int
    last_row          : int
    first_column      : int = 1
    first_row         : int = 1
    lateral_margin    : int = 30
    top_bottom_margin : int = 24
    cell_width        : int = 24
    size              : (int, int) = (-1, -1)
    
    def get_left_x(self, column):
        return self.lateral_margin + self.cell_width * (column - self.first_column)
    def get_top_y(self, row):
        return self.top_bottom_margin + self.cell_width * (row - self.first_row)
    
    # tile_types: A dict listing the type of tile and their position
    # background_colors: A dict listing the background color of each type of type of tile
    # center_background: The background of the central part of the map. It is displayed where there are no tiles
    # y_align is either "center" or "inner_border"
    def base_layer(self, tile_types, background_colors, center_background = "555F", y_align = "center"):
        column_count  = self.last_column - self.first_column + 1
        row_count     = self.last_row    - self.first_row    + 1
        half_lateral_extra = (self.lateral_margin - self.cell_width) // 2
        C, R = self.last_column + 1, self.last_row + 1
        self.size = (2 * self.lateral_margin + column_count * self.cell_width, 2 * self.top_bottom_margin + row_count * self.cell_width)
        
        # Creates a black image, adds a gray "center" to it, which occupies everything but the black margins
        base  = Image.new("RGBA", self.size, "#000F")
        with Image.new("RGBA", (column_count * self.cell_width, row_count * self.cell_width), center_background) as base_center:
            base.paste(base_center, (self.lateral_margin, self.top_bottom_margin))
        
        draw = ImageDraw.Draw(base)
        fnt = ImageFont.truetype("scripts/FreeMonoBold.ttf", 16)
        
        # Write x coordinates at upper and lower margins, then draw vertical lines
        for i in range(self.first_column, self.last_column + 1):
            draw.text((self.get_left_x(i) + self.cell_width//2,                     self.top_bottom_margin//2), str(i), fill="white", anchor="mm", font=fnt)
            draw.text((self.get_left_x(i) + self.cell_width//2, self.get_top_y(R) + self.top_bottom_margin//2), str(i), fill="white", anchor="mm", font=fnt)
            
            draw.line([(self.get_left_x(i), self.top_bottom_margin), (self.get_left_x(i), self.get_top_y(R))], fill="black", width=1)
        draw.line(    [(self.get_left_x(C), self.top_bottom_margin), (self.get_left_x(C), self.get_top_y(R))], fill="black", width=1)
        
        # Write y coordinates at left and right margins, then draw horizontal lines
        y_align = "center"
        for i in range(self.first_row, self.last_row + 1):
            if y_align == "inner_border":
                draw.text((self.cell_width    + self.half_lateral_extra , self.get_top_y(i) + self.top_bottom_margin//2), str(i), fill="white", anchor="rm", font=fnt)
                draw.text((self.get_left_x(C) + self.half_lateral_extra , self.get_top_y(i) + self.top_bottom_margin//2), str(i), fill="white", anchor="lm", font=fnt)
            if y_align == "center":
                draw.text((                     self.lateral_margin//2, self.get_top_y(i) + self.top_bottom_margin//2), str(i), fill="white", anchor="mm", font=fnt)
                draw.text((self.get_left_x(C) + self.lateral_margin//2, self.get_top_y(i) + self.top_bottom_margin//2), str(i), fill="white", anchor="mm", font=fnt)
                
            draw.line([(self.lateral_margin, self.get_top_y(i)), (self.get_left_x(C), self.get_top_y(i))], fill="black", width=1)
        draw.line(    [(self.lateral_margin, self.get_top_y(R)), (self.get_left_x(C), self.get_top_y(R))], fill="black", width=1)
        
        # Color the background of tiles we have info on
        for i in range(self.first_column, self.last_column + 1):
            for j in range(self.first_row, self.last_row + 1):
                if (i, j) in tile_types:
                    top_left     = (self.get_left_x(i  ) + 1, self.get_top_y(j  ) + 1)
                    bottom_right = (self.get_left_x(i+1) - 1, self.get_top_y(j+1) - 1)
                    
                    color = "#000000FF"
                    if tile_types[(i, j)] in background_colors:
                        color = background_colors[tile_types[(i, j)]] + "FF"
                        
                    draw.rectangle([top_left, bottom_right], fill=color)
        
        return base
    
    # layer_data: A dict listing the type of tile and their position
    def icon_layer(self, layer_data):
        def add_icon(layer, x, y, icon):
            if icon not in icons: return 0
            layer.paste(icons[icon], (self.get_left_x(x)+6, self.get_top_y(y)+1))
            return 1
        
        layer = Image.new("RGBA", self.size, "#0000")
        layer_empty = True
        
        for tile in layer_data:
            if add_icon(layer, *tile, layer_data[tile]):
                layer_empty = False
        
        if not layer_empty: return layer
        layer.close()
        return None
    
    def combined_icon_layers(self, layer_list, split_layer_data):
        layer_tiles = {}
        for tile_type in layer_list:
            if tile_type in split_layer_data:
                layer_tiles.update(split_layer_data[tile_type])
            
        return self.icon_layer(layer_tiles)

def load_icons(location):
    global icons
    icons = {}
    for icon_file in iglob(f"{location}*.gif"):
        icons[basename(splitext(icon_file)[0])] = Image.open(icon_file)

def close_icons():
    for icon in icons:
        icons[icon].close()

def get_tile_type_data(plane):
    tile_types = __import__("data.tile_data", globals(), locals(), [plane], 0).__annotations__[plane]["tile_types"]
    
    split_tile_types = {}
    for tile in tile_types:
        tile_type = tile_types[tile]
        if tile_type not in split_tile_types: split_tile_types[tile_type] = {}
        split_tile_types[tile_type][tile] = tile_type
    
    # tile_types = {}
    # split_tile_types = {}
    # with open(f"scripts/{plane}.tsv", mode="rt", encoding="utf8") as tsvfile:
        # data = list(csv.reader(tsvfile, delimiter="\t"))
        # for i in range(1, len(data)):
            # for j in range(len(data[i])):
                # if data[i][j] != "":
                    # fulltile = data[i][j]
                    # parking_p = "\U0001f17f\ufe0f"
                    # tile_type = data[i][j].split("(Vortex to")[0].split(",")[-1].split("a ")[-1].split("an ")[-1].split("PORTAL to")[0].split(parking_p)[0]
                    # tile_type = tile_type.strip()
                    
                    # tile_types[(j+1, i+1)] = tile_type
                    
                    # if tile_type not in split_tile_types: split_tile_types[tile_type] = {}
                    # split_tile_types[tile_type][(j+1, i+1)] = tile_type
    
    return tile_types, split_tile_types

def add_combined_layers(layer_names):
    from data.combined_layers import combined_layers
    
    for CL in combined_layers:
        layer_is_present = False
        for L in CL[1:]:
            if L in layer_names:
                layer_names.remove(L)
                layer_is_present = True
        if layer_is_present: layer_names.add(CL)
    
    return layer_names

def icon_layers(plane, **map_specifications):
    from data.background_colors import background_colors
    
    tile_types, split_tile_types = get_tile_type_data(plane)
    layer_names = set()
    for tile_type in split_tile_types:
        layer_names.add(tile_type)
    layer_names = add_combined_layers(layer_names)
    
    NM = NexusMap(**map_specifications)
    base = NM.base_layer(tile_types, background_colors, "#000F")
    
    layers = []
    for layer_name in layer_names:
        if isinstance(layer_name, tuple):
            layer = NM.combined_icon_layers(layer_name[1:], split_tile_types)
            layer_name = layer_name[0]
        else:
            layer = NM.icon_layer(split_tile_types[layer_name])
        
        if layer is not None:
            layers.append(layer)
            layer.save(f"{plane}/{layer_name}.png")
        else: print(f"Failed to create {layer_name} layer")
    
    composite = base.copy()
    for layer in layers:
        composite = Image.alpha_composite(composite, layer)
    # composite.show()
    base.save(f"{plane}/base.png")
    composite.save(f"{plane}/{plane}.png")
    
    composite.close()
    base.close()
    for layer in layers:
        layer.close()
    
    print(f"Successfully created {plane} map")

def main():
    load_icons("scripts/tile_icons/")
    
    icon_layers(
        plane = "Cordillera",
        first_column = 1,
        last_column = 71,
        first_row = 1,
        last_row = 53,
        lateral_margin = 30,
        top_bottom_margin = 24,
        cell_width = 24
    )
    
    close_icons()

if __name__ == "__main__": main()
    