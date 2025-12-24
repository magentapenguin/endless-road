import os, shutil

os.system("npm run build")

shutil.make_archive("endless-road", "zip", "dist")

os.system("butler push endless-road.zip magentapenguin/endless-road:browser")