from urllib.request import urlopen, urlretrieve
from bs4 import BeautifulSoup
from os.path import isfile

baseurl = "https://wiki.nexusclash.com"

url = urlopen(f"{baseurl}/wiki/Category:Valhalla_Locations")
body = BeautifulSoup(url, "html.parser").body
location_groups = body.find_all("div", class_="mw-category-group")
locations = [(location["href"], location["title"]) for group in location_groups for location in group.find_all("a")]

for location in locations:
    if isfile(f"scripts/tile_icons/{location[1]}.gif"):
        continue
    print(location[1], end="")
    url = urlopen(f"{baseurl}/{location[0]}")
    body = BeautifulSoup(url, "html.parser").body
    try:
        icon = body.find("img", height=18)["src"]
        urlretrieve(f"{baseurl}/{icon}", f"scripts/tile_icons/{location[1]}.gif")
    except:
        print("\t<<Error downloading>>", end="")
    print()