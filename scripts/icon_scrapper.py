from urllib.request import urlopen, urlretrieve
from bs4 import BeautifulSoup
from os.path import isfile

def scrap(baseurl, tail):
    webpage = urlopen(baseurl + tail)
    body = BeautifulSoup(webpage, "html.parser").body
    location_groups = body.find_all("div", class_="mw-category-group")
    locations = [(location["href"], location["title"]) for group in location_groups for location in group.find_all("a")]

    for location in locations:
        if isfile(f"scripts/tile_icons/{location[1]}.gif"):
            continue
        print(f"{location[1]:40}", end=" ")
        webpage = urlopen(f"{baseurl}/{location[0]}")
        body = BeautifulSoup(webpage, "html.parser").body
        try:
            icon = body.find("img", height=18)["src"]
            urlretrieve(f"{baseurl}/{icon}", f"scripts/tile_icons/{location[1]}.gif")
        except:
            print("<<Error downloading>>", end="")
        print()

def main():
    baseurl = "https://wiki.nexusclash.com"
    scrap(baseurl, "/wiki/Category:Current_Locations")
    scrap(baseurl, "/wiki/Category:Current_Locations?pagefrom=Townhouse#mw-pages")

if __name__ == "__main__": main()